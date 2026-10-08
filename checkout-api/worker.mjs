import { CheckoutError, normaliseCart, normaliseRecipient, calculateQuote, squareOrder, dispatch } from './core.mjs';

const SQUARE_API = 'https://connect.squareupsandbox.com';
const VERSION = '2026-09-16';
const encoder = new TextEncoder();
const encode = value => btoa(String.fromCharCode(...encoder.encode(value))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const decode = value => new TextDecoder().decode(Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), char => char.charCodeAt(0)));
const signingKey = secret => crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
export async function signQuote(payload, secret) {
  const body = encode(JSON.stringify(payload));
  const signature = await crypto.subtle.sign('HMAC', await signingKey(secret), encoder.encode(body));
  const sig = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return body + '.' + sig;
}
export async function verifyQuote(token, secret, { allowExpired = false } = {}) {
  try {
    if (typeof token !== 'string' || token.length > 8000) throw new Error();
    const [body, signature, extra] = token.split('.');
    if (extra || !body || !signature) throw new Error();
    const bytes = Uint8Array.from(atob(signature.replace(/-/g, '+').replace(/_/g, '/')), char => char.charCodeAt(0));
    if (!await crypto.subtle.verify('HMAC', await signingKey(secret), bytes, encoder.encode(body))) throw new Error();
    const payload = JSON.parse(decode(body));
    if (payload.version !== 1 || !Number.isFinite(payload.expiresAt) || !/^[0-9a-f-]{36}$/.test(payload.id)) throw new Error();
    if (!allowExpired && payload.expiresAt < Date.now()) throw new CheckoutError('Your delivery quote expired. Check delivery again.', 409, 'QUOTE_EXPIRED');
    return payload;
  } catch (error) { if (error instanceof CheckoutError) throw error; throw new CheckoutError('Your checkout quote has changed. Check delivery again.', 409, 'QUOTE_INVALID'); }
}
async function square(env, path, body) {
  const response = await fetch(SQUARE_API + path, { method: 'POST', headers: { Authorization: 'Bearer ' + env.SQUARE_ACCESS_TOKEN, 'Content-Type': 'application/json', 'Square-Version': VERSION }, body: JSON.stringify(body), signal: AbortSignal.timeout(20000) });
  const data = await response.json();
  if (!response.ok) {
    console.warn('Square Sandbox request failed', path, data.errors?.map(error => error.code).join(','));
    const declined = data.errors?.some(error => error.category === 'PAYMENT_METHOD_ERROR');
    throw new CheckoutError(declined ? 'Square declined the test payment. Check delivery again to start a new payment attempt.' : 'Square could not complete this test payment. Retry the same payment to check its outcome.', declined ? 402 : 502);
  }
  return data;
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const allowed = (env.ALLOWED_ORIGINS || '').split(',');
    const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Vary': 'Origin' };
    if (allowed.includes(origin)) Object.assign(headers, { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
    const respond = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });
    if (request.method === 'OPTIONS') return new Response(null, { status: allowed.includes(origin) ? 204 : 403, headers });
    if (origin && !allowed.includes(origin)) return respond({ error: 'This test checkout is available on the Ventura test site.' }, 403);
    try {
      if (!env.SQUARE_APPLICATION_ID?.startsWith('sandbox-') || !env.SQUARE_LOCATION_ID || !env.SQUARE_ACCESS_TOKEN || !env.QUOTE_SECRET) throw new CheckoutError('Square Sandbox is not connected yet.', 503);
      const path = new URL(request.url).pathname;
      if (request.method === 'GET' && path === '/config') return respond({ mode: 'sandbox', applicationId: env.SQUARE_APPLICATION_ID, locationId: env.SQUARE_LOCATION_ID, dispatchPostcode: dispatch.postcode, radiusMiles: dispatch.radiusMiles });
      if (request.method !== 'POST' || !['/quote', '/payment'].includes(path)) return respond({ error: 'Not found.' }, 404);
      if (!request.headers.get('Content-Type')?.startsWith('application/json')) throw new CheckoutError('Send a JSON request.');
      const bodyText = await request.text();
      if (bodyText.length > 12000) throw new CheckoutError('Checkout request is too large.');
      const body = JSON.parse(bodyText);
      if (path === '/quote') {
        if (body.discountCode) throw new CheckoutError('Live discount codes cannot be redeemed in this Sandbox test.');
        const cart = normaliseCart(body.cart), recipient = normaliseRecipient(body.recipient);
        const lookup = await fetch('https://api.postcodes.io/postcodes/' + encodeURIComponent(recipient.postcode), { signal: AbortSignal.timeout(8000) });
        if (lookup.status === 404) throw new CheckoutError('That postcode was not found. Check the full delivery postcode.');
        if (!lookup.ok) throw new CheckoutError('Postcode checking is temporarily unavailable. Try again.', 503);
        const { result } = await lookup.json();
        recipient.postcode = result.postcode;
        const quote = calculateQuote(cart, result, body.deliveryMethod);
        const payload = { version: 1, id: crypto.randomUUID(), expiresAt: Date.now() + 15 * 60 * 1000, cart, recipient, quote };
        return respond({ quote, token: await signQuote(payload, env.QUOTE_SECRET), expiresAt: payload.expiresAt });
      }
      const payload = await verifyQuote(body.quoteToken, env.QUOTE_SECRET, { allowExpired: true });
      if (typeof body.sourceId !== 'string' || body.sourceId.length < 5 || body.sourceId.length > 300) throw new CheckoutError('Square could not read the test card.');
      if (!env.DB) throw new CheckoutError('Payment recovery is not connected yet.', 503);
      let attempt = await env.DB.prepare('SELECT * FROM payment_attempts WHERE quote_id = ?').bind(payload.id).first();
      if (!attempt) {
        if (payload.expiresAt < Date.now()) throw new CheckoutError('Your delivery quote expired before payment started. Check delivery again.', 409, 'QUOTE_EXPIRED');
        // The first card token is saved atomically before contacting Square. An expired
        // quote can only resume that existing attempt, never start a new payment.
        await env.DB.prepare('INSERT OR IGNORE INTO payment_attempts (quote_id, source_id, started_at) VALUES (?, ?, ?)').bind(payload.id, body.sourceId, Date.now()).run();
        attempt = await env.DB.prepare('SELECT * FROM payment_attempts WHERE quote_id = ?').bind(payload.id).first();
      }
      if (attempt.status === 'paid') return respond(JSON.parse(attempt.result_json));
      if (attempt.status === 'declined') throw new CheckoutError('Square declined this test payment. Check delivery again to start a new attempt.', 402);
      // Both keys derive from the signed quote, never from client-supplied prices or keys.
      // Retrying the same quote and card token returns the same Square payment.
      const { order } = await square(env, '/v2/orders', { idempotency_key: 'o-' + payload.id, order: squareOrder(payload, env.SQUARE_LOCATION_ID) });
      if (order.total_money?.amount !== payload.quote.total || order.total_money?.currency !== 'GBP') throw new CheckoutError('The Square total does not match your delivery quote.', 502);
      const { recipient: r, quote: q } = payload;
      let payment;
      try { ({ payment } = await square(env, '/v2/payments', {
        source_id: attempt.source_id, idempotency_key: 'p-' + payload.id, amount_money: { amount: q.total, currency: 'GBP' },
        location_id: env.SQUARE_LOCATION_ID, order_id: order.id, autocomplete: true,
        buyer_email_address: r.email, shipping_address: { first_name: r.givenName, last_name: r.familyName, address_line_1: r.addressLine1, address_line_2: r.addressLine2, locality: r.city, postal_code: r.postcode, country: 'GB' },
        note: `SANDBOX Super Seamoss: ${q.method} delivery to ${r.postcode}`
      })); } catch (error) {
        if (error.status === 402) await env.DB.prepare("UPDATE payment_attempts SET status = 'declined', source_id = NULL WHERE quote_id = ? AND status = 'pending'").bind(payload.id).run();
        throw error;
      }
      if (payment.status !== 'COMPLETED') throw new CheckoutError('Square has not confirmed this payment yet. Retry the same payment to check its outcome.', 409);
      const result = { mode: 'sandbox', paymentId: payment.id, orderId: order.id, status: payment.status, receiptUrl: payment.receipt_url, total: q.total, method: q.method, postcode: r.postcode };
      await env.DB.prepare("UPDATE payment_attempts SET status = 'paid', source_id = NULL, result_json = ? WHERE quote_id = ?").bind(JSON.stringify(result), payload.id).run();
      return respond(result);
    } catch (error) {
      if (error instanceof CheckoutError) return respond({ error: error.message, code: error.code }, error.status);
      if (error instanceof RangeError) return respond({ error: 'Choose an available jar size and quantity.' }, 400);
      if (error instanceof SyntaxError) return respond({ error: 'Invalid checkout request.' }, 400);
      return respond({ error: 'The test checkout could not reach Square or the postcode service. Retry the same payment if you already submitted it.' }, 503);
    }
  }
};

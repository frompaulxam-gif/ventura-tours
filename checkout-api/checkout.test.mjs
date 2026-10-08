import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { signQuote, verifyQuote } from './worker.mjs';
import { dispatch, normaliseCart, normalisePostcode, calculateQuote, squareOrder } from './core.mjs';

const cart = normaliseCart({ size: '330ml', quantity: 1, blends: [{ id: 'manuka-glow', recipe: 'honey-lemon' }], total: 1 });
const centre = { ...dispatch, country: 'England' };
const atMiles = miles => ({ country: 'England', latitude: dispatch.latitude + miles / 3958.7613 * 180 / Math.PI, longitude: dispatch.longitude });
const recipient = { givenName: 'Checkout', familyName: 'Test', email: 'checkout@example.com', phone: '07700900000', addressLine1: 'Test delivery address', addressLine2: '', city: 'Birmingham', postcode: 'B36 0PF' };
const env = { SQUARE_APPLICATION_ID: 'sandbox-example', SQUARE_LOCATION_ID: 'test-location', SQUARE_ACCESS_TOKEN: 'fake-private-token', QUOTE_SECRET: 'unit-test-only-secret', ALLOWED_ORIGINS: 'https://venturasolutions.co.uk' };
const request = (path, body, origin = 'https://venturasolutions.co.uk') => new Request('https://test.invalid' + path, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

test('local radius uses the full postcode and rejects just outside 10 miles', () => {
  assert.equal(normalisePostcode('b36 0pf'), 'B36 0PF');
  assert.throws(() => normalisePostcode('B36'));
  assert.equal(calculateQuote(cart, atMiles(9.9999), 'local').delivery, 500);
  assert.throws(() => calculateQuote(cart, atMiles(10.0001), 'local'), /outside/);
  assert.equal(calculateQuote(cart, atMiles(10.0001)).method, 'shipping');
  assert.equal(calculateQuote(cart, centre).total, 3000);
});
test('national rates, special jars and bundle prices remain authoritative', () => {
  assert.equal(calculateQuote(cart, atMiles(20)).total, 3495);
  const pair = normaliseCart({ size: '330ml', quantity: 2, blends: [{ id: 'manuka-glow' }, { id: 'king-strength' }] });
  assert.equal(calculateQuote(pair, centre, 'shipping').total, 5000);
  assert.equal(calculateQuote(pair, centre, 'local').total, 5500);
  const ocean = normaliseCart({ size: '330ml', quantity: 1, blends: [{ id: 'ocean-gold' }] });
  assert.equal(calculateQuote(ocean, centre).total, 2000);
  assert.throws(() => normaliseCart({ size: '141ml', quantity: 3, blends: [{ id: 'manuka-glow' }, { id: 'manuka-glow' }, { id: 'king-strength' }] }), /different/);
  assert.throws(() => normaliseCart({ size: '720ml', quantity: 4, blends: [] }));
  assert.throws(() => calculateQuote(cart, { ...centre, country: 'Northern Ireland' }));
});
test('address, blend recipe and local courier instructions survive into the Square order', () => {
  const order = squareOrder({ id: 'test', cart, recipient, quote: calculateQuote(cart, centre) }, 'test-location');
  assert.equal(order.line_items[0].base_price_money.amount, 2500);
  assert.match(order.line_items[0].note, /Expecting Mother Edition/);
  assert.equal(order.fulfillments[0].shipment_details.recipient.address.postal_code, 'B36 0PF');
  assert.match(order.fulfillments[0].shipment_details.shipping_note, /Local delivery/);
  assert.equal(order.line_items[1].base_price_money.amount, 500);
});
test('signed quotes reject changed prices, changed delivery addresses and expiry', async () => {
  const payload = { version: 1, id: crypto.randomUUID(), expiresAt: Date.now() + 10000, cart, recipient, quote: calculateQuote(cart, centre) };
  const token = await signQuote(payload, env.QUOTE_SECRET);
  assert.deepEqual(await verifyQuote(token, env.QUOTE_SECRET), payload);
  const [encoded, signature] = token.split('.');
  const changed = JSON.parse(Buffer.from(encoded, 'base64url').toString());
  changed.quote.total = 1; changed.recipient.postcode = 'E1 6AN';
  await assert.rejects(verifyQuote(Buffer.from(JSON.stringify(changed)).toString('base64url') + '.' + signature, env.QUOTE_SECRET));
  await assert.rejects(verifyQuote(await signQuote({ ...payload, expiresAt: Date.now() - 1 }, env.QUOTE_SECRET), env.QUOTE_SECRET));
});
test('checkout denies other browser origins and live voucher redemption', async () => {
  assert.equal((await worker.fetch(request('/quote', {}, 'https://unrelated.example'), env)).status, 403);
  const result = await worker.fetch(request('/quote', { cart, recipient, discountCode: 'DEMO-SHIPPING' }), env);
  assert.equal(result.status, 400);
});
test('payment uses the signed address and amount; retries keep the same Square idempotency keys', async () => {
  const originalFetch = globalThis.fetch; const calls = [];
  globalThis.fetch = async (url, init) => {
    if (url.startsWith('https://api.postcodes.io/')) return Response.json({ result: { ...centre, postcode: 'B36 0PF' } });
    const body = JSON.parse(init.body); calls.push({ url, body });
    if (url.endsWith('/orders')) return Response.json({ order: { id: 'test-order', total_money: { amount: 3000, currency: 'GBP' } } });
    return Response.json({ payment: { id: 'test-payment', status: 'COMPLETED' } });
  };
  try {
    const quoteResponse = await worker.fetch(request('/quote', { cart, recipient, deliveryMethod: 'local', total: 1 }), env);
    const quote = await quoteResponse.json(); assert.equal(quote.quote.total, 3000);
    for (let i = 0; i < 2; i++) {
      const result = await worker.fetch(request('/payment', { quoteToken: quote.token, sourceId: 'test-card-token', total: 1, recipient: { postcode: 'E1 6AN' } }), env);
      assert.equal(result.status, 200); assert.equal((await result.json()).total, 3000);
    }
    assert.equal(calls[0].body.idempotency_key, calls[2].body.idempotency_key);
    assert.equal(calls[1].body.idempotency_key, calls[3].body.idempotency_key);
    assert.equal(calls[1].body.amount_money.amount, 3000);
    assert.equal(calls[1].body.shipping_address.postal_code, 'B36 0PF');
    assert.match(calls[1].url, /^https:\/\/connect\.squareupsandbox\.com\//);
  } finally { globalThis.fetch = originalFetch; }
});

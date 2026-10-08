import { money, priceOrder } from './order-pricing.mjs';
import { blends } from './blend-preview-data.mjs';
// Public backend URL only. The Square access token stays in the Worker secret store.
const API = 'https://superseamoss-checkout-test.raspy-waterfall-454f.workers.dev';
const form = document.querySelector('#delivery-form');
const checkButton = document.querySelector('#check-delivery');
const payButton = document.querySelector('#pay-test');
const deliveryStatus = document.querySelector('#delivery-status');
const paymentStatus = document.querySelector('#payment-status');
let config, card, currentQuote, checkedRecipient, cardToken, revision = 0, paying = false, finished = false;
let billingPostcodeEdited = false;
let cart = { size: '330ml', quantity: 1, blends: [{ id: 'manuka-glow', recipe: 'original' }] };
try { const saved = JSON.parse(sessionStorage.getItem('seamoss-checkout-test-cart')); if (saved && Array.isArray(saved.blends)) cart = saved; } catch { /* default test order */ }
const jarQuote = priceOrder(cart.size, cart.quantity, false, 'shipping', cart.blends.map(item => item.id));
document.querySelector('#cart-title').textContent = `${cart.quantity} × ${cart.size} ${cart.quantity === 1 ? 'jar' : 'jars'}`;
document.querySelector('#jar-price').textContent = money(jarQuote.jarSubtotal);
for (const [i, item] of cart.blends.entries()) {
  const li = document.createElement('li');
  const blend = blends.find(blend => blend.id === item.id);
  li.textContent = `Jar ${i + 1}: ${blend?.name || 'Choose a blend'}` + (item.id === 'manuka-glow' ? item.recipe === 'honey-lemon' ? ' (Expecting Mother Edition)' : ' (original)' : '');
  document.querySelector('#cart-blends').append(li);
}
async function api(path, body) {
  const response = await fetch(API + path, { method: body ? 'POST' : 'GET', headers: body ? { 'Content-Type': 'application/json' } : {}, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(45000) });
  const result = await response.json();
  if (!response.ok) { const error = new Error(result.error || 'The test checkout is unavailable.'); error.status = response.status; error.code = result.code; throw error; }
  return result;
}
function status(element, text, state = '') { element.textContent = text; element.dataset.state = state; }
function invalidate(event) {
  if (paying || finished) return;
  revision += 1; currentQuote = null; cardToken = null; payButton.disabled = true;
  document.querySelector('#total-price').textContent = '—';
  document.querySelector('#delivery-price').textContent = 'Check postcode';
  status(deliveryStatus, 'Check delivery again to confirm these details.');
  status(paymentStatus, '');
  if (event?.target?.name === 'postcode') {
    form.querySelectorAll('[name="deliveryMethod"]').forEach(input => { input.checked = false; });
    document.querySelector('#delivery-options').hidden = true;
  }
}
form.addEventListener('input', invalidate);
form.addEventListener('change', event => { if (event.target.name === 'deliveryMethod') invalidate(); });
function lock(locked) {
  for (const input of form.querySelectorAll('input')) {
    if (input.type === 'radio') input.disabled = locked || (input.value === 'local' && !currentQuote?.quote.localEligible);
    else input.readOnly = locked;
  }
  checkButton.disabled = locked;
}
form.addEventListener('submit', async event => {
  event.preventDefault(); if (paying || finished || !form.reportValidity()) return;
  const version = ++revision;
  currentQuote = null; cardToken = null; payButton.disabled = true; checkButton.disabled = true;
  status(deliveryStatus, 'Checking your delivery postcode…'); status(paymentStatus, '');
  const values = Object.fromEntries(new FormData(form));
  const recipient = Object.fromEntries(['givenName', 'familyName', 'email', 'phone', 'addressLine1', 'addressLine2', 'city', 'postcode'].map(key => [key, values[key]?.trim() || '']));
  try {
    const result = await api('/quote', { cart, recipient, deliveryMethod: values.deliveryMethod || 'auto' });
    if (version !== revision) return;
    config ||= await api('/config');
    if (config.mode !== 'sandbox' || !config.applicationId.startsWith('sandbox-')) throw new Error('This page only accepts Sandbox credentials.');
    if (!window.Square) throw new Error('Square’s card form did not load. Refresh this page to try again.');
    recipient.postcode = recipient.postcode.toUpperCase().replace(/\s/g, '').replace(/(.{3})$/, ' $1');
    if (!card) {
      const payments = window.Square.payments(config.applicationId, config.locationId);
      await payments.setLocale('en-GB');
      card = await payments.card({ postalCode: recipient.postcode });
      await card.attach('#card-container');
      card.addEventListener('postalCodeChanged', event => {
        if (event.detail.currentState.hasFocusClass) billingPostcodeEdited = true;
      });
    } else await card.configure({ postalCode: recipient.postcode });
    if (version !== revision) return;
    currentQuote = result; checkedRecipient = recipient;
    billingPostcodeEdited = false;
    const q = result.quote;
    document.querySelector('#delivery-options').hidden = false;
    const local = form.querySelector('[name="deliveryMethod"][value="local"]');
    local.disabled = !q.localEligible;
    form.querySelector(`[name="deliveryMethod"][value="${q.method}"]`).checked = true;
    document.querySelector('#national-price').textContent = jarQuote.delivery ? money(jarQuote.delivery) : 'Free';
    document.querySelector('#delivery-label').textContent = q.method === 'local' ? 'Local courier delivery' : 'National chilled delivery';
    document.querySelector('#delivery-price').textContent = q.delivery ? money(q.delivery) : 'Free';
    document.querySelector('#total-price').textContent = money(q.total);
    const distanceText = `${q.distanceMiles} miles from ${q.dispatchPostcode}, measured between postcode centres.`;
    document.querySelector('#distance-note').textContent = distanceText;
    const freeChoice = q.localEligible && !jarQuote.delivery ? (q.method === 'shipping' ? ' Free national delivery is selected. The £5 local courier is still available if you prefer it.' : ' You chose the £5 local courier. Free national delivery is also available.') : '';
    status(deliveryStatus, (q.localEligible ? `${recipient.postcode} qualifies for £5 local delivery. ${distanceText}` : `${recipient.postcode} is outside the 10-mile local area. National delivery is available. ${distanceText}`) + freeChoice, 'success');
    document.querySelector('#payment-section').hidden = false;
    payButton.textContent = 'Pay ' + money(q.total) + ' test order'; payButton.disabled = false;
    checkButton.textContent = 'Check delivery again';
  } catch (error) { if (version === revision) status(deliveryStatus, error.message, 'error'); }
  finally { checkButton.disabled = false; }
});
payButton.addEventListener('click', async () => {
  if (paying || finished || !currentQuote || !card) return;
  paying = true; lock(true); payButton.disabled = true;
  status(paymentStatus, cardToken ? 'Checking the same Square test payment…' : 'Square is checking your test card…');
  try {
    if (!cardToken) {
      const r = checkedRecipient;
      // Before the card's country is known, Square can initially render a US ZIP
      // field. Fill again after card entry, preserving a billing postcode the buyer edited.
      if (!billingPostcodeEdited) await card.configure({ postalCode: r.postcode });
      const token = await card.tokenize({ amount: (currentQuote.quote.total / 100).toFixed(2), currencyCode: 'GBP', intent: 'CHARGE', customerInitiated: true, sellerKeyedIn: false,
        billingContact: { givenName: r.givenName, familyName: r.familyName, email: r.email, phone: r.phone, addressLines: [r.addressLine1, r.addressLine2].filter(Boolean), city: r.city, postalCode: r.postcode, countryCode: 'GB' } });
      if (token.status !== 'OK') { const error = new Error(token.errors?.[0]?.message || 'Check the Square test card details.'); error.beforePayment = true; throw error; }
      cardToken = token.token;
    }
    status(paymentStatus, 'Sending your test payment to Square…');
    const result = await api('/payment', { quoteToken: currentQuote.token, sourceId: cardToken });
    finished = true;
    status(paymentStatus, 'Square test payment completed.', 'success');
    payButton.textContent = 'Test payment complete';
    const success = document.querySelector('#test-success'); success.hidden = false;
    document.querySelector('#success-detail').textContent = `${money(result.total)} · ${result.method === 'local' ? '£5 local delivery' : 'national chilled delivery'} · ${result.postcode}`;
    document.querySelector('#success-ids').textContent = `Square payment: ${result.paymentId} · Order: ${result.orderId}`;
    success.focus(); success.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (error) {
    status(paymentStatus, error.message, 'error');
    if (error.beforePayment || error.status === 402 || error.code === 'QUOTE_EXPIRED') {
      lock(false); cardToken = null;
      if (error.status === 402 || error.code === 'QUOTE_EXPIRED') { currentQuote = null; payButton.disabled = true; status(deliveryStatus, 'Check delivery again to renew your quote.'); checkButton.focus(); }
      else payButton.disabled = false;
    } else { payButton.textContent = 'Retry the same test payment'; payButton.disabled = false; }
  } finally { paying = false; }
});

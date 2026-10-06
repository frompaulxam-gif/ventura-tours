import { priceOrder, money } from './order-pricing.mjs?v=square-live1';

// Public Square links offer both one-time purchase and recurring subscriptions.
export const squareOffers = Object.freeze({
  '330ml:1': Object.freeze({ url: 'https://square.link/u/oDJVR7Js', jarPrice: 2500, ready: true }),
  '330ml:2': Object.freeze({ url: 'https://square.link/u/6cntVLqw', jarPrice: 5000, ready: true }),
  '330ml:3': Object.freeze({ url: 'https://square.link/u/SdV64YjC', jarPrice: 6800, ready: true }),
  '330ml:4': Object.freeze({ url: 'https://square.link/u/v1caEEpX', jarPrice: 8800, ready: true }),
  '720ml:1': Object.freeze({ url: 'https://square.link/u/8vdThijg', jarPrice: 4500, ready: true }),
  '720ml:2': Object.freeze({ url: 'https://square.link/u/FDJfIpBI', jarPrice: 8500, ready: true }),
  '720ml:3': Object.freeze({ url: 'https://square.link/u/QTxaHfMn', jarPrice: 12000, ready: true })
});

export function checkoutFor(size, quantity, subscription = false, catalogue = squareOffers) {
  const quote = priceOrder(size, quantity, subscription);
  const offer = catalogue[size + ':' + quantity];
  if (!offer || !offer.ready || offer.jarPrice !== quote.bundlePrice) return null;
  if (!/^https:\/\/square\.link\/u\/[A-Za-z0-9]+$/.test(offer.url)) return null;
  return Object.freeze({ url: offer.url, total: quote.total });
}

export function blendChoices(blends) {
  return blends.map((blend, index) => 'Jar ' + (index + 1) + ': ' + blend).join('; ');
}

export function createSquareCheckout(form) {
  const panel = document.createElement('div');
  panel.className = 'order-square';
  const heading = document.createElement('h3');
  heading.textContent = 'Pay securely with Square';
  const note = document.createElement('p');
  note.className = 'order-shipping-note';
  const choices = document.createElement('textarea');
  choices.readOnly = true;
  choices.rows = 2;
  choices.setAttribute('aria-label', 'Blend choices for Square checkout');
  const actions = document.createElement('div');
  actions.className = 'order-actions';
  const copy = document.createElement('button');
  copy.type = 'button';
  copy.className = 'button';
  copy.textContent = 'Copy blend choices';
  const link = document.createElement('a');
  link.className = 'button button-dark';
  link.target = '_blank';
  link.rel = 'noopener';
  const status = document.createElement('p');
  status.className = 'order-copy-status';
  status.setAttribute('role', 'status');
  actions.append(copy, link);
  panel.append(heading, note, choices, actions, status);
  panel.hidden = true;
  form.querySelector('.order-enquiry-fallback').before(panel);
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(choices.value);
      status.textContent = 'Copied. Paste these into the blend-choice field in Square.';
    } catch {
      choices.focus();
      choices.select();
      status.textContent = 'Select and copy the blend choices above, then paste them in Square.';
    }
  });
  return (size, quantity, subscription, blends) => {
    const checkout = checkoutFor(size, quantity, subscription);
    panel.hidden = !checkout;
    status.textContent = '';
    const previewNote = form.querySelector('#order-preview-note');
    previewNote.textContent = checkout ? 'Pay in Square. Your blend choices and purchase option are not transferred automatically; follow the steps below.' : 'Checkout is unavailable for this selection. Please contact the team below.';
    if (!checkout) {
      link.removeAttribute('href');
      choices.value = '';
      return;
    }
    choices.value = blendChoices(blends);
    note.textContent = '1. Copy your blend choices below. 2. Open Square and choose ' + (subscription ? 'Subscription, then Monthly (10% off)' : 'One-time purchase') + '. Keep the bundle quantity at 1. 3. Click Checkout and paste your blends into the required blend-choice field. Your expected total including chilled delivery is ' + money(checkout.total) + (subscription ? ' each month.' : '.') + ' Check your choices, delivery address and final total before paying.';
    link.href = checkout.url;
    link.textContent = subscription ? 'Open Square for monthly subscription' : 'Continue to Square';
  };
}

import { priceOrder, money } from './order-pricing.mjs?v=square-subs2';

// Existing item links are used for one-off orders; monthly payments use dedicated links.
export const squareOffers = Object.freeze({
  '330ml:1': Object.freeze({ url: 'https://square.link/u/oDJVR7Js', jarPrice: 2500, ready: true }),
  '330ml:2': Object.freeze({ url: 'https://square.link/u/6cntVLqw', jarPrice: 5000, ready: true }),
  '330ml:3': Object.freeze({ url: 'https://square.link/u/SdV64YjC', jarPrice: 6800, ready: true }),
  '330ml:4': Object.freeze({ url: 'https://square.link/u/v1caEEpX', jarPrice: 8800, ready: true }),
  '720ml:1': Object.freeze({ url: 'https://square.link/u/8vdThijg', jarPrice: 4500, ready: true }),
  '720ml:2': Object.freeze({ url: 'https://square.link/u/FDJfIpBI', jarPrice: 8500, ready: true }),
  '720ml:3': Object.freeze({ url: 'https://square.link/u/QTxaHfMn', jarPrice: 12000, ready: true })
});

export const subscriptionOffers = Object.freeze({
  '330ml:1': Object.freeze({ url: 'https://square.link/u/UnZbxsNz', jarPrice: 2250, ready: true }),
  '330ml:2': Object.freeze({ url: 'https://square.link/u/gYcrouf4', jarPrice: 4500, ready: true }),
  '330ml:3': Object.freeze({ url: 'https://square.link/u/QrE70l4D', jarPrice: 6120, ready: true }),
  '330ml:4': Object.freeze({ url: 'https://square.link/u/z1Oo4sp7', jarPrice: 7920, ready: true }),
  '720ml:1': Object.freeze({ url: 'https://square.link/u/RX7YHyHm', jarPrice: 4050, ready: true }),
  '720ml:2': Object.freeze({ url: 'https://square.link/u/lLYNjALa', jarPrice: 7650, ready: true }),
  '720ml:3': Object.freeze({ url: 'https://square.link/u/yGvfrrbp', jarPrice: 10800, ready: true })
});

export function checkoutFor(size, quantity, subscription = false, catalogue = subscription ? subscriptionOffers : squareOffers) {
  const quote = priceOrder(size, quantity, subscription);
  const offer = catalogue[size + ':' + quantity];
  if (!offer || !offer.ready || offer.jarPrice !== quote.jarSubtotal) return null;
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
    previewNote.textContent = checkout ? 'Pay in Square. Your blend choices are not transferred automatically; copy and paste them into the checkout.' : 'Checkout is unavailable for this selection. Please contact the team below.';
    if (!checkout) {
      link.removeAttribute('href');
      choices.value = '';
      return;
    }
    choices.value = blendChoices(blends);
    note.textContent = subscription
      ? 'Copy your blend choices, then open your monthly Square checkout. Paste your blends and enter your full UK mainland delivery name, address and postcode in the required fields. Your total is ' + money(checkout.total) + ' each month, including free delivery. Cancel anytime.'
      : 'Copy your blend choices, then open Square and select One-time purchase. Keep the bundle quantity at 1. Click Checkout and paste your blends into the required field. Your expected total including chilled delivery is ' + money(checkout.total) + '. For a monthly subscription with free delivery, select Subscribe & Save on this website first.';
    link.href = checkout.url;
    link.textContent = subscription ? 'Open Square for monthly subscription' : 'Continue to Square';
  };
}

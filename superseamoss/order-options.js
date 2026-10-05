import { offers, priceOrder, money } from './order-pricing.mjs?v=two-jars50';
import { createBlendPreview } from './blend-preview.js?v=feedback-fit3';
import { createBlendPickers } from './blend-picker.js?v=image-picker1';

const form = document.querySelector('.order-planner');
if (form) {
  const selects = [1, 2, 3, 4].map(number => document.querySelector('#order-blend-' + number));
  selects.slice(1).forEach(select => {
    select.replaceChildren(...[...selects[0].options].map(option => option.cloneNode(true)));
  });
  ['king-strength', 'power-up', 'gut-health-booster'].forEach((blend, index) => {
    selects[index + 1].value = blend;
  });
  const fields = [...form.querySelectorAll('[data-bundle-field]')];
  const quantityRadios = [...form.querySelectorAll('[name="jar-count"]')];
  const enquiry = document.querySelector('#order-enquiry-text');
  const status = form.querySelector('.order-copy-status');
  const quantityNote = document.querySelector('#order-quantity-note');
  const setText = (selector, value) => { document.querySelector(selector).textContent = value; };

  const render = () => {
    const data = new FormData(form);
    const size = data.get('jar-size');
    const subscription = data.get('purchase-type') === 'subscription';
    Object.keys(offers).forEach(jarSize => {
      setText('[data-size-start="' + jarSize + '"]', 'From ' + money(priceOrder(jarSize, 1, subscription).jarSubtotal));
    });
    const maxQuantity = offers[size].length - 1;
    let quantity = Number(data.get('jar-count'));
    const adjusted = quantity > maxQuantity;
    if (adjusted) {
      quantity = maxQuantity;
      quantityRadios.find(radio => Number(radio.value) === quantity).checked = true;
    }
    quantityRadios.forEach(radio => {
      const count = Number(radio.value);
      const available = count <= maxQuantity;
      radio.disabled = !available;
      if (available) {
        const quote = priceOrder(size, count, subscription);
        const saving = quote.bundleSaving + quote.subscriptionSaving;
        setText('[data-quantity-price="' + count + '"]', money(quote.jarSubtotal));
        setText('[data-quantity-saving="' + count + '"]', saving ? 'Save ' + money(saving) : count > 1 && !quote.delivery ? 'Free delivery' : 'One favourite');
      } else {
        setText('[data-quantity-price="' + count + '"]', '—');
        setText('[data-quantity-saving="' + count + '"]', '330ml only');
      }
    });
    quantityNote.textContent = adjusted ? '720ml bundles go up to 3 jars. Your selection is now 3 jars.' : size === '720ml' ? '720ml bundles are available in 1, 2 or 3 jars.' : '';
    fields.forEach((field, index) => {
      const visible = index + 2 <= quantity;
      field.hidden = !visible;
      selects[index + 1].disabled = !visible;
    });
    form.querySelector('label[for="order-blend-1"]').textContent = quantity > 1 ? 'Jar one' : 'Your blend';
    const blends = selects.slice(0, quantity).map(select => select.selectedOptions[0].textContent);
    const quote = priceOrder(size, quantity, subscription);
    setText('#order-selection', quantity + ' × ' + size + (quantity > 1 ? ' jars' : ' jar'));
    setText('#order-blend-summary', blends.join(' · '));
    setText('#order-product-price', money(quote.jarSubtotal));
    setText('#order-price-unit', subscription ? 'for your jars, each month' : 'for your jars');
    const regularPrice = document.querySelector('#order-regular-price');
    regularPrice.hidden = !subscription;
    regularPrice.textContent = money(quote.bundlePrice);
    const bundleSaving = document.querySelector('#order-bundle-saving');
    bundleSaving.hidden = !quote.bundleSaving;
    bundleSaving.textContent = 'Mix & match saving: ' + money(quote.bundleSaving);
    const subscriptionSaving = document.querySelector('#order-subscription-saving');
    subscriptionSaving.hidden = !subscription;
    subscriptionSaving.textContent = 'Subscription saving (10%): ' + money(quote.subscriptionSaving);
    setText('#order-delivery-price', quote.delivery ? money(quote.delivery) : 'Free');
    setText('#order-total-label', subscription ? 'Monthly total' : 'Order total');
    setText('#order-total-price', money(quote.total));
    setText('#order-shipping-note', subscription ? 'Every subscription includes free chilled UK mainland delivery.' : quote.delivery ? 'Free chilled delivery when your jar subtotal reaches £50.' : 'Your jar subtotal qualifies for free chilled delivery.');
    document.querySelector('#order-schedule').hidden = !subscription;
    const items = blends.join(', ');
    const delivery = quote.delivery ? money(quote.delivery) : 'free';
    enquiry.value = 'Hi Super Seamoss, ' + (subscription ? 'I’m interested in monthly Subscribe & Save 10% for ' : 'I’d like ') + quantity + ' × ' + size + (quantity > 1 ? ' jars: ' : ' jar: ') + items + '. Jars: ' + money(quote.jarSubtotal) + (subscription ? ' per month' : '') + '. Chilled UK mainland delivery: ' + delivery + '. Total: ' + money(quote.total) + (subscription ? ' per month. Cancel anytime. Please confirm availability and dispatch.' : '. Please confirm availability and dispatch.');
    status.textContent = 'Copy your choices, then send them to the team on Instagram.';
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', event => event.preventDefault());
  form.querySelector('.order-copy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(enquiry.value);
      status.textContent = 'Copied. Open Instagram and paste your enquiry into a message.';
    } catch {
      enquiry.focus();
      enquiry.select();
      status.textContent = 'Select and copy the enquiry above, then send it on Instagram.';
    }
  });
  render();
  createBlendPreview(form, selects);
  createBlendPickers(form, selects);
}

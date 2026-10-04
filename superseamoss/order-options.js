(() => {
  const form = document.querySelector('.order-planner');
  if (!form) return;
  const selects = [1, 2, 3].map(number => document.querySelector('#order-blend-' + number));
  [1, 2].forEach(index => {
    selects[index].replaceChildren(...[...selects[0].options].map(option => option.cloneNode(true)));
  });
  selects[1].value = 'king-strength';
  selects[2].value = 'power-up';
  const fields = [...form.querySelectorAll('[data-bundle-field]')];
  const enquiry = document.querySelector('#order-enquiry-text');
  const status = form.querySelector('.order-copy-status');
  const render = () => {
    const data = new FormData(form);
    const quantity = Number(data.get('jar-count'));
    const large = data.get('jar-size') === '720ml';
    const subscription = data.get('purchase-type') === 'subscription';
    fields.forEach((field, index) => {
      field.hidden = quantity !== 3;
      selects[index + 1].disabled = quantity !== 3;
    });
    form.querySelector('label[for="order-blend-1"]').textContent = quantity === 3 ? 'Jar one' : 'Your blend';
    const blends = selects.slice(0, quantity).map(select => select.selectedOptions[0].textContent);
    const size = large ? '720ml' : 'original';
    document.querySelector('#order-selection').textContent = quantity + ' × ' + size + (quantity === 3 ? ' jars' : ' jar');
    document.querySelector('#order-blend-summary').textContent = blends.join(' · ');
    document.querySelector('#order-price-unit').textContent = subscription ? 'per delivery' : 'per order';
    document.querySelector('#order-schedule').hidden = !subscription;
    const items = blends.map(blend => blend + (large ? ' (720ml)' : ' (original jar)')).join(', ');
    const details = quantity === 3 ? 'available sizes, bundle options, price and delivery' : 'available sizes, price and delivery';
    enquiry.value = 'Hi Super Seamoss, I’m interested in ' + (quantity === 3 ? 'a three-jar bundle: ' : 'one jar: ') + items + '. ' + (subscription ? 'I’m also interested in repeat deliveries. Please confirm the subscription timing, price and delivery.' : 'Please confirm the ' + details + '.');
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
})();

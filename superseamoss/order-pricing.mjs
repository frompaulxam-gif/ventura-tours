export const offers = Object.freeze({
  '330ml': Object.freeze([0, 2500, 4700, 6800, 8800]),
  '720ml': Object.freeze([0, 4500, 8500, 12000])
});

export function deliveryForSubtotal(pence, subscription = false) {
  return subscription || pence >= 5000 ? 0 : 995;
}

export function priceOrder(size, quantity, subscription = false) {
  const prices = offers[size];
  if (!prices || !Number.isInteger(quantity) || quantity < 1 || quantity >= prices.length) {
    throw new RangeError('Choose an available jar size and quantity.');
  }
  const bundlePrice = prices[quantity];
  const subscriptionSaving = subscription ? Math.round(bundlePrice * 0.1) : 0;
  const jarSubtotal = bundlePrice - subscriptionSaving;
  const delivery = deliveryForSubtotal(jarSubtotal, subscription);
  return Object.freeze({
    bundlePrice,
    bundleSaving: prices[1] * quantity - bundlePrice,
    subscriptionSaving,
    jarSubtotal,
    delivery,
    total: jarSubtotal + delivery
  });
}

export function money(pence) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency', currency: 'GBP',
    minimumFractionDigits: pence % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  }).format(pence / 100);
}

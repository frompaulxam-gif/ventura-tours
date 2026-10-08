import { priceOrder } from '../superseamoss/order-pricing.mjs';
import { blends } from '../superseamoss/blend-preview-data.mjs';

export const dispatch = Object.freeze({ postcode: 'B36 0PF', latitude: 52.495898, longitude: -1.742862, radiusMiles: 10 });
export class CheckoutError extends Error {
  constructor(message, status = 400, code = 'CHECKOUT_ERROR') { super(message); this.status = status; this.code = code; }
}
const text = (value, label, max = 100, optional = false) => {
  if (typeof value !== 'string' || value.length > max || /[\x00-\x1f]/.test(value) || (!optional && !value.trim())) throw new CheckoutError('Enter a valid ' + label + '.');
  return value.trim();
};
export function normalisePostcode(value) {
  const raw = text(value, 'UK postcode', 12).toUpperCase().replace(/\s/g, '');
  if (!/^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(raw)) throw new CheckoutError('Enter a full UK postcode, such as B36 0PF.');
  return raw.slice(0, -3) + ' ' + raw.slice(-3);
}
export function normaliseRecipient(value) {
  if (!value || typeof value !== 'object') throw new CheckoutError('Enter your delivery details.');
  const recipient = {
    givenName: text(value.givenName, 'first name', 60), familyName: text(value.familyName, 'last name', 60),
    email: text(value.email, 'email address', 120), phone: text(value.phone, 'phone number', 30),
    addressLine1: text(value.addressLine1, 'street address', 150), addressLine2: text(value.addressLine2 ?? '', 'second address line', 150, true),
    city: text(value.city, 'town or city', 100), postcode: normalisePostcode(value.postcode)
  };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email)) throw new CheckoutError('Enter a valid email address.');
  if (!/^\+?[\d\s()-]{7,25}$/.test(recipient.phone)) throw new CheckoutError('Enter a valid phone number.');
  return recipient;
}
export function normaliseCart(value) {
  if (!value || value.subscription) throw new CheckoutError('This test supports one-off orders only.');
  const quantity = value.quantity;
  // Validate size and count against the existing shop pricing before using them.
  priceOrder(value.size, quantity);
  if (!Array.isArray(value.blends) || value.blends.length !== quantity) throw new CheckoutError('Choose one blend for each jar.');
  const selected = value.blends.map(item => {
    const blend = blends.find(blend => blend.id === item?.id);
    if (!blend) throw new CheckoutError('Choose an available blend.');
    if (blend.id !== 'manuka-glow') return { id: blend.id, name: blend.name };
    const recipe = item.recipe ?? 'original';
    if (!['original', 'honey-lemon'].includes(recipe)) throw new CheckoutError('Choose an available Manuka Glow recipe.');
    return { id: blend.id, recipe, name: blend.name + (recipe === 'original' ? ' (original)' : ' (Expecting Mother Edition)') };
  });
  if (value.size === '141ml' && new Set(selected.map(blend => blend.id)).size !== 3) throw new CheckoutError('Choose three different blends for your taster trio.');
  return { size: value.size, quantity, blends: selected };
}
export function milesBetween(a, b) {
  const radians = degrees => degrees * Math.PI / 180;
  const dLat = radians(b.latitude - a.latitude), dLon = radians(b.longitude - a.longitude);
  const term = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 3958.7613 * 2 * Math.atan2(Math.sqrt(term), Math.sqrt(Math.max(0, 1 - term)));
}
export function calculateQuote(cart, postcodeData, requestedMethod = 'auto') {
  if (!['auto', 'local', 'shipping'].includes(requestedMethod)) throw new CheckoutError('Choose a delivery method.');
  if (!['England', 'Scotland', 'Wales'].includes(postcodeData.country) || !Number.isFinite(postcodeData.latitude) || !Number.isFinite(postcodeData.longitude)) throw new CheckoutError('This test quotes delivery in England, Scotland and Wales, including island postcodes.');
  const distanceMiles = milesBetween(dispatch, postcodeData);
  const localEligible = distanceMiles <= dispatch.radiusMiles;
  if (requestedMethod === 'local' && !localEligible) throw new CheckoutError('This postcode is outside the 10-mile local delivery area. Choose national delivery.');
  const shipping = priceOrder(cart.size, cart.quantity, false, 'shipping', cart.blends.map(item => item.id));
  // Preserve free national delivery for £50+ orders. Local courier delivery is a flat £5.
  const method = requestedMethod === 'shipping' || !localEligible || (requestedMethod === 'auto' && shipping.delivery === 0) ? 'shipping' : 'local';
  const delivery = method === 'local' ? 500 : shipping.delivery;
  return { jarSubtotal: shipping.jarSubtotal, delivery, total: shipping.jarSubtotal + delivery, method, localEligible, distanceMiles: Math.round(distanceMiles * 10) / 10, radiusMiles: dispatch.radiusMiles, dispatchPostcode: dispatch.postcode };
}
export function squareOrder(payload, locationId) {
  const { cart, recipient: r, quote: q } = payload;
  const deliveryLabel = q.method === 'local' ? 'Local delivery within 10 miles of B36 0PF' : 'National chilled delivery';
  return {
    location_id: locationId, reference_id: payload.id,
    line_items: [{ name: `${cart.quantity} × ${cart.size} Super Seamoss`, quantity: '1', note: cart.blends.map((blend, i) => `Jar ${i + 1}: ${blend.name}`).join('; '), base_price_money: { amount: q.jarSubtotal, currency: 'GBP' } },
      { name: deliveryLabel, quantity: '1', base_price_money: { amount: q.delivery, currency: 'GBP' } }],
    metadata: { checkout: 'ventura-sandbox-v1', delivery_method: q.method, delivery_distance_miles: String(q.distanceMiles), dispatch_postcode: dispatch.postcode },
    // Square DELIVERY fulfilments require restricted partner access. SHIPMENT retains
    // the address in Order Manager; shipping_note clearly marks our own local courier.
    fulfillments: [{ type: 'SHIPMENT', state: 'PROPOSED', shipment_details: {
      recipient: { display_name: `${r.givenName} ${r.familyName}`, email_address: r.email, phone_number: r.phone,
        address: { address_line_1: r.addressLine1, address_line_2: r.addressLine2, locality: r.city, postal_code: r.postcode, country: 'GB' } },
      shipping_note: `${deliveryLabel}. SANDBOX TEST: do not dispatch. Allow 3–4 working days for preparation.`
    } }]
  };
}

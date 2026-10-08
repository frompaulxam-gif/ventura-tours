# Super Seamoss delivery checkout test

The existing shop remains at `/superseamoss/`. Its one-off order builder links to
`/superseamoss/checkout-test.html`, an explicitly labelled Square Sandbox checkout.
It never calls Square's production Payments API.

The server validates the order against the existing jar and bundle prices,
looks up the full delivery postcode with Postcodes.io and measures the straight-line
distance from the B36 0PF postcode centre (52.495898, -1.742862). The local courier
fee is £5 at up to 10 miles. National chilled delivery uses the shop's existing
£9.95 / free above £50 pricing. Customers can choose free national delivery on
eligible larger orders rather than paying £5 for the local courier.

The address is entered once. A signed quote binds the order, address and price
for 15 minutes. Payment creation only uses those signed values. Square's browser
SDK handles card entry and SCA. Both Square idempotency keys derive from the quote
ID, so a retry uses the same order and payment. The card billing postcode is filled
from delivery details after Square recognises the card, unless the buyer edited it.

Square's DELIVERY fulfilment is a restricted partner beta. We use SHIPMENT with
an explicit local courier line item, metadata and fulfilment note, so the address
is retained in the ordinary order. Every test order says not to dispatch.

## Development

Run `node --test checkout.test.mjs` from this directory. `wrangler.jsonc` contains
only public client IDs. The secret store contains `SQUARE_ACCESS_TOKEN` and
`QUOTE_SECRET`; neither belongs in Git or in client code. `.dev.vars` is ignored.
Deploy with Wrangler using the existing Cloudflare account. The static files are
served by GitHub Pages in `frompaulxam-gif/ventura-tours`.

## Test scope

One-off orders only. Monthly subscriptions and the ten live discount vouchers
continue through the existing hosted Square links. This test does not redeem
those vouchers or implement invoice reminders, dispatch emails or stock updates.
Postcode lookup checks postcode existence and location; it does not validate a
house number or match the typed street against a postal-address database.

The currently signed-in Square user can access Sandbox credentials but sees
"You do not have the permissions required to access this content" for production
credentials. A live rollout needs authorised seller credentials and separate
review of billing-address handling, shipping coverage, vouchers and order operations.

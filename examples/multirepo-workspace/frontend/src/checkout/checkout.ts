// Storefront Web — sample source (illustrative).
// The frontend never reads the orders DB; it calls Orders API over HTTP.

export interface CheckoutRequest {
  cartId: string
  customerId: string
}

export async function placeOrder(req: CheckoutRequest): Promise<{ orderId: string }> {
  const res = await fetch('https://orders-api.internal/orders', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(req),
  })
  if (!res.ok) throw new Error('Checkout failed')
  return res.json() as Promise<{ orderId: string }>
}

// Fulfillment Worker — sample source (illustrative).
// Async consumer of OrderPlaced events. No inbound HTTP.

export interface OrderPlaced {
  type: 'OrderPlaced'
  orderId: string
  at: string
}

export async function onOrderPlaced(
  event: OrderPlaced,
  emit: (type: 'StockReserved' | 'OrderShipped', orderId: string) => Promise<void>
): Promise<void> {
  // reserve stock (omitted) ...
  await emit('StockReserved', event.orderId)
  // hand off to shipping (omitted) ...
  await emit('OrderShipped', event.orderId)
}

// Orders API — sample source (illustrative).
// Owns the orders table and emits events; never calls the worker directly.

export interface PlaceOrderInput {
  cartId: string
  customerId: string
}

export interface OrderEvent {
  type: 'OrderPlaced' | 'OrderCancelled'
  orderId: string
  at: string
}

export class OrdersService {
  constructor(private readonly publish: (e: OrderEvent) => Promise<void>) {}

  async placeOrder(input: PlaceOrderInput): Promise<{ orderId: string }> {
    const orderId = crypto.randomUUID()
    // persist order (omitted in sample) ...
    await this.publish({ type: 'OrderPlaced', orderId, at: new Date().toISOString() })
    return { orderId }
  }
}

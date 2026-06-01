// Old Orders — sample legacy source (illustrative).
//
// This file exists so WI-001 (`code: sample/src/orders/**`) points at real code.
// It deliberately shows the kind of legacy shape the risks/unknowns describe:
// status transitions happen inline, with no audit trail. WI-001 adds logging
// *around* this without touching total/invoice logic (RISK-001, RISK-002).

export type OrderStatus =
  | 'draft'
  | 'placed'
  | 'paid'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export interface Order {
  id: string
  status: OrderStatus
  total: number // cents — see RISK-002, do NOT recompute here
}

/**
 * Legacy in-place status mutation.
 *
 * WI-001 wraps calls to this with append-only logging (old status, new status,
 * actor, timestamp). The transition table itself is intentionally left untouched
 * until UNK-001 ("who consumes the orders feed?") is answered.
 */
const ALLOWED: Record<OrderStatus, OrderStatus[]> = {
  draft: ['placed', 'cancelled'],
  placed: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
}

export function changeStatus(order: Order, next: OrderStatus): Order {
  if (!ALLOWED[order.status].includes(next)) {
    throw new Error(`Illegal transition ${order.status} -> ${next}`)
  }
  // NOTE: mutates in place — this is the legacy behaviour, not a recommendation.
  order.status = next
  return order
}

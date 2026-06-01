// Loyalty Lite — sample source (illustrative, not a runnable app).
// Target of WI-001's ownership glob: sample/src/loyalty/**
//
// Guard demo: change EARN_RATE (or any line here) without updating WI-001 and run
// `kaddo guard` to see a "Possible knowledge drift" FYI.

export const EARN_RATE = 1 // points earned per $1 spent

export function earnPoints(amountSpent: number): number {
  return Math.floor(amountSpent * EARN_RATE)
}

export function redeemPoints(balance: number, cost: number): number {
  if (cost > balance) throw new Error('Insufficient points')
  return balance - cost
}

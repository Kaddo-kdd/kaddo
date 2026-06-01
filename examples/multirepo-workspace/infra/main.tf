# Platform Infra — sample source (illustrative).
# Provisions the shared substrate the other modules depend on.

resource "managed_postgres" "orders" {
  name    = "commerce-orders"
  version = "16"
}

resource "event_bus" "commerce" {
  name = "commerce-events"
  # topics consumed by fulfillment-worker
  topics = ["OrderPlaced", "OrderCancelled"]
}

export interface SubscriptionRecord {
  status: string
  current_period_end: string
}

export function isSubscriptionActive(subscription?: SubscriptionRecord | null, now = new Date()) {
  if (!subscription) {
    return false
  }

  return subscription.status === "active" && new Date(subscription.current_period_end) > now
}

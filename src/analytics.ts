// WIRE: analytics.events
// Req: product analytics | Contract: track(event, props) | Mock: logs to the console in development only
// Real: send the event to the analytics service with the signed-in account id (or an anonymous id before sign-in); batch and retry; never block or break the UI
// Server must enforce: no personal data in event properties; consent and opt-out rules

/** Records a product event. Events are named in snake_case, for example `chat_opened`. */
export function track(event: string, props: Record<string, unknown> = {}): void {
  if (import.meta.env.DEV) console.debug('[track]', event, props)
}

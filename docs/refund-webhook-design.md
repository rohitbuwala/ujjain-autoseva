# Razorpay refund webhook and submission design

Refund execution is disabled in this phase. The existing webhook preserves its payment capture and failure handling. It also queues signed `refund.created`, `refund.processed`, and `refund.failed` deliveries for reconciliation.

## Before submission

Phase 4J adds one immutable submission intent per refund. The admin **Prepare submission intent** action requires a current database admin role, an approved refund, verified capture and reservation, and a fresh provider balance check. The stored request contract contains the approved integer paise amount, verified INR payment, opaque receipt, and stable idempotency key. A separate future dispatch action must take the one-time claim, repeat those checks, and commit the attempt marker before making any provider request.

The `execute` action is disabled by default and there is no refund POST transport in Phase 4J. Setting `RAZORPAY_REFUND_EXECUTION_ENABLED` alone cannot enable execution. The adapter builds the request contract only and the dispatch claim has no route or worker caller.

Treat an interruption after the dispatch claim as ambiguous, even if the crash occurred before network I/O. Recovery reads the full provider history and requires one refund with the exact provider-returned receipt, verified payment ID, currency, and amount. A signed webhook can trigger correlation using a receipt from an authenticated provider GET, never from the webhook payload alone. A mismatch, ambiguity, or missing result remains under review. There is no resend path. A future retry policy would need the original `X-Refund-Idempotency` key, identical body, and a verified provider contract and window.

Admin recovery verifies and links the provider refund and records its last verified outcome. Settlement continues through the webhook inbox. If no event is present, keep the reservation and use provider event redelivery or operator investigation. A webhook arriving before the response can commit the intent link, refund and balance updates, audit, and event outcome in one transaction. An existing link to another refund is a conflict.

## Event intake

Validate the HMAC over the raw request body using the configured webhook secret and a constant-time comparison. After verification, validate the event envelope, provider account, refund ID, payment ID, integer paise amount, currency, and event type. Store an inbox record using a unique key scoped to the configured account and Razorpay event ID, plus a hash of the signed body. A repeated ID with the same hash is a no-op. A repeated ID with a different hash goes to operator review. Persist the inbox row before acknowledging receipt. Keep only the validated identifiers and lifecycle fields needed for processing.

Correlate refund and payment IDs together against the local operation and verify the stored amount, currency, and booking binding. Unknown or conflicting IDs go to reconciliation. Use authenticated provider reads to resolve out-of-order events before applying a state transition.

Set `RAZORPAY_REFUND_WEBHOOK_ACCOUNT_ID` only in the isolated staging environment for this verification. It must match both the signed account in the webhook envelope and the account associated with the staging Razorpay API keys. The existing secret verifies the exact raw bytes. The inbox stores the body hash and allowlisted fields.

Processing runs on demand from the admin inbox. Each action checks at most one event. A 45-second lease permits recovery after an interrupted worker. Transient errors are retried when due, up to five automatic processing attempts, and then require operator review. There is no scheduler configured in this phase.

An admin recheck reads Razorpay and records evidence in the inbox. A separate resolution action checks the provider again and may reconcile a matched local operation. Acknowledgment is limited to recently verified terminal external refunds and does not import them or change ledger balances. A reused event ID with a different signed body requires investigation outside the automated workflow.

## State and balance updates

- A pending provider refund advances a verified local operation to processing and keeps the reservation in place. An unlinked operation requires an existing dispatch claim and the independently verified receipt correlation above.
- A verified `refund.processed` moves the approved amount from reserved to processed in the same MongoDB transaction as the state and audit update. Release the active request slot only when the operation is conclusively terminal.
- A verified `refund.failed` may release the reservation only after the provider confirms that the refund cannot still process. Conflicting terminal events retain the reservation and require review. A pending or failed event must never reverse a processed refund.
- Apply each transition with an expected-state predicate. Mark the inbox event applied in the same transaction. Replaying or restarting processing should not change money counters twice.

In isolated staging MongoDB, verify the inbox collection and indexes, transaction support, concurrent lease recovery, and atomic refund, balance, and inbox updates. With Razorpay Test Mode, verify the signed account, event headers, duplicate and out-of-order delivery, pending and terminal refund statuses, and the review path for external refunds. Confirm the production plan for monitoring and draining queued events before subscribing the production endpoint.

With refund submission still disabled, use a mock provider to exercise duplicate admin clicks, concurrent dispatch claims, a timeout before and after simulated acceptance, lost responses, process restart, database commit failure, early and missing webhooks, and conflicting provider IDs and receipts. Verify the admin gate with the flag unset and set. Before any future activation, separately authorize Razorpay Test Mode contract checks for the receipt and idempotency header, including identical and altered retry bodies. Check production indexes and an operator procedure for an ambiguous attempt or a missing webhook before enabling transport.

# Phase 1 booking notification outbox

Phase 2 adds an explicitly enabled local worker and a shared lock/per-write guard for the manual drain; see [local-notification-worker.md](local-notification-worker.md). The notes below describe the original Phase 1 implementation and validation state. The user subsequently reported successful Phase 1 manual delivery tests; no Phase 2 live execution has been performed by the agent.

Source implementation only; no database preparation or drain has been executed.

Each new standard/custom booking embeds customer and database-admin deliveries in its insert. Confirmation/rejection/admin cancellation embeds a customer delivery in the successful conditional update. Customer cancellation embeds deliveries for database admins. Creation and customer cancellation snapshot current admins; delivery rechecks their role. Recipients who lose eligibility are permanently marked skipped. New admins do not inherit historical events.

`notificationOutbox` is optional, hidden from ordinary queries, and removed explicitly from creation/transition responses. Old documents have no generated events. Each delivery key is `booking:{MongoId}:{created|confirmed|rejected|admin_cancelled|customer_cancelled}:recipient:{userId}`. A customer who is also an admin gets one creation notification.

Cancellation/rejection append an outbox-only pipeline stage to the existing update pipeline, preserving its payment-review and reconciliation expressions. Confirmation adds `$push` alongside the existing `$set`. No payment/refund/reconciliation helper has been changed.

## Explicit local delivery

After separate approval for local database writes, run from the repository root:

```powershell
node --import tsx scripts/drain-booking-notifications.ts --confirm-local-notification-drain
```

This command was not executed during implementation. It forces the explicit local URI, checks database/PRIMARY/server identity/full replica membership and the existing notification unique index, and disables automatic collection/index creation. Each invocation handles at most 20 deliveries or exhausted-lease recoveries. Reinvoke after retry deadlines; it does not wait or schedule future work. Writes are limited to embedded delivery status/lease/attempt fields and Notification records.

No route, cron, timer or background worker drains these events. Pending notifications will not appear in the inbox until an operator runs the command after review:

```powershell
Set-Location 'C:\Users\Acer\Desktop\Project\ujjain-autoseva'
node --import tsx scripts/drain-booking-notifications.ts --confirm-local-notification-drain
```

The script does not load environment files. It overrides inherited `MONGODB_URI` with the hardcoded direct local connection to `127.0.0.1:27018/ujjain_autoseva_local_test`, verifies PRIMARY/server identity/full single-member `uasLocalRs` configuration, and requires existing collections and the full unique notification event-key index. Automatic collection/index creation is disabled. No API server or external provider module is started. Stop other topology/schema operations while draining.

One invocation claims at most 20 deliveries/recovery entries. Claims have a 45-second token lease. Failures retry after 5, 10, 20, then 40 seconds; at most five claims are allowed. Re-run explicitly once due. Acknowledgment requires the same unexpired token and pending event. A crash after notification insertion retries the same key through `createNotification()`, preserving read status. Fifth-attempt failures or expired fifth-attempt leases require operator review; the script does not reset them automatically. A database error can stop a batch after earlier deliveries committed: inspect pending/leased entries and retry after expiry, rather than assuming nothing was written.

The drain writes only notification documents and embedded outbox delivery metadata. It never changes booking status, payment state or existing email behavior. Business writes and outbox recording are one atomic document operation. Recipient lookup or persistence failure before that operation commits can still reject the request; no successful booking is undone by later delivery failure.

## Limits and review

- No automatic retries without another explicit invocation; no production delivery runner is included.
- Local MongoDB integration has not been exercised. Offline fixtures validate query/update contracts but cannot prove server execution semantics.
- Outbox records are retained. Very large admin fan-out increases booking document size; scan-based local draining is intended for small batches. Retention/indexing/production scheduling need separate review.
- Eligibility is checked immediately before delivery; concurrent role changes are not locked across collections. Existing inbox access remains scoped by recipient, so previously delivered admin messages are not revoked by demotion.
- POST booking creation has no request idempotency key: two successful submissions are two distinct bookings/events. Transition retries on one booking do not append again.
- No payment notifications, historical backfill, new outbound email, SMS or push delivery are included. Duplicate payment replay remains pending; do not recreate its callback.

## Offline checks

```powershell
node --import tsx --test tests/booking-notifications.test.mjs tests/payment-reconciliation.test.mjs tests/refunds.test.mjs
node node_modules/typescript/bin/tsc --noEmit --incremental false
```

All database/provider/email dependencies in these tests are mocked. Do not run startup, seed scripts or the drain as part of offline verification.

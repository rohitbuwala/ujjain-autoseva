# Phase 2 local booking notification worker

Source implementation only. The worker and revised drain were not executed against MongoDB during this implementation. The user previously reported successful Phase 1 manual deliveries for UA-33AA05; that does not validate this worker.

## Prerequisites and activation

After separate approval for local writes, confirm the exact local PRIMARY uasLocalRs has one configured and advertised member, 127.0.0.1:27018, and database ujjain_autoseva_local_test. The users/bookings/notifications collections must already exist with a full, non-sparse, non-partial, simple-collation unique notifications.eventKey index. No collection/index creation is performed by the runtime. Capture UA-0E0723 and verify its baseline after testing. Inspect all pending events and admin recipients before activation. Confirm the Next.js process is independently isolated and outbound email credentials, payments/refunds, webhooks and reconciliation remain disabled.

The worker is disabled by default. Running dev/build/start never starts it. Running the worker without its explicit flag and canonical ISO booking-creation cutoff exits before connecting. NODE_ENV=production is refused. No environment file is read or loaded; the runtime forces this exact URI before importing delivery modules:

`mongodb://127.0.0.1:27018/ujjain_autoseva_local_test?replicaSet=uasLocalRs&directConnection=true`

Choose and record one operator-approved UTC activation cutoff before creating the new synthetic bookings. Use the SAME cutoff across restarts. Do not replace it with the current time on every restart: that would exclude pending work from the previous run. Only bookings with createdAt at or after the cutoff qualify; new events on older bookings are intentionally excluded from the automatic local test scope. Nothing creates events for historical bookings. UA-0E0723 is excluded from claims, expired-lease recovery and acknowledgments regardless of cutoff. Manual draining remains separately explicit and can process other pre-existing pending events.

Future commands (not run during implementation):

```powershell
Set-Location 'C:\Users\Acer\Desktop\Project\ujjain-autoseva'
$notificationActivation = Read-Host 'Approved activation UTC timestamp (YYYY-MM-DDTHH:mm:ss.sssZ); reuse on restart'
node --import tsx scripts/run-local-booking-notification-worker.ts --confirm-local-notification-worker --booking-created-since $notificationActivation
```

Alternatively use `npm run notifications:worker:local -- --confirm-local-notification-worker --booking-created-since $notificationActivation`. The environment variable MONGODB_URI is never used to select another target. Do not add --env-file, dotenv preloads, Next.js bootstrap, service installation, cron or process-manager auto-start.

## Lock, guards and delivery

Both automatic and manual entry points hold the same exclusive listener on 127.0.0.1:27119. It accepts no application requests and closes inbound sockets. If occupied, startup fails before connecting. A second worker or a revised manual drain cannot run concurrently. An older copy of the manual drain would bypass this process lock, although event leases and unique keys still protect duplicate insertion. Stop old scripts before testing. OS process exit releases the listener; no stale PID file is deleted. A lock error stops further processing.

The original topology validator is reused before every outbox recovery mutation, claim, acknowledgment/retry update, and notification initialization/insertion. Guard failures become fatal NotificationGuardError, never acknowledgment or retry scheduling. Automatic collection/index creation and buffering are disabled; driver retryable writes are disabled to avoid hidden write retries. Existing customer/admin eligibility checks, 45-second token leases, five-attempt limits, deterministic event keys and server-time $$NOW acknowledgment fencing remain. Recipient query/insertion errors are reported with a sanitized message; acknowledgment/storage errors reach the cycle's error backoff. A guard failure stops the process with nonzero status. Logs do not include recipients, payloads, credentials, callback signatures or raw driver errors.

There is one awaited drain at a time, with at most 20 entries. Full batches pause 1 second; partial activity pauses 5 seconds. Empty polling backs off 5/10/20/30 seconds, capped at 30 seconds. Infrastructure cycle errors back off 5/10/20/40/60 seconds with up to 10% jitter, capped at 60 seconds. Per-event retry deadlines remain 5/10/20/40 seconds. A future poll handles due work; it does not consume an attempt while merely waiting. Terminal review/skipped/delivered entries are not automatically reset. Notifications remain in-app only. Browser bell polling can add about 25 seconds after backend insertion.

## Shutdown and recovery

Ctrl+C/SIGINT or SIGTERM stops new claims and aborts idle waiting. The active entry may finish and acknowledge through the normal guard and server-time fence. MongoDB is disconnected and the listener released. A second shutdown signal or the 20-second grace deadline forces a nonzero exit. The forced-exit log explicitly states that leases remain for recovery. Never clear an ambiguous in-flight lease manually: restart with the same cutoff and wait for expiry. If an insert committed before acknowledgment, retrying the original event key preserves the existing notification and readAt. Fifth-attempt failures or crash-expired fifth attempts enter review. Client-side connection/socket timeouts bound operations, but forced termination can still leave an unknown outcome.

## Validation before live execution

Offline only:

```powershell
node --import tsx --test tests/booking-notifications.test.mjs tests/notification-worker.test.mjs tests/payment-reconciliation.test.mjs tests/refunds.test.mjs
node node_modules/typescript/bin/tsc --noEmit --incremental false
```

All runtime connections and listeners in worker tests are fakes; no entry point is launched against services. After approval, verify second-instance refusal, new synthetic standard/custom creation, confirmation/rejection/cancellation, delivery without manual drain, recipient isolation, read-state preservation, shutdown/restart recovery, and an unchanged UA-0E0723 baseline. Fault injection and cleanup require explicit approval. Do not recreate the missing original payment callback or begin payment notifications.

## Limits

This remains a local-only operator process, not a production worker. Guard reads and writes are separate operations: topology or role changes can race after validation; stop topology/schema administration during tests. All targets remain direct loopback. The protected-booking query fence assumes its business ID is not concurrently renamed. Claims/backoff use client time; acknowledgment uses server time. Outboxes are scanned and retained, so large fan-out or production scale needs separate index/retention review. The local lock is a cooperative same-machine lock, not a distributed leader election mechanism. Delivery is at least once with idempotent insertion, not an exactly-once cross-collection transaction.

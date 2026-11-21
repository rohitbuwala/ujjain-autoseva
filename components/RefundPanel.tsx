"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

type RefundItem = {
  id: string;
  bookingCode: string;
  status: string;
  reason: string;
  requestedPaise: number | null;
  approvedPaise: number | null;
  requestedAt: string;
  rejectionReason: string | null;
  type: string | null;
  capturedPaise?: number;
  paymentId?: string;
  bookingStatus?: string;
  cancelledAt?: string;
  paidAt?: string;
  reservedPaise?: number | null;
  processedPaise?: number | null;
  availablePaise?: number | null;
  eligible?: boolean;
  providerCheckStatus?: string | null;
  providerIssue?: string | null;
  audit?: { status: string; actorId: string; at: string; note?: string }[];
};

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
const money = (amount?: number | null) => amount == null ? "—" : inr.format(amount / 100);
const label = (status: string) => status.replaceAll("_", " ");
const date = (value?: string | null) => value ? new Date(value).toLocaleString() : "—";

function parsePaise(value: string) {
  if (!/^\d{1,12}(\.\d{1,2})?$/.test(value)) return undefined;
  const [rupees, fraction = ""] = value.split(".");
  const amount = Number(rupees) * 100 + Number(fraction.padEnd(2, "0"));
  return amount > 0 ? amount : undefined;
}

async function api(path: string, account: string, options?: RequestInit) {
  const response = await fetch(path, {
    ...options,
    cache: "no-store",
    headers: { "Content-Type": "application/json", "X-Refund-Account": account },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Unable to load refunds.");
  return data;
}

export default function RefundPanel({ admin = false, bookings = [] }: {
  admin?: boolean;
  bookings?: { id: string; code: string }[];
}) {
  const { data: session } = useSession();
  const account = session?.user?.id;
  if (!account || (admin && session.user.role !== "admin")) return null;
  return <RefundHistory key={account} account={account} admin={admin} bookings={bookings} />;
}

function RefundHistory({ account, admin, bookings }: {
  account: string;
  admin: boolean;
  bookings: { id: string; code: string }[];
}) {
  const url = admin ? "/api/admin/refunds" : "/api/refunds";
  const [open, setOpen] = useState(admin);
  const [all, setAll] = useState(false);
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const [response, setResponse] = useState<{ items: RefundItem[]; hasMore: boolean } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const request = new AbortController();
    api(`${url}?page=${page}&scope=${all ? "all" : "pending"}`, account, { signal: request.signal })
      .then((data) => { if (!request.signal.aborted) setResponse(data); })
      .catch((err: Error) => { if (!request.signal.aborted) setError(err.message); });
    return () => request.abort();
  }, [account, all, open, page, url, version]);

  function reload(nextPage = page) {
    setResponse(null);
    setError("");
    setPage(nextPage);
    setVersion((previous) => previous + 1);
  }

  return (
    <section className="mx-auto mb-6 w-full max-w-5xl space-y-4 rounded-lg border bg-background p-4" aria-label="Refunds">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{admin ? "Refund management" : "Refund requests"}</h2>
        <Button type="button" variant="outline" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? "Hide refunds" : "View refunds"}</Button>
      </div>
      {open && <>
        <p className="text-sm text-muted-foreground">An approval records the admin’s decision. Money is returned only when the refund is processed.</p>
        {admin ? (
          <>
            <RefundWebhookReview account={account} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={all} onChange={(event) => { setAll(event.target.checked); reload(1); }} />
              Include refund history
            </label>
          </>
        ) : bookings.length > 0 && <RefundRequestForm account={account} bookings={bookings} onSuccess={() => reload(1)} />}
        {error && <div className="flex flex-wrap items-center gap-3">
          <p role="alert" className="text-sm text-destructive">{error}</p>
          <Button type="button" variant="outline" onClick={() => reload()}>Retry</Button>
        </div>}
        {!response && !error && <p role="status" className="text-sm text-muted-foreground">Loading refund requests.</p>}
        {response?.items.length === 0 && <p className="text-sm text-muted-foreground">No refund requests on this page.</p>}
        {response?.items.map((refund) => (
          <article className="space-y-2 rounded-md border p-3 text-sm [overflow-wrap:anywhere]" key={refund.id}>
            <h3 className="font-semibold">Booking {refund.bookingCode}</h3>
            <p>Status <span className="capitalize">{label(refund.status)}</span></p>
            <p>Requested {money(refund.requestedPaise)} · Approved {money(refund.approvedPaise)}{refund.type && ` (${refund.type})`}</p>
            <p>{refund.reason}</p>
            <p className="text-muted-foreground">{date(refund.requestedAt)}</p>
            {refund.rejectionReason && <p>Rejection reason {refund.rejectionReason}</p>}
            {admin && <>
              <p>Booking status {refund.bookingStatus ?? "Unavailable"} · Cancelled {date(refund.cancelledAt)}</p>
              <p>Payment {refund.paymentId} · Captured {money(refund.capturedPaise)} · Recorded {date(refund.paidAt)}</p>
              <p>Reserved {money(refund.reservedPaise)} · Processed {money(refund.processedPaise)} · Local available {money(refund.availablePaise)}</p>
              <RefundProviderCheck refund={refund} account={account} />
              {refund.status === "approved" && <RefundSubmissionControls refundId={refund.id} account={account} />}
              {refund.status === "under_review" && <RefundDecisionForm refund={refund} account={account} onSuccess={() => reload()} />}
              <details>
                <summary className="cursor-pointer font-medium">Audit history</summary>
                <ul className="mt-2 space-y-1">
                  {refund.audit?.map((entry, index) => (
                    <li key={index}>{date(entry.at)} · {label(entry.status)} · {entry.actorId}{entry.note && ` · ${entry.note}`}</li>
                  ))}
                </ul>
              </details>
            </>}
          </article>
        ))}
        {response && (page > 1 || response.hasMore) && <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" disabled={page === 1} onClick={() => reload(page - 1)}>Newer</Button>
          <span className="text-sm">Page {page}</span>
          <Button type="button" variant="outline" disabled={!response.hasMore || page === 1000} onClick={() => reload(page + 1)}>Older</Button>
        </div>}
      </>}
    </section>
  );
}

const inputClass = "w-full rounded-md border bg-background px-3 py-2 text-sm";

function RefundSubmissionControls({ refundId, account }: { refundId: string; account: string }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  async function run(action: "prepare" | "recover") {
    setPending(true);
    try {
      const result = await api(`/api/admin/refunds/${refundId}/submission`, account, {
        method: "POST", body: JSON.stringify({ action }),
      });
      setMessage(result.status === "linked" ? "Provider refund linked. Check the webhook inbox for settlement."
        : result.status === "review" ? `Operator review required. ${label(result.issue)}.`
        : "Submission intent recorded. Refund execution is disabled.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to check refund submission.");
    } finally {
      setPending(false);
    }
  }
  return <div className="space-y-1">
    <p>Refund execution is disabled.</p>
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" disabled={pending} onClick={() => void run("prepare")}>Prepare submission intent</Button>
      <Button type="button" variant="outline" disabled={pending} onClick={() => void run("recover")}>Check prior submission</Button>
    </div>
    {message && <p role="status">{message}</p>}
  </div>;
}

type WebhookItem = {
  id: string;
  eventType: string;
  refundId: string;
  paymentId: string;
  amountPaise: number;
  state: string;
  issue: string | null;
  verifiedStatus: string | null;
  receivedAt: string;
  checkedAt: string | null;
  nextAttemptAt: string | null;
  conflictAt: string | null;
  acknowledgedAt: string | null;
};
type WebhookPage = { items: WebhookItem[]; hasMore: boolean };
const webhookReviewPath = "/api/admin/refunds/webhook-inbox";

function RefundWebhookReview({ account }: { account: string }) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const [data, setData] = useState<WebhookPage | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    api(`${webhookReviewPath}?page=${page}`, account, { signal: controller.signal })
      .then((result) => { if (!controller.signal.aborted) setData(result); })
      .catch(() => { if (!controller.signal.aborted) setError("Unable to load refund webhook events."); });
    return () => controller.abort();
  }, [account, open, page, version]);

  function load(nextPage = page) {
    setData(null);
    setError("");
    setPage(nextPage);
    setVersion((value) => value + 1);
  }

  async function run(action: "process_next" | "recheck" | "resolve" | "acknowledge", id?: string) {
    setActionPending(true);
    setError("");
    setMessage("");
    try {
      const result = await api(webhookReviewPath, account, { method: "POST", body: JSON.stringify({ action, id }) });
      setMessage(result.acknowledged ? "External refund acknowledged. The ledger is unchanged."
        : result.checked ? "Check completed. See the event for the result." : "No webhook events are due.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to check the webhook event.");
    } finally {
      setActionPending(false);
    }
  }

  return <section className="space-y-2 rounded-md border p-3 text-sm" aria-label="Refund webhook review">
    <Button type="button" variant="outline" onClick={() => setOpen(!open)} aria-expanded={open}>
      {open ? "Hide webhook inbox" : "Review refund webhooks"}
    </Button>
    {open && <>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={actionPending} onClick={() => void run("process_next")}>Check next due event</Button>
        <Button type="button" variant="outline" onClick={() => load()}>Refresh inbox</Button>
      </div>
      {message && <p role="status">{message}</p>}
      {error && <p role="alert" className="text-destructive">{error}</p>}
      {!data && !error && <p role="status">Loading webhook events.</p>}
      {data?.items.length === 0 && <p>No webhook events on this page.</p>}
      {data?.items.map((event) => <article key={event.id} className="space-y-1 rounded-md border p-2 [overflow-wrap:anywhere]">
        <p className="font-medium">{event.eventType} · {label(event.state)} · {money(event.amountPaise)}</p>
        <p>Refund {event.refundId} · Payment {event.paymentId}</p>
        <p>Received {date(event.receivedAt)} · Last checked {date(event.checkedAt)}</p>
        {event.nextAttemptAt && <p>Due {date(event.nextAttemptAt)}</p>}
        {event.issue && <p>Issue {label(event.issue)}</p>}
        {event.verifiedStatus && <p>Verified provider status {label(event.verifiedStatus)}</p>}
        {event.acknowledgedAt && <p>Acknowledged {date(event.acknowledgedAt)}</p>}
        <div className="flex flex-wrap gap-2">
          {!event.conflictAt && event.state !== "applied" && <Button type="button" variant="outline" size="sm"
            disabled={actionPending} onClick={() => void run("recheck", event.id)}>Read-only recheck</Button>}
          {event.state === "review" && event.issue === "verified_reconciliation_available" &&
            <Button type="button" variant="outline" size="sm" disabled={actionPending}
              onClick={() => void run("resolve", event.id)}>Apply verified reconciliation</Button>}
          {event.state === "review" && event.issue === "external_refund" &&
            (event.verifiedStatus === "processed" || event.verifiedStatus === "failed") &&
            <Button type="button" variant="outline" size="sm" disabled={actionPending}
              onClick={() => void run("acknowledge", event.id)}>Acknowledge external refund</Button>}
        </div>
      </article>)}
      {data && (page > 1 || data.hasMore) && <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" disabled={page === 1} onClick={() => load(page - 1)}>Newer events</Button>
        <span>Page {page}</span>
        <Button type="button" variant="outline" disabled={!data.hasMore || page === 1000} onClick={() => load(page + 1)}>Older events</Button>
      </div>}
    </>}
  </section>;
}

function RefundProviderCheck({ refund, account }: { refund: RefundItem; account: string }) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState("");
  async function check() {
    setPending(true);
    try {
      const snapshot = await api(`/api/admin/refunds/${refund.id}/reconcile`, account, { method: "POST" });
      setResult(snapshot.status === "verified"
        ? `Provider check complete. Available after reservations ${money(snapshot.availablePaise)}.`
        : `Operator review required. ${label(snapshot.issue || "unknown_balance")}.`);
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Unable to check provider balance.");
    } finally { setPending(false); }
  }
  return <div className="space-y-1">
    {refund.providerIssue && !result && <p>Provider review required · {label(refund.providerIssue)}</p>}
    {result && <p role="status">{result}</p>}
    <Button type="button" variant="outline" disabled={pending} onClick={() => void check()}>
      {pending ? "Checking…" : "Check Razorpay balance"}
    </Button>
  </div>;
}

function RefundRequestForm({ account, bookings, onSuccess }: {
  account: string; bookings: { id: string; code: string }[]; onSuccess: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState<{ payload: string; key: string }>();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const amount = String(fields.get("amount") || "").trim();
    const requestedPaise = amount ? parsePaise(amount) : undefined;
    if (amount && requestedPaise === undefined) { setError("Enter a positive INR amount with up to two decimal places."); return; }
    const payload = { bookingId: fields.get("bookingId"), reason: fields.get("reason"), requestedPaise };
    const serialized = JSON.stringify(payload);
    const key = attempt?.payload === serialized ? attempt.key : crypto.randomUUID();
    setAttempt({ payload: serialized, key });
    setPending(true);
    setError("");
    try {
      await api("/api/refunds", account, { method: "POST", body: JSON.stringify({ ...payload, operationKey: key }) });
      form.reset();
      setAttempt(undefined);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit request.");
    } finally {
      setPending(false);
    }
  }

  return <form onSubmit={submit} className="space-y-2 rounded-md border p-3">
    <label className="block text-sm">Cancelled booking
      <select name="bookingId" required defaultValue="" className={inputClass}>
        <option value="" disabled>Select a booking</option>
        {bookings.map((booking) => <option key={booking.id} value={booking.id}>{booking.code}</option>)}
      </select>
    </label>
    <label className="block text-sm">Requested amount in INR (optional)<input name="amount" inputMode="decimal" className={inputClass} /></label>
    <label className="block text-sm">Refund reason<textarea name="reason" required minLength={3} maxLength={500} className={inputClass} /></label>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <Button type="submit" disabled={pending}>{pending ? "Submitting…" : "Request refund"}</Button>
  </form>;
}

function RefundDecisionForm({ refund, account, onSuccess }: { refund: RefundItem; account: string; onSuccess: () => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const fields = new FormData(event.currentTarget);
    const action = (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value");
    if (action !== "approve" && action !== "reject") return;
    const amountPaise = action === "approve" ? parsePaise(String(fields.get("amount") || "").trim()) : undefined;
    if (action === "approve" && amountPaise === undefined) { setError("Enter an approved amount in INR."); return; }
    setError("");
    setPending(true);
    try {
      await api(`/api/admin/refunds/${refund.id}`, account, {
        method: "PATCH", body: JSON.stringify({ action, amountPaise, reason: fields.get("reason") }),
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to record the refund decision.");
    } finally {
      setPending(false);
    }
  }

  return <form onSubmit={submit} className="space-y-2">
    {!refund.eligible && <p className="text-destructive">Approval unavailable. Check the capture and refundable balance.</p>}
    <label className="block">Approved amount in INR<input name="amount" inputMode="decimal" className={inputClass} disabled={!refund.eligible} /></label>
    <label className="block">Decision reason<textarea name="reason" required minLength={3} maxLength={500} className={inputClass} /></label>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <div className="flex flex-wrap gap-2">
      <Button type="submit" value="approve" disabled={pending || !refund.eligible}>Approve amount</Button>
      <Button type="submit" value="reject" variant="outline" disabled={pending}>Reject</Button>
    </div>
  </form>;
}

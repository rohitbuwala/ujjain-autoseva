"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type NotificationItem = {
  _id: string;
  title: string;
  message: string;
  createdAt: string;
  readAt: string | null;
};

type HistoryPage = {
  notifications: NotificationItem[];
  pagination: { page: number; pages: number };
};

type Summary = { count: number; latestId?: string | null };
type Access = "ready" | "checking" | "expired" | "forbidden";
type Toast = { title: string; message: string };
type InboxRequest = { controller: AbortController; background: boolean; done: Promise<boolean> };

const POLL_INTERVAL = 25_000;
const TRIGGER_GAP = 2_000;
const RECONCILE_INTERVAL = 120_000;
const REQUEST_TIMEOUT = 12_000;
const HISTORY_URL = "/api/notifications";

class NotificationError extends Error {
  constructor(readonly status: number, readonly retryAt: number) {
    super("Notification request failed");
  }
}

function readRetryAt(value: string | null) {
  if (!value) return 0;
  if (/^\d+$/.test(value)) {
    const delay = Number(value) * 1_000;
    return Number.isSafeInteger(delay) ? Date.now() + delay : 0;
  }
  return Date.parse(value) || 0;
}

async function notificationRequest<T>(
  url: string,
  recipientId: string,
  signal: AbortSignal,
  method = "GET"
): Promise<T> {
  signal.throwIfAborted();
  const response = await fetch(url, {
    method,
    signal,
    cache: "no-store",
    headers: { "X-Notification-Recipient": recipientId },
  });
  if (!response.ok) throw new NotificationError(response.status, readRetryAt(response.headers.get("Retry-After")));

  const body = await response.json() as { success: boolean; data: T };
  if (!body.success || body.data == null) throw new Error("Invalid notification response");
  signal.throwIfAborted();
  return body.data;
}

function visible() {
  return document.visibilityState === "visible";
}

type ToastWatermark = { time: number; ids: Set<string> };

export function useNotificationInbox(recipientId: string) {
  const [history, setHistory] = useState<HistoryPage | null>(null);
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [access, setAccess] = useState<Access>("ready");
  const [toast, setToast] = useState<Toast | null>(null);

  const mounted = useRef(false);
  const request = useRef<InboxRequest | null>(null);
  const actionPending = useRef(false);
  const schedule = useRef<() => void>(() => {});
  const accessState = useRef<Access>("ready");
  const timing = useRef({ lastStart: -Infinity, next: 0, retry: 0, rateLimit: 0, failures: 0 });
  const cached = useRef<{ summary: Summary; history: HistoryPage; loadedAt: number } | null>(null);
  const viewedPage = useRef(1);
  const stalePage = useRef(false);
  const newest = useRef<ToastWatermark | null>(null);

  const updateAccess = useCallback((state: Access) => {
    accessState.current = state;
    setAccess(state);
  }, []);

  const clearInbox = useCallback(() => {
    cached.current = null;
    newest.current = null;
    stalePage.current = false;
    viewedPage.current = 1;
    setHistory(null);
    setUnreadCount(null);
    setToast(null);
    setError(null);
  }, []);

  const run = useCallback((
    background: boolean,
    work: (signal: AbortSignal) => Promise<void>,
    failureMessage: string
  ) => {
    const controller = new AbortController();
    const { signal } = controller;
    const timeoutReason = new DOMException("Notification request timed out", "TimeoutError");
    const timeout = window.setTimeout(() => controller.abort(timeoutReason), REQUEST_TIMEOUT);
    const operation: InboxRequest = { controller, background, done: Promise.resolve(false) };
    request.current = operation;
    operation.done = (async () => {
      try {
        await work(signal);
        signal.throwIfAborted();
        setError(null);
        return true;
      } catch (cause) {
        if (request.current !== operation || (signal.aborted && signal.reason !== timeoutReason)) return false;

        const status = cause instanceof NotificationError ? cause.status : 0;
        const clock = timing.current;
        if (status === 401 || status === 403) {
          clearInbox();
          updateAccess(status === 401 ? "checking" : "forbidden");
          clock.next = 0;
          if (status === 401) {
            clock.failures++;
            clock.retry = 0;
          }
        } else {
          if (status === 429 || status === 0 || status >= 500) {
            clock.failures++;
            const delay = Math.min(POLL_INTERVAL * 2 ** Math.min(clock.failures - 1, 3), RECONCILE_INTERVAL);
            const serverRetry = cause instanceof NotificationError ? cause.retryAt : 0;
            clock.retry = Math.max(Date.now() + delay, serverRetry);
            if (status === 429 || serverRetry > Date.now()) clock.rateLimit = clock.retry;
          }
          setError(status === 429 ? "Too many requests. Notifications will retry automatically." : failureMessage);
        }
        return false;
      } finally {
        window.clearTimeout(timeout);
        if (request.current === operation) {
          request.current = null;
          schedule.current();
        }
      }
    })();
    return operation.done;
  }, [clearInbox, updateAccess]);

  const refresh = useCallback((manual = false) => {
    const state = accessState.current;
    const clock = timing.current;
    const now = Date.now();
    if (!visible() || request.current || actionPending.current || now < clock.rateLimit) return;
    if (state === "forbidden" && !manual) return;
    if (!manual && (now < clock.retry || (state !== "checking" && now < clock.lastStart + TRIGGER_GAP))) return;

    clock.lastStart = now;
    clock.next = now + POLL_INTERVAL;

    if (state !== "ready") {
      updateAccess("checking");
      return run(true, async (signal) => {
        const response = await fetch("/api/auth/session", { cache: "no-store", signal });
        signal.throwIfAborted();
        if (response.status === 401 || response.status === 403) {
          updateAccess("expired");
          return;
        }
        if (!response.ok) throw new NotificationError(response.status, readRetryAt(response.headers.get("Retry-After")));
        const session = await response.json() as { user?: { id?: string } } | null;
        signal.throwIfAborted();
        if (session?.user?.id === recipientId) {
          clock.retry = 0;
          clock.next = Date.now() + Math.min(TRIGGER_GAP * 2 ** Math.min(Math.max(0, clock.failures - 1), 6), RECONCILE_INTERVAL);
          updateAccess("ready");
        } else {
          updateAccess("expired");
        }
      }, "Couldn't verify your session. Try again.");
    }

    return run(true, async (signal) => {
      const summary = await notificationRequest<Summary>(`${HISTORY_URL}/unread-count`, recipientId, signal);
      setUnreadCount(summary.count);
      const previous = cached.current;
      const expiredHistory = !previous || now - previous.loadedAt >= RECONCILE_INTERVAL;
      const changed = summary.latestId === undefined || previous?.summary.latestId !== summary.latestId ||
        previous?.summary.count !== summary.count;

      let latest = previous?.history;
      if (manual || stalePage.current || expiredHistory || changed) {
        signal.throwIfAborted();
        if (!visible()) return;
        latest = await notificationRequest<HistoryPage>(HISTORY_URL, recipientId, signal);
        cached.current = { summary, history: latest, loadedAt: Date.now() };
        if (viewedPage.current === 1) setHistory(latest);
      }

      if (stalePage.current || (manual && viewedPage.current > 1)) {
        signal.throwIfAborted();
        if (!visible()) return;
        const page = Math.min(viewedPage.current, Math.max(latest?.pagination.pages ?? 1, 1));
        const current = page === 1 ? latest : await notificationRequest<HistoryPage>(`${HISTORY_URL}?page=${page}`, recipientId, signal);
        if (current) {
          viewedPage.current = page;
          setHistory(current);
          stalePage.current = false;
        }
      }

      clock.failures = 0;
      clock.retry = 0;
      clock.rateLimit = 0;
      if (!latest) return;
      const previousHead = newest.current;
      if (previousHead && (!visible() || !document.hasFocus())) return;

      // Keep the IDs at the latest timestamp so simultaneous inserts can arrive in either ID order.
      const firstItem = latest.notifications[0];
      const time = firstItem ? Date.parse(firstItem.createdAt) : -Infinity;
      if (previousHead && time < previousHead.time) return;
      const ids = new Set(time === previousHead?.time ? previousHead.ids : undefined);
      const arrivals = latest.notifications.filter((item) => {
        const createdAt = Date.parse(item.createdAt);
        if (createdAt === time) ids.add(item._id);
        return previousHead && !item.readAt && (createdAt > previousHead.time ||
          (createdAt === previousHead.time && !previousHead.ids.has(item._id)));
      });
      newest.current = { time, ids };

      const first = arrivals[0];
      if (first) {
        setToast(arrivals.length === 1
          ? { title: first.title, message: first.message }
          : { title: `${arrivals.length} new notifications`, message: first.title });
      }
    }, "Couldn't refresh notifications. Try again.");
  }, [recipientId, run, updateAccess]);

  useEffect(() => {
    mounted.current = true;
    let timer: number | undefined;

    function plan() {
      window.clearTimeout(timer);
      const state = accessState.current;
      if (!visible() || request.current || actionPending.current || state === "expired" || state === "forbidden") return;
      const clock = timing.current;
      const due = state === "checking"
        ? Math.max(clock.next, clock.retry, clock.rateLimit)
        : Math.max(clock.next, clock.lastStart + TRIGGER_GAP, clock.retry, clock.rateLimit);
      timer = window.setTimeout(() => {
        if (due > Date.now()) plan();
        else void refresh();
      }, Math.min(2_147_483_647, Math.max(0, due - Date.now())));
    }

    function onVisibility() {
      if (!visible() && request.current?.background) {
        timing.current.next = 0;
        request.current.controller.abort();
      }
      if (visible()) void refresh();
      plan();
    }

    function onFocus() {
      void refresh();
    }

    schedule.current = plan;
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);

    return () => {
      mounted.current = false;
      window.clearTimeout(timer);
      schedule.current = () => {};
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
      const pending = request.current;
      request.current = null;
      pending?.controller.abort();
    };
  }, [refresh]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 6_000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function act(work: (signal: AbortSignal) => Promise<void>, failureMessage: string) {
    if (actionPending.current || accessState.current !== "ready" || Date.now() < timing.current.rateLimit) return false;
    actionPending.current = true;
    setBusy(true);
    try {
      const pending = request.current;
      if (pending?.background) {
        pending.controller.abort();
        await pending.done;
      }
      if (!mounted.current || accessState.current !== "ready") return false;
      return await run(false, work, failureMessage);
    } finally {
      actionPending.current = false;
      if (mounted.current) {
        setBusy(false);
        schedule.current();
      }
    }
  }

  function goToPage(page: number) {
    return act(async (signal) => {
      const result = await notificationRequest<HistoryPage>(`${HISTORY_URL}?page=${page}`, recipientId, signal);
      viewedPage.current = page;
      setHistory(result);
    }, "Couldn't load that page. Try again.");
  }

  function markRead(id: string) {
    return act(async (signal) => {
      try {
        const updated = await notificationRequest<NotificationItem>(
          `${HISTORY_URL}/${encodeURIComponent(id)}/read`, recipientId, signal, "PATCH"
        );
        setHistory((current) => current && {
          ...current,
          notifications: current.notifications.map((item) => item._id === id ? updated : item),
        });
        setUnreadCount((count) => count === null ? null : Math.max(0, count - 1));
      } catch (cause) {
        if (!(cause instanceof NotificationError) || cause.status !== 404) throw cause;
        signal.throwIfAborted();
        setHistory((current) => current && {
          ...current,
          notifications: current.notifications.filter((item) => item._id !== id),
        });
        stalePage.current = true;
      }
      cached.current = null;
      timing.current.next = 0;
    }, "Couldn't update this notification. Try again.");
  }

  return { history, unreadCount, error, busy, access, toast, refresh, goToPage, markRead, dismissToast: () => setToast(null) };
}

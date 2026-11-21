"use client";

import Link from "next/link";
import { useRef, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { Bell, X } from "lucide-react";
import { Popover } from "radix-ui";

import { Button } from "@/components/ui/button";
import { useNotificationInbox } from "@/components/useNotificationInbox";

const timestamp = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

export default function NotificationInbox({ recipientId }: { recipientId: string }) {
  const inbox = useNotificationInbox(recipientId);
  const { history, unreadCount, error, busy, access, toast } = inbox;
  const heading = useRef<HTMLHeadingElement>(null);
  const page = history?.pagination.page ?? 1;
  const pages = history?.pagination.pages ?? 0;

  async function markRead(event: MouseEvent<HTMLButtonElement>, id: string) {
    const button = event.currentTarget;
    const startedWithFocus = document.activeElement === button;
    const changed = await inbox.markRead(id);
    if (changed && startedWithFocus && (document.activeElement === button || document.activeElement === document.body)) {
      heading.current?.focus();
    }
  }

  return (
    <>
      <Popover.Root onOpenChange={(open) => { if (open) void inbox.refresh(); }}>
        <Popover.Trigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative rounded-full"
            aria-label={unreadCount ? `Notifications (${unreadCount} unread)` : "Notifications"}
          >
            <Bell aria-hidden="true" />
            {!!unreadCount && (
              <span aria-hidden="true" className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            aria-label="Notifications"
            align="end"
            sideOffset={12}
            collisionPadding={12}
            className="z-[60] flex max-h-[min(32rem,var(--radix-popover-content-available-height))] w-[min(24rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg"
          >
            <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2">
              <h2 ref={heading} tabIndex={-1} className="rounded-sm font-semibold focus-visible:outline-2 focus-visible:outline-ring">Notifications</h2>
              <Popover.Close asChild>
                <Button type="button" variant="ghost" size="icon" aria-label="Close notifications">
                  <X aria-hidden="true" />
                </Button>
              </Popover.Close>
            </header>

            <div className="min-h-0 overflow-y-auto overscroll-contain" aria-busy={busy}>
              {access === "checking" && !error && (
                <p role="status" className="p-4 text-sm text-muted-foreground">Checking your session.</p>
              )}
              {access === "expired" && (
                <div className="space-y-2 p-4 text-sm">
                  <p>Your session ended. Sign in to see your notifications.</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Link href="/login" className="font-medium text-primary underline underline-offset-4">Sign in</Link>
                    <Button type="button" size="sm" variant="outline" onClick={() => void inbox.refresh(true)}>Recheck session</Button>
                  </div>
                </div>
              )}
              {access === "forbidden" && (
                <div className="space-y-2 p-4 text-sm">
                  <p role="alert">You don’t currently have access to notifications.</p>
                  <Button type="button" size="sm" variant="outline" onClick={() => void inbox.refresh(true)}>Retry access</Button>
                </div>
              )}
              {error && (
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 text-sm">
                  <p role="alert">{error}</p>
                  <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void inbox.refresh(true)}>Refresh</Button>
                </div>
              )}
              {!history && access === "ready" && !error && (
                <p role="status" className="p-4 text-sm text-muted-foreground">Loading notifications…</p>
              )}
              {history && history.notifications.length === 0 && (
                <p className="p-4 text-sm text-muted-foreground">
                  {page === 1 ? "You have no notifications yet." : "No notifications on this page."}
                </p>
              )}
              {history && history.notifications.length > 0 && (
                <ul className="divide-y divide-border" aria-label="Notification history">
                  {history.notifications.map((item) => (
                    <li key={item._id} className={`space-y-1 px-4 py-3 ${item.readAt ? "" : "bg-accent/50"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 text-sm font-semibold [overflow-wrap:anywhere]">{item.title}</p>
                        <span className={`shrink-0 text-xs ${item.readAt ? "text-muted-foreground" : "font-semibold text-primary"}`}>
                          {item.readAt ? "Read" : "Unread"}
                        </span>
                      </div>
                      <p className="whitespace-pre-line text-sm text-muted-foreground [overflow-wrap:anywhere]">{item.message}</p>
                      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                        <time dateTime={item.createdAt} className="text-xs text-muted-foreground">
                          {timestamp.format(new Date(item.createdAt))}
                        </time>
                        {!item.readAt && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="-mr-2 px-2 text-xs"
                            disabled={busy}
                            aria-label={`Mark ${item.title} as read`}
                            onClick={(event) => void markRead(event, item._id)}
                          >
                            Mark as read
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {(page > 1 || pages > 1) && (
              <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-border px-4 py-2">
                <Button type="button" variant="ghost" size="sm" disabled={busy || page <= 1} onClick={() => void inbox.goToPage(page - 1)}>Newer</Button>
                <span className="text-xs text-muted-foreground">Page {page}</span>
                <Button type="button" variant="ghost" size="sm" disabled={busy || page >= pages} onClick={() => void inbox.goToPage(page + 1)}>Older</Button>
              </footer>
            )}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      <div role="status" className="sr-only">{toast && `${toast.title}. ${toast.message}`}</div>
      {toast && createPortal(
        <div className="fixed bottom-4 left-4 z-[70] flex w-[min(22rem,calc(100vw-5rem))] items-start gap-3 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg">
          <Bell aria-hidden="true" className="mt-1 size-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
            <p className="text-sm font-semibold">{toast.title}</p>
            <p className="line-clamp-3 text-sm text-muted-foreground">{toast.message}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" aria-label="Dismiss notification alert" className="-mr-1 -mt-1 shrink-0" onClick={inbox.dismissToast}>
            <X aria-hidden="true" />
          </Button>
        </div>,
        document.body
      )}
    </>
  );
}

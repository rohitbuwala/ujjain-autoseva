export class NotificationGuardError extends Error {
  constructor() { super("local_notification_safety_check_failed"); }
}

export async function guardNotificationWrite(guard?: () => Promise<void>) {
  if (!guard) return;
  try { await guard(); }
  catch { throw new NotificationGuardError(); }
}

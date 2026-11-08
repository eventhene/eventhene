/**
 * When an event is finished, and what that closes.
 *
 * A free event is approved once, for that event. Once it is over it must not be
 * reopened by editing the title, flyer or dates into a different event: that
 * would turn one approval into unlimited free events. The organizer requests a
 * new one instead.
 *
 * Derived from the dates rather than stored, so there is no sweep to run and no
 * window where a finished event still looks live.
 */

export interface EventLike {
  type: "PAID" | "FREE" | string;
  status: string;
  endsAt: Date;
  /** Superadmin reopened it until this moment, to fix something or let a late guest in. */
  reopenedUntil?: Date | null;
  /** Superadmin shut it early, before the end date. */
  forceClosed?: boolean | null;
}

/** Grace after the end time before we treat an event as history. */
const GRACE_MS = 6 * 60 * 60 * 1000;

export function isEventOver(event: Pick<EventLike, "endsAt">, now = new Date()): boolean {
  return now.getTime() > event.endsAt.getTime() + GRACE_MS;
}

/**
 * Cancelled and ended events are closed too, whatever the clock says, and a
 * superadmin can override in either direction: shut one early, or reopen a
 * finished one for a while.
 */
export function isClosed(
  event: Pick<EventLike, "status" | "endsAt" | "reopenedUntil" | "forceClosed">,
  now = new Date()
): boolean {
  if (event.forceClosed) return true;
  if (event.reopenedUntil && now.getTime() < event.reopenedUntil.getTime()) return false;
  if (event.status === "ENDED" || event.status === "CANCELLED") return true;
  return isEventOver(event, now);
}

/** True while a superadmin's reopen window is still running. */
export function isReopened(
  event: Pick<EventLike, "reopenedUntil" | "forceClosed">,
  now = new Date()
): boolean {
  return !event.forceClosed && !!event.reopenedUntil && now.getTime() < event.reopenedUntil.getTime();
}

/**
 * A finished free event is frozen: no edits at all, so it cannot be recycled
 * into a second free event. Paid events stay editable, because the organizer
 * pays per ticket and there is nothing to game.
 */
export function isFreeEventLocked(
  event: Pick<EventLike, "type" | "status" | "endsAt" | "reopenedUntil" | "forceClosed">,
  now = new Date()
): boolean {
  return event.type === "FREE" && isClosed(event, now);
}

export const FREE_EVENT_LOCKED_MESSAGE =
  "This free event has finished, so it can no longer be edited. Free events are approved one at a time. Create a new event and we will review it.";

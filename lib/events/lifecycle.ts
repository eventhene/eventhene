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
}

/** Grace after the end time before we treat an event as history. */
const GRACE_MS = 6 * 60 * 60 * 1000;

export function isEventOver(event: Pick<EventLike, "endsAt">, now = new Date()): boolean {
  return now.getTime() > event.endsAt.getTime() + GRACE_MS;
}

/** Cancelled and ended events are closed too, whatever the clock says. */
export function isClosed(event: Pick<EventLike, "status" | "endsAt">, now = new Date()): boolean {
  if (event.status === "ENDED" || event.status === "CANCELLED") return true;
  return isEventOver(event, now);
}

/**
 * A finished free event is frozen: no edits at all, so it cannot be recycled
 * into a second free event. Paid events stay editable, because the organizer
 * pays per ticket and there is nothing to game.
 */
export function isFreeEventLocked(
  event: Pick<EventLike, "type" | "status" | "endsAt">,
  now = new Date()
): boolean {
  return event.type === "FREE" && isClosed(event, now);
}

export const FREE_EVENT_LOCKED_MESSAGE =
  "This free event has finished, so it can no longer be edited. Free events are approved one at a time. Create a new event and we will review it.";

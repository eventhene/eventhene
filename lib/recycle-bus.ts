/**
 * Tiny global event bus (window CustomEvents) so any page can tell the recycle bin that
 * something was deleted, and any page can refresh when something is restored.
 * Every function is a no-op on the server.
 */
export type BinKind = "guest" | "contact" | "contact_list" | "team_member";

export interface FlyDetail {
  rect: { x: number; y: number; w: number; h: number } | null;
  kind: BinKind;
  count: number;
}

const CHANGED = "eh:bin:changed";
const FLY = "eh:bin:fly";
const RESTORED = "eh:bin:restored";

function fire(name: string, detail?: unknown) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

/** Capture a button's position. Call this synchronously in the click handler, before any state change. */
export function rectOf(el: Element | null | undefined): FlyDetail["rect"] {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
}

/** Something was deleted or detached: the bin refetches. Pass an origin rect to animate a flight. */
export function binDeleted(kind: BinKind, rect: FlyDetail["rect"], count = 1) {
  fire(FLY, { rect, kind, count } satisfies FlyDetail);
  fire(CHANGED);
}

export function binChanged() {
  fire(CHANGED);
}

/** Something came back: pages showing that data should refetch. */
export function binRestored(kind: BinKind) {
  fire(RESTORED, { kind });
  fire(CHANGED);
}

export function onBinChanged(fn: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CHANGED, fn);
  return () => window.removeEventListener(CHANGED, fn);
}

export function onBinFly(fn: (d: FlyDetail) => void) {
  if (typeof window === "undefined") return () => {};
  const h = (e: Event) => fn((e as CustomEvent<FlyDetail>).detail);
  window.addEventListener(FLY, h);
  return () => window.removeEventListener(FLY, h);
}

export function onBinRestored(fn: (kind: BinKind) => void) {
  if (typeof window === "undefined") return () => {};
  const h = (e: Event) => fn((e as CustomEvent<{ kind: BinKind }>).detail.kind);
  window.addEventListener(RESTORED, h);
  return () => window.removeEventListener(RESTORED, h);
}

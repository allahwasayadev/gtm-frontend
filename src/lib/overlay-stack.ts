/**
 * A stack of the overlays that are open right now.
 *
 * Escape has to close exactly one thing: the top one. Without this, a dropdown
 * opened inside the filter sheet had two independent Escape handlers — the
 * sheet's on the capture phase and the dropdown's on the bubble phase — so one
 * key press closed the listbox *and* the sheet underneath it, and the reader
 * lost their place.
 *
 * Each overlay takes a ticket when it opens and returns it when it closes. An
 * overlay only reacts to Escape while it holds the top ticket.
 */
let nextId = 1;
const stack: number[] = [];

export function pushOverlay(): number {
  const id = nextId++;
  stack.push(id);
  return id;
}

export function popOverlay(id: number): void {
  const i = stack.lastIndexOf(id);
  if (i !== -1) stack.splice(i, 1);
}

/** True when `id` is the frontmost open overlay. */
export function isTopOverlay(id: number): boolean {
  return stack.length > 0 && stack[stack.length - 1] === id;
}

/** How many overlays are open; useful in assertions and tests. */
export function overlayDepth(): number {
  return stack.length;
}

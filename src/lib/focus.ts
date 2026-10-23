const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button',
  'input',
  'select',
  'textarea',
  'details > summary:first-of-type',
  'iframe',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]',
].join(',');

/**
 * Is this element really reachable by keyboard right now?
 *
 * The naive `querySelectorAll('a,button,input,…')` catches plenty of things a
 * user can never land on: a hidden file input, a control with tabindex="-1", a
 * button inside a collapsed section, anything under `inert` or
 * `aria-hidden="true"`. Focusing one of those on open leaves the dialog looking
 * like nothing happened, and trapping Tab against one sends focus nowhere.
 */
export function isFocusable(el: HTMLElement): boolean {
  if (el.hasAttribute('disabled')) return false;
  if (el.getAttribute('aria-disabled') === 'true') return false;
  if ((el as HTMLInputElement).type === 'hidden') return false;
  if (el.hasAttribute('hidden')) return false;

  const tabIndex = el.getAttribute('tabindex');
  if (tabIndex !== null && Number(tabIndex) < 0) return false;

  // `inert` and `aria-hidden` remove a whole subtree from the tab order.
  if (el.closest('[inert]')) return false;
  if (el.closest('[aria-hidden="true"]')) return false;

  // getClientRects is empty for display:none and for a zero-size box, and
  // unlike offsetParent it still reports position:fixed elements.
  if (el.getClientRects().length === 0) return false;
  if (getComputedStyle(el).visibility === 'hidden') return false;

  return true;
}

/** Every keyboard-reachable element inside `root`, in document order. */
export function getFocusable(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(isFocusable);
}

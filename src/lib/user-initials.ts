export function getUserInitials(
  name: string | null | undefined,
  maxChars = 2,
): string {
  const trimmedName = name?.trim();
  if (!trimmedName) {
    return 'U';
  }

  const initials = trimmedName
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, maxChars)
    .toUpperCase();

  return initials || 'U';
}

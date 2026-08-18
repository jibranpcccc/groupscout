/**
 * Date helpers. Data stores machine-readable ISO-8601 strings;
 * the UI renders human-friendly absolute dates.
 *
 * Never use relative labels like "checked today" on static pages — they can
 * remain cached for days and become misleading.
 */

export function isValidIsoDate(value: string | null | undefined): boolean {
  if (!value) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

const displayDateFormatter = new Intl.DateTimeFormat('en', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

const displayDateTimeFormatter = new Intl.DateTimeFormat('en', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export function formatDate(iso: string | null | undefined): string | null {
  if (!isValidIsoDate(iso)) return null;
  return displayDateFormatter.format(new Date(iso as string));
}

export function formatDateTime(iso: string | null | undefined): string | null {
  if (!isValidIsoDate(iso)) return null;
  return displayDateTimeFormatter.format(new Date(iso as string));
}

/** ISO string for "now" — used by scripts when stamping checks. */
export function nowIso(): string {
  return new Date().toISOString();
}

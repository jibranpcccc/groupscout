/**
 * Friendly display labels for common ISO-639 language codes.
 * Unknown codes fall back to the raw code (never invented).
 */
const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
  ar: 'Arabic',
  hi: 'Hindi',
  ur: 'Urdu',
  bn: 'Bengali',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  tr: 'Turkish',
  nl: 'Dutch',
  pl: 'Polish',
  uk: 'Ukrainian',
  vi: 'Vietnamese',
  th: 'Thai',
  id: 'Indonesian',
  ms: 'Malay',
  fa: 'Persian',
  he: 'Hebrew',
  sw: 'Swahili',
};

export function languageLabel(code: string | null | undefined): string | null {
  if (!code) return null;
  const key = code.trim().toLowerCase().slice(0, 2);
  return LANGUAGE_LABELS[key] ?? code;
}

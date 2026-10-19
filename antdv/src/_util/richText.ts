export function isEmptyRichText(value: string | undefined | null): boolean {
  if (value == null) {
    return true
  }
  const trimmed = value.trim()
  if (trimmed === '' || trimmed === '{}' || trimmed === 'null') {
    return true
  }
  const text = trimmed
    .replace(/<br\s*\/?>/gi, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .trim()
  return text === ''
}

export function normalizeRichTextValue(
  value: string | undefined,
  outputFormat?: 'html' | 'json',
): string {
  const next = value ?? ''
  if (outputFormat === 'json') {
    return next
  }
  return isEmptyRichText(next) ? '' : next
}

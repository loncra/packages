const MEDIA_PATTERN = /<(img|video|audio|source|iframe|embed|object|svg|canvas|table)\b/i

export function isEmptyRichText(value: string | undefined | null): boolean {
  if (value == null) {
    return true
  }
  const trimmed = value.trim()
  if (trimmed === '' || trimmed === '{}' || trimmed === 'null') {
    return true
  }
  if (MEDIA_PATTERN.test(trimmed) || trimmed.includes('data-image-upload')) {
    return false
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

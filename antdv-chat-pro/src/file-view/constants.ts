export const IMAGE_EXT = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'])
export const VIDEO_EXT = new Set(['mp4', 'webm', 'ogg', 'mov', 'm4v'])
export const AUDIO_EXT = new Set(['mp3', 'wav', 'flac', 'm4a', 'aac'])

export const TEXT_APPLICATION_SUBTYPE = new Set([
  'json',
  'xml',
  'javascript',
  'ecmascript',
  'x-yaml',
  'yaml',
  'x-sh',
  'x-shellscript',
  'sql',
  'x-httpd-php',
  'xslt',
])

export const TEXT_MAX_BYTES = 5 * 1024 * 1024

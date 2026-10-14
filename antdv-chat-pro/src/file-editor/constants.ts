export const IMAGE_EXT = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'])
export const VIDEO_EXT = new Set(['mp4', 'webm', 'ogg', 'mov', 'm4v'])
export const AUDIO_EXT = new Set(['mp3', 'wav', 'flac', 'm4a', 'aac'])

export const TEXT_MAX_BYTES = 5 * 1024 * 1024
export const FILE_OR_FOLDER_NAME_MAX_LENGTH = 255
export const RESERVED_FILE_OR_FOLDER_NAME = new Set(['.', '..'])
export const ILLEGAL_FILE_OR_FOLDER_NAME = /[\u0000-\u001f\u007f/\\<>"|?*]/

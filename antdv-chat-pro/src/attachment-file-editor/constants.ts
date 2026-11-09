export const FILE_OR_FOLDER_NAME_MAX_LENGTH = 255
export const RESERVED_FILE_OR_FOLDER_NAME = new Set(['.', '..'])
export const ILLEGAL_FILE_OR_FOLDER_NAME = /[\u0000-\u001f\u007f/\\<>"|?*]/

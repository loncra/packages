import {FILE_OR_FOLDER_NAME_MAX_LENGTH, ILLEGAL_FILE_OR_FOLDER_NAME, RESERVED_FILE_OR_FOLDER_NAME,} from '../constants'
import type {FileEditorLocale} from '../../locale'

export function validateFileOrFolderName(
  name: string | undefined,
  locale: FileEditorLocale,
): string | undefined {
  const value = name?.trim() ?? ''
  if (!value) {
    return locale.nameEmpty
  }
  if (RESERVED_FILE_OR_FOLDER_NAME.has(value)) {
    return locale.nameReserved
  }
  if (value.length > FILE_OR_FOLDER_NAME_MAX_LENGTH) {
    return locale.nameTooLong
  }
  if (ILLEGAL_FILE_OR_FOLDER_NAME.test(value)) {
    return locale.nameIllegal
  }
  return undefined
}

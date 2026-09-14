export interface UserSelectLocale {
  all: string
}

export interface AttachmentUploadLocale {
  draggerTitle: string
  draggerSubTitle: string
  deleteConfirmTitle: string
  deleteConfirmSingle: string
}

export interface FileEditorLocale {
  untitled: string
  refresh: string
  uploadFile: string
  uploadDirectory: string
  rename: string
  delete: string
  deleteConfirmTitle: string
  deleteConfirmSingle: string
  save: string
  locate: string
  download: string
  unsavedConfirm: string
  unsupported: string
  tooLarge: string
  nameEmpty: string
  nameReserved: string
  nameIllegal: string
  nameTooLong: string
}

export interface Locale {
  locale: string
  UserSelect?: UserSelectLocale
  AttachmentUpload?: AttachmentUploadLocale
  FileEditor?: FileEditorLocale
}

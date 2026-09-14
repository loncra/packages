export { default as zhCN } from './locale/zh_CN'
export { default as enUS } from './locale/en_US'
export type { Locale } from './locale'
export { useLocale } from './_util/useLocale'
export type { LocaleComponentName } from './_util/useLocale'

export { default as UserAvatar } from './user-avatar'
export type { UserAvatarProps, UserAvatarSlots } from './user-avatar'

export { default as UserSelect } from './user-select'
export type { UserSelectEmits, UserSelectProps, UserSelectSlots } from './user-select'

export { default as AttachmentMasonry } from './attachment-masonry'
export type {
  AttachmentMasonryEmits,
  AttachmentMasonryProps,
  AttachmentMasonrySlots,
} from './attachment-masonry'

export { default as AttachmentUpload } from './attachment-upload'
export type {
  AttachmentUploadEmits,
  AttachmentUploadExpose,
  AttachmentUploadProps,
  AttachmentUploadSlots,
  AttachmentFileItem,
  AttachmentValue,
  AttachmentUploadExecutorOptions,
} from './attachment-upload'
export { ATTACHMENT_UPLOAD_MODE, ATTACHMENT_PREVIEW_MODE } from './attachment-upload'
export { default as FileEditor } from './file-editor'
export type { FileEditorProps, FileEditorSlots } from './file-editor'

export {default as CrudConfigProvider, useActionAuth, useCrudConfig} from './crud-config-provider'
export type {
  ActionAuth,
  CrudConfig,
  CrudConfigProviderProps,
  CrudConfigProviderSlots,
} from './crud-config-provider'

export { uploadFile } from './_util/uploadFile'
export {
  applyAttachmentDirectoryProgress,
  buildAttachmentPathTree,
  collectAttachmentFileLeaves,
  convertUploadFiles,
  denormalizeAttachmentFromList,
  detectAttachmentValueMode,
  isObjectWriteResult,
  isUploadFile,
  normalizeAttachmentToList,
} from './_util/attachmentList'

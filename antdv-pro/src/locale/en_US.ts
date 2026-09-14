import type {Locale} from './index'

const locale: Locale = {
  locale: 'en-US',
  UserSelect: {
    all: 'All {name}',
  },
  AttachmentUpload: {
    draggerTitle: 'Click or drag files to this area to upload',
    draggerSubTitle: 'Up to {maxCount} files, {count} uploaded',
    deleteConfirmTitle: 'Delete confirmation',
    deleteConfirmSingle: 'Delete this item?',
  },
  FileEditor: {
    untitled: 'Untitled',
    refresh: 'Refresh',
    uploadFile: 'Upload file',
    uploadDirectory: 'Upload directory',
    rename: 'Rename',
    delete: 'Delete',
    deleteConfirmTitle: 'Delete confirmation',
    deleteConfirmSingle: 'Delete this item?',
    save: 'Save',
    locate: 'Select opened file',
    download: 'Download',
    unsavedConfirm:
      'You have unsaved changes. Close this file anyway? Unsaved edits will be lost.',
    unsupported: 'This file cannot be opened in the editor.',
    tooLarge: 'File is too large. Download it instead.',
    nameEmpty: 'Name cannot be empty',
    nameReserved: 'Name cannot be . or ..',
    nameIllegal: 'Name cannot contain / \\ < > " | ? * or control characters',
    nameTooLong: 'Name cannot exceed 255 characters',
  },
}

export default locale

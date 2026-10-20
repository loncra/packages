import Editor from './Editor'

export default Editor
export type {
  EditorEmits,
  EditorLocale,
  EditorProps,
  EditorSlots,
  OutputFormat,
  PluginName,
  UploadFn,
} from './types'
export {isEmptyRichText, normalizeRichTextValue} from '../_util/richText'

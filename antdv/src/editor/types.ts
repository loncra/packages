import type {OutputFormat, PluginName} from 'antdv-next-tiptap'

export type {OutputFormat, PluginName} from 'antdv-next-tiptap'

export type EditorLocale = 'zh-CN' | 'en-US' | Record<string, string>

export type UploadFn = (file: File, onProgress: (percent: number) => void) => Promise<string>

export interface EditorProps {
  value?: string
  height?: number
  disabled?: boolean
  editable?: boolean
  outputFormat?: OutputFormat
  locale?: EditorLocale
  disabledPlugins?: PluginName[]
  uploadImage?: UploadFn
  uploadVideo?: UploadFn
  wordCount?: true | number
  prefixCls?: string
  class?: unknown
  rootClass?: string
  style?: unknown
}

export interface EditorEmits {
  'update:value': (value: string) => void
  change: (value: string) => void
  blur: (value: string) => void
}

export interface EditorSlots {
  'word-count'?: (ctx: { count: number; limit: true | number }) => unknown
}

import type {OutputFormat} from 'antdv-next-tiptap'
import {normalizeRichTextValue} from '../_util/isEmptyRichText'

interface EditorSource {
  outputFormat?: OutputFormat
}

interface EditorHandlers {
  onUpdateValue: (value: string) => void
  onChange: (value: string) => void
}

export function useEditor(props: EditorSource, handlers: EditorHandlers) {
  function commit(value: string) {
    const next = normalizeRichTextValue(value, props.outputFormat)
    handlers.onUpdateValue(next)
    handlers.onChange(next)
    return next
  }

  return {commit}
}

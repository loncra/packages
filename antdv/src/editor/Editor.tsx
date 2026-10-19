import {computed, defineAsyncComponent, defineComponent} from 'vue'
import type {OutputFormat, PluginName} from 'antdv-next-tiptap'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {useFormItemInputContext} from 'antdv-next/dist/form/context'
import {classNames} from '../_util/classNames'
import {useFormItemTrigger} from '../_util/useFormItemTrigger'
import {isEditorEditable, resolveEditorLocale} from './editorKinds'
import {useEditor} from './useEditor'
import type {EditorLocale, UploadFn} from './types'
import useStyle from './style'

const AEditor = defineAsyncComponent(async () => {
  await import('antdv-next-tiptap/index.css')
  const {AEditor: Comp} = await import('antdv-next-tiptap')
  return Comp
})

export type { OutputFormat, PluginName }
export type { EditorLocale, UploadFn } from './types'

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

const Editor = defineComponent({
  name: 'LEditor',
  inheritAttrs: false,
  props: {
    value: {
      type: String,
      default: '',
    },
    height: {
      type: Number,
      default: undefined,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    editable: {
      type: Boolean,
      default: true,
    },
    outputFormat: String as () => OutputFormat,
    locale: [String, Object] as unknown as () => EditorProps['locale'],
    disabledPlugins: Array as () => PluginName[],
    uploadImage: Function as unknown as () => UploadFn,
    uploadVideo: Function as unknown as () => UploadFn,
    wordCount: [Boolean, Number] as unknown as () => true | number,
    prefixCls: String,
    rootClass: String,
  },
  emits: {
    'update:value': (_value: string) => true,
    change: (_value: string) => true,
    blur: (_value: string) => true,
  },
  setup(props, { emit, slots, attrs }) {
    const config = useConfig()
    const itemStatus = useFormItemInputContext()
    useFormItemTrigger(() => props.value)
    const prefixCls = computed(() =>
      config.value.getPrefixCls('editor', props.prefixCls ?? 'loncra-editor'),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)
    const editorLocale = computed(() => resolveEditorLocale(config.value.locale, props.locale))
    const editable = computed(() => isEditorEditable(props.disabled, props.editable))
    const { commit } = useEditor(props, {
      onUpdateValue: (value: string) => emit('update:value', value),
      onChange: (value: string) => emit('change', value),
    })

    return () => {
      const { class: attrClass, style: attrStyle, ...rest } = attrs
      const status = itemStatus.value.status
      return (
        <div
          class={classNames(
            prefixCls.value,
            hashId.value,
            cssVarCls.value,
            status === 'error' ? `${prefixCls.value}-status-error` : undefined,
            props.rootClass,
            attrClass,
          )}
          style={attrStyle as string | Record<string, string> | undefined}
        >
          <AEditor
            {...rest}
            modelValue={props.value}
            height={props.height}
            editable={editable.value}
            outputFormat={props.outputFormat}
            locale={editorLocale.value as never}
            disabledPlugins={props.disabledPlugins}
            uploadImage={props.uploadImage}
            uploadVideo={props.uploadVideo}
            wordCount={props.wordCount}
            onUpdate:modelValue={(value?: string) => {
              commit(value ?? '')
            }}
            onBlur={(value?: string) => {
              emit('blur', commit(value ?? ''))
            }}
            v-slots={{
              'word-count': slots['word-count'],
            }}
          />
        </div>
      )
    }
  },
})

export default Editor

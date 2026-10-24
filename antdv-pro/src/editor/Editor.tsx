import {computed, defineAsyncComponent, defineComponent, type PropType} from 'vue'
import type {OutputFormat, PluginName} from 'antdv-next-tiptap'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {useFormItemInputContext} from 'antdv-next/dist/form/context'
import {classNames, useFormItemTrigger} from '@loncra/antdv'
import {isEditorEditable, resolveEditorLocale} from './editorKinds'
import {useEditor} from './useEditor'
import type {EditorClasses, EditorProps, EditorStyles, UploadFn} from './types'
import useStyle from './style'

const AEditor = defineAsyncComponent(async () => {
  await import('antdv-next-tiptap/index.css')
  const {AEditor: Comp} = await import('antdv-next-tiptap')
  return Comp
})

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
    outputFormat: String as PropType<OutputFormat>,
    locale: [String, Object] as PropType<EditorProps['locale']>,
    disabledPlugins: Array as PropType<PluginName[]>,
    uploadImage: Function as PropType<UploadFn>,
    uploadVideo: Function as PropType<UploadFn>,
    wordCount: [Boolean, Number] as PropType<true | number>,
    prefixCls: String,
    rootClass: String,
    classes: Object as PropType<EditorClasses>,
    styles: Object as PropType<EditorStyles>,
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
      const rootStyle = props.styles?.root ? [props.styles.root, attrStyle] : attrStyle
      return (
        <div
          class={classNames(
            prefixCls.value,
            hashId.value,
            cssVarCls.value,
            status === 'error' ? `${prefixCls.value}-status-error` : undefined,
            props.classes?.root,
            props.rootClass,
            attrClass,
          )}
          style={rootStyle as never}
        >
          <AEditor
            {...rest}
            modelValue={props.value}
            height={props.height}
            editable={editable.value}
            outputFormat={props.outputFormat}
            locale={editorLocale.value as never}
            disabledPlugins={props.disabledPlugins}
            class={props.classes?.editor}
            style={props.styles?.editor as never}
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

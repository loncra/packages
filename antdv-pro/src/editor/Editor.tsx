import {computed, defineAsyncComponent, defineComponent, type PropType} from 'vue'
import type {OutputFormat, PluginName} from 'antdv-next-tiptap'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {useFormItemInputContext} from 'antdv-next/dist/form/context'
import {classNames, useFormItemTrigger} from '@loncra/antdv'
import {isEditorEditable, resolveEditorLocale} from './editorKinds'
import {useEditorUpload} from './useEditorUpload'
import {normalizeRichTextValue} from '../_util/richText'
import type {EditorClasses, EditorExpose, EditorProps, EditorStyles, UploadFn} from './types'
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
    bucket: {
      type: String,
      default: 'user.file',
    },
    uploadParam: Object as PropType<Record<string, unknown>>,
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
  setup(props, { emit, slots, attrs, expose }) {
    const config = useConfig()
    const itemStatus = useFormItemInputContext()
    useFormItemTrigger(() => props.value)
    const prefixCls = computed(() =>
      config.value.getPrefixCls('editor', props.prefixCls ?? 'loncra-editor'),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)
    const editorLocale = computed(() => resolveEditorLocale(config.value.locale, props.locale))
    const editable = computed(() => isEditorEditable(props.disabled, props.editable))
    const {builtinUploadFn, uploadPending} = useEditorUpload({
      bucket: () => props.bucket ?? 'user.file',
      param: () => props.uploadParam,
    })
    const uploadImage = computed(() => props.uploadImage ?? builtinUploadFn)
    const uploadVideo = computed(() => props.uploadVideo ?? builtinUploadFn)

    const commit = (value: string) => {
      emit('update:value', value)
      emit('change', value)
      return value
    }

    expose({
      confirmUploads: async () => {
        const uploaded = await uploadPending(props.value, props.outputFormat)
        commit(normalizeRichTextValue(uploaded, props.outputFormat))
      },
    } satisfies EditorExpose)

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
            uploadImage={uploadImage.value}
            uploadVideo={uploadVideo.value}
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

import {computed, defineComponent, ref, type PropType} from 'vue'
import {Splitter, SplitterPanel, Upload} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '@loncra/antdv'
import FileConversation from './conversation/FileConversation'
import FileTabs from './tabs/FileTabs'
import type {FileEditorClasses, FileEditorProps, FileEditorStyles} from './types'
import {useFileEditor} from './useFileEditor'
import useStyle from './style'

const FileEditor = defineComponent({
  name: 'LFileEditor',
  inheritAttrs: false,
  props: {
    readonly: {
      type: Boolean,
      default: false,
    },
    name: String,
    path: {
      type: String,
      required: true,
    },
    bucket: {
      type: String,
      required: true,
    },
    getIcon: Function as PropType<FileEditorProps['getIcon']>,
    height: [String, Number],
    maxHeight: [String, Number],
    prefixCls: String,
    rootClass: String,
    classes: Object as PropType<FileEditorClasses>,
    styles: Object as PropType<FileEditorStyles>,
  },
  setup(props, {attrs}) {
    const config = useConfig()
    const prefixCls = computed(() =>
      config.value.getPrefixCls('file-editor', props.prefixCls ?? 'loncra-file-editor'),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)
    const conversationRef = ref<{revealItem: (key: string) => void}>()

    function locateSelectedItem() {
      const item = editor.state.value.selectedItem
      if (!item) {
        return
      }
      editor.onSelectOpenFile(item)
      void conversationRef.value?.revealItem(item.id)
    }
    const editor = useFileEditor(props)

    return () => {
      const {class: attrClass, style: attrStyle, ...rest} = attrs
      const hashed = (...names: (string | undefined)[]) =>
        classNames(hashId.value, cssVarCls.value, ...names)
      const {state, fileUploadTrigger, dirUploadTrigger, onUploadChange} = editor

      const sizeStyle: Record<string, string> = {}
      if (props.height != null && props.height !== '') {
        const height = typeof props.height === 'number' ? `${props.height}px` : props.height
        sizeStyle.height = height
        sizeStyle.minHeight = height
      }
      if (props.maxHeight != null && props.maxHeight !== '') {
        sizeStyle.maxHeight =
          typeof props.maxHeight === 'number' ? `${props.maxHeight}px` : props.maxHeight
      }

      return (
        <div
          {...rest}
          class={hashed(
            prefixCls.value,
            props.classes?.root,
            props.rootClass,
            attrClass as string,
          )}
          style={[sizeStyle, props.styles?.root, attrStyle] as never}
        >
          <Upload
            key={`file-${state.value.upload.session}`}
            showUploadList={false}
            beforeUpload={() => false}
            multiple
            class={hashed(`${prefixCls.value}-hidden-upload`)}
            onChange={onUploadChange}
          >
            <span ref={fileUploadTrigger} />
          </Upload>
          <Upload
            key={`dir-${state.value.upload.session}`}
            showUploadList={false}
            beforeUpload={() => false}
            multiple
            directory
            class={hashed(`${prefixCls.value}-hidden-upload`)}
            onChange={onUploadChange}
          >
            <span ref={dirUploadTrigger} />
          </Upload>
          <Splitter
            class={hashed(`${prefixCls.value}-splitter`, props.classes?.splitter)}
            style={props.styles?.splitter as never}
          >
            <SplitterPanel
              class={hashed(`${prefixCls.value}-panel`, props.classes?.panel)}
              style={props.styles?.panel as never}
              defaultSize="20%"
              min="10%"
              max="30%"
            >
              <FileConversation
                ref={conversationRef}
                editor={editor}
                name={props.name}
                readonly={props.readonly}
              />
            </SplitterPanel>
            <SplitterPanel
              class={hashed(`${prefixCls.value}-panel-main`, props.classes?.panelMain)}
              style={props.styles?.panelMain as never}
            >
              <FileTabs
                editor={editor}
                locateFile={locateSelectedItem}
                bucket={props.bucket}
                rootPath={props.path}
                readonly={props.readonly}
              />
            </SplitterPanel>
          </Splitter>
        </div>
      )
    }
  },
})

export default FileEditor
export type {FileEditorProps} from './types'

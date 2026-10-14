import {computed, defineComponent, type PropType} from 'vue'
import {Splitter, SplitterPanel, Upload} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '@loncra/antdv'
import FileConversation from './conversation/FileConversation'
import FileTabs from './tabs/FileTabs'
import type {FileEditorProps} from './types'
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
  },
  setup(props, {attrs}) {
    const config = useConfig()
    const prefixCls = computed(() =>
      config.value.getPrefixCls('file-editor', props.prefixCls ?? 'loncra-file-editor'),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)
    const editor = useFileEditor(props)

    return () => {
      const {class: attrClass, style: attrStyle} = attrs
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
        /*
         * ⚠️ 这是 pro 里**唯一保留的内联样式**，且是有意的例外（2026-09-23 全仓审计后确认）：
         * - `sizeStyle`：按 `height` / `maxHeight` **逐实例**算出来的尺寸，没法预先写进 `genStyleHooks`；
         * - `attrStyle`：宿主自己传进来的 `style`，本就该原样透传。
         * 想彻底去掉的话只能走 CSS 变量（仍要靠 `style` 设变量），收益为零 ⇒ 保持现状。
         */
        <div
          class={hashed(prefixCls.value, props.rootClass, attrClass as string)}
          style={[sizeStyle, attrStyle] as never}
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
          <Splitter class={hashed(`${prefixCls.value}-splitter`)}>
            <SplitterPanel class={hashed(`${prefixCls.value}-panel`)} defaultSize="20%" min="10%" max="30%">
              <FileConversation
                editor={editor}
                name={props.name}
                readonly={props.readonly}
              />
            </SplitterPanel>
            <SplitterPanel class={hashed(`${prefixCls.value}-panel-main`)}>
              <FileTabs
                editor={editor}
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
export type {FileEditorProps, FileEditorSlots} from './types'

import {computed, defineComponent, reactive, ref, type PropType} from 'vue'
import {Upload} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import useApp from 'antdv-next/dist/app/useApp'
import {classNames} from '@loncra/antdv'
import {AttachmentService} from '@loncra/client/resource'
import FileView, {type FileViewExpose} from '../file-view'
import {useLocale} from '../_util/useLocale'
import {createMenuItems, createToolbarActions, createWriteSlots} from './attachmentSlots'
import type {AttachmentFileEditorProps, TextEditorEntry} from './types'
import {createAttachmentSource, readExtra} from './useAttachmentSource'
import {useAttachmentWrite} from './useAttachmentWrite'
import useStyle from './style'

const AttachmentFileEditor = defineComponent({
  name: 'LAttachmentFileEditor',
  inheritAttrs: false,
  props: {
    bucket: {type: String, required: true},
    path: {type: String, required: true},
    readonly: {type: Boolean, default: false},
    name: String,
    height: [String, Number],
    maxHeight: [String, Number],
    getIcon: Function as PropType<AttachmentFileEditorProps['getIcon']>,
    prefixCls: String,
    rootClass: String,
    classes: Object as PropType<AttachmentFileEditorProps['classes']>,
    styles: Object as PropType<AttachmentFileEditorProps['styles']>,
  },
  setup(props, {attrs}) {
    const config = useConfig()
    const {message, modal} = useApp()
    const locale = useLocale('AttachmentFileEditor')
    const prefixCls = computed(() =>
      config.value.getPrefixCls('attachment-file-editor', props.prefixCls ?? 'loncra-attachment-file-editor'),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)
    const viewRef = ref<FileViewExpose>()
    const entries = reactive<Record<string, TextEditorEntry>>({})
    const source = computed(() => createAttachmentSource(() => props.bucket, () => props.path))
    const write = useAttachmentWrite({
      bucket: () => props.bucket,
      path: () => props.path,
      locale: () => locale.value,
      message,
      confirm: (options) => modal.confirm(options),
      view: viewRef,
    })

    function register(id: string, entry: TextEditorEntry | undefined) {
      if (entry) {
        entries[id] = entry
      } else {
        delete entries[id]
      }
    }

    return () => {
      const {class: attrClass, style: attrStyle, ...rest} = attrs
      const hashed = classNames(hashId.value, cssVarCls.value, `${prefixCls.value}-hidden-upload`)
      const slots = props.readonly ? undefined : createWriteSlots({
        locale: locale.value,
        bucket: props.bucket,
        write,
        entries,
        register,
        readonly: props.readonly,
      })
      return (
        <div style={{display: 'contents'}}>
          {props.readonly ? null : (
            <>
              <Upload
                key={`file-${write.session.value}`}
                showUploadList={false}
                beforeUpload={() => false}
                multiple
                class={hashed}
                onChange={write.onUploadChange}
              >
                <span ref={write.fileUploadTrigger} />
              </Upload>
              <Upload
                key={`dir-${write.session.value}`}
                showUploadList={false}
                beforeUpload={() => false}
                multiple
                directory
                class={hashed}
                onChange={write.onUploadChange}
              >
                <span ref={write.dirUploadTrigger} />
              </Upload>
            </>
          )}
          <FileView
            {...rest}
            ref={viewRef}
            source={source.value}
            name={props.name}
            height={props.height}
            maxHeight={props.maxHeight}
            getIcon={props.getIcon}
            classes={props.classes}
            styles={props.styles}
            rootClass={props.rootClass}
            class={attrClass}
            style={attrStyle}
            confirmClose={(node) => confirmDirtyClose(entries[node.id], locale.value.unsavedConfirm, modal)}
            onDownload={(node) => AttachmentService.download(props.bucket, readExtra(node).objectName)}
            toolbarActions={props.readonly ? undefined : createToolbarActions(locale.value, write)}
            menuItems={props.readonly ? undefined : createMenuItems(locale.value, write)}
            v-slots={slots}
          />
        </div>
      )
    }
  },
})

function confirmDirtyClose(
  entry: TextEditorEntry | undefined,
  content: string,
  modal: {confirm: (options: {content: string; onOk: () => void; onCancel: () => void}) => void},
): Promise<boolean> {
  if (!entry?.dirty) {
    return Promise.resolve(true)
  }
  return new Promise((resolve) => {
    modal.confirm({
      content,
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    })
  })
}

export default AttachmentFileEditor

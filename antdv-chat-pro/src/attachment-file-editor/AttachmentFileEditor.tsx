import {computed, defineComponent, h, ref, type PropType} from 'vue'
import {Upload, type MenuItemType} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import useApp from 'antdv-next/dist/app/useApp'
import {DeleteOutlined, FileAddOutlined, FolderAddOutlined, FormOutlined} from '@antdv-next/icons'
import {classNames} from '@loncra/antdv'
import type {ResolvedAction} from '@loncra/antdv-pro'
import FileView, {type FileViewClasses, type FileViewExpose, type FileViewNode, type FileViewSlots, type FileViewStyles} from '../file-view'
import {readSize} from '../_util/readSize'
import {useLocale} from '../_util/useLocale'
import type {AttachmentFileEditorLocale} from '../locale'
import AttachmentRenameTitle from './AttachmentRenameTitle'
import AttachmentSaveButton from './AttachmentSaveButton'
import AttachmentTextPane from './AttachmentTextPane'
import type {AttachmentFileEditorProps, FileEditorNode} from './types'
import {createAttachmentSource} from './useAttachmentSource'
import {useAttachmentWrite} from './useAttachmentWrite'
import {canEditText} from './useAttachmentText'
import useStyle from './style'

type WriteApi = ReturnType<typeof useAttachmentWrite>

function filled(value?: string | number) {
  return value != null && value !== '' ? '100%' : undefined
}

function viewClasses(classes: FileViewClasses | undefined): FileViewClasses | undefined {
  if (!classes) {
    return undefined
  }
  return {splitter: classes.splitter, panel: classes.panel, panelMain: classes.panelMain}
}

function viewStyles(styles: FileViewStyles | undefined): FileViewStyles | undefined {
  if (!styles) {
    return undefined
  }
  return {splitter: styles.splitter, panel: styles.panel, panelMain: styles.panelMain}
}

function toolbarActions(locale: AttachmentFileEditorLocale, write: WriteApi, readonly: boolean): ResolvedAction[] | undefined {
  if (readonly) {
    return undefined
  }
  return [
    {id: 'uploadFile', label: locale.uploadFile, icon: h(FileAddOutlined), disabled: false, run: () => write.openUpload(false)},
    {id: 'uploadDirectory', label: locale.uploadDirectory, icon: h(FolderAddOutlined), disabled: false, run: () => write.openUpload(true)},
  ]
}

function menuItems(locale: AttachmentFileEditorLocale, write: WriteApi, readonly: boolean) {
  if (readonly) {
    return undefined
  }
  return (node: FileViewNode): MenuItemType[] => {
    const current = node as FileEditorNode
    const items: MenuItemType[] = []
    if (current.dir) {
      items.push(
        {key: 'uploadFile', label: locale.uploadFile, icon: () => h(FileAddOutlined), onClick: () => write.openUpload(false, current)},
        {key: 'uploadDirectory', label: locale.uploadDirectory, icon: () => h(FolderAddOutlined), onClick: () => write.openUpload(true, current)},
      )
    }
    items.push(
      {key: 'rename', label: locale.rename, icon: () => h(FormOutlined), onClick: () => write.beginRename(current)},
      {type: 'divider', key: `${current.id}-divider`} as MenuItemType,
      {key: 'delete', label: locale.delete, danger: true, icon: () => h(DeleteOutlined), onClick: () => write.removeNode(current)},
    )
    return items
  }
}

function writeSlots(options: {
  locale: AttachmentFileEditorLocale
  write: WriteApi
  bucket: string
  prefixCls: string
  readonly: boolean
}): FileViewSlots {
  if (options.readonly) {
    return {}
  }
  const {locale, write, bucket, prefixCls} = options
  return {
    title: ({node}) => {
      const current = node as FileEditorNode
      if (!current.editing) {
        return null
      }
      return (
        <AttachmentRenameTitle
          node={current}
          onCommit={write.commitRename}
          onCancel={write.cancelRename}
        />
      )
    },
    tabExtra: ({node}) => {
      const entry = write.entries[node.id]
      if (!entry?.dirty) {
        return null
      }
      return <AttachmentSaveButton entry={entry} label={locale.save} />
    },
    pane: ({node}) => {
      if (!canEditText(node, false)) {
        return null
      }
      return (
        <AttachmentTextPane
          node={node as FileEditorNode}
          bucket={bucket}
          prefixCls={prefixCls}
          register={write.register}
        />
      )
    },
  }
}

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
    const source = computed(() => createAttachmentSource(() => props.bucket, () => props.path))
    const write = useAttachmentWrite({
      bucket: () => props.bucket,
      path: () => props.path,
      locale: () => locale.value,
      message,
      confirm: (options) => modal.confirm(options),
      decide: (content) => new Promise((resolve) => {
        modal.confirm({
          content,
          onOk: () => resolve(true),
          onCancel: () => resolve(false),
        })
      }),
      view: viewRef,
    })

    return () => {
      const {class: attrClass, style: attrStyle, ...rest} = attrs
      const hidden = classNames(hashId.value, cssVarCls.value, `${prefixCls.value}-hidden-upload`)
      return (
        <div
          {...rest}
          class={classNames(
            prefixCls.value,
            hashId.value,
            cssVarCls.value,
            props.classes?.root,
            props.rootClass,
            attrClass as string,
          )}
          style={[readSize(props.height, props.maxHeight), props.styles?.root, attrStyle] as never}
        >
          {props.readonly ? null : (
            <>
              <Upload
                key={`file-${write.session.value}`}
                showUploadList={false}
                beforeUpload={() => false}
                multiple
                class={hidden}
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
                class={hidden}
                onChange={write.onUploadChange}
              >
                <span ref={write.dirUploadTrigger} />
              </Upload>
            </>
          )}
          <FileView
            ref={viewRef}
            class={`${prefixCls.value}-view`}
            source={source.value}
            name={props.name}
            height={filled(props.height)}
            maxHeight={filled(props.maxHeight)}
            getIcon={props.getIcon}
            classes={viewClasses(props.classes)}
            styles={viewStyles(props.styles)}
            confirmClose={write.confirmClose}
            dirty={write.dirty}
            onDownload={write.download}
            toolbarActions={toolbarActions(locale.value, write, props.readonly)}
            menuItems={menuItems(locale.value, write, props.readonly)}
            v-slots={writeSlots({
              locale: locale.value,
              write,
              bucket: props.bucket,
              prefixCls: prefixCls.value,
              readonly: props.readonly,
            })}
          />
        </div>
      )
    }
  },
})

export default AttachmentFileEditor

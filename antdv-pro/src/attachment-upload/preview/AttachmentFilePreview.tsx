import {defineComponent, h, type PropType} from 'vue'
import {
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  FileImageOutlined,
  FileUnknownOutlined,
  FolderOutlined,
  LoadingOutlined,
  PlayCircleOutlined,
} from '@antdv-next/icons'
import {BasicImage, classNames} from '@loncra/antdv'
import type {RestResult} from '@loncra/client/commons'
import type {ObjectWriteResult} from '@loncra/client/resource'
import {AttachmentService} from '@loncra/client/resource'
import useApp from 'antdv-next/dist/app/useApp'
import type {UploadFile} from 'antdv-next/dist/upload/interface'
import {useLocale} from '../../_util/useLocale'
import type {AttachmentPreviewFileProps} from '../types'

function defaultCanPreview(file: UploadFile<ObjectWriteResult>) {
  return file.type?.includes('image/') || file.type?.includes('video/')
}

function defaultCanDownload(file: UploadFile<ObjectWriteResult>) {
  return file.response !== undefined
}

const AttachmentFilePreview = defineComponent({
  name: 'LAttachmentFilePreview',
  inheritAttrs: false,
  props: {
    file: {
      type: Object as PropType<UploadFile<ObjectWriteResult>>,
      required: true,
    },
    border: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    itemClass: String,
    itemStyle: Object as PropType<AttachmentPreviewFileProps['itemStyle']>,
    canPreview: {
      type: Function as PropType<AttachmentPreviewFileProps['canPreview']>,
      default: defaultCanPreview,
    },
    canDelete: {
      type: Function as PropType<AttachmentPreviewFileProps['canDelete']>,
      default: () => true,
    },
    canDownload: {
      type: Function as PropType<AttachmentPreviewFileProps['canDownload']>,
      default: defaultCanDownload,
    },
    prefixCls: {
      type: String,
      required: true,
    },
    hashId: String,
    cssVarCls: String,
  },
  emits: {
    download: (_file: ObjectWriteResult) => true,
    delete: (_file: UploadFile<ObjectWriteResult>) => true,
    preview: (_file: UploadFile<ObjectWriteResult>) => true,
  },
  setup(props, {emit, slots, expose}) {
    const locale = useLocale('AttachmentUpload')
    const {message, modal} = useApp()

    function getFileIcon() {
      if (props.file?.type?.includes('image/')) {
        return FileImageOutlined
      }
      if (props.file?.type?.includes('video/')) {
        return PlayCircleOutlined
      }
      if (props.file?.type === 'directory') {
        return FolderOutlined
      }
      return FileUnknownOutlined
    }

    function thumbBorderClass() {
      if (!props.border) {
        return undefined
      }
      const status = props.file.status
      if (status === undefined) {
        return `${props.prefixCls}-thumb-border-warning`
      }
      if (status === 'uploading') {
        return `${props.prefixCls}-thumb-border-info`
      }
      if (status === 'done') {
        return `${props.prefixCls}-thumb-border-success`
      }
      if (status === 'error') {
        return `${props.prefixCls}-thumb-border-error`
      }
      return undefined
    }

    function onClickPreview() {
      emit('preview', props.file)
    }

    async function doRemove(file: UploadFile<ObjectWriteResult>) {
      if (!file.response) {
        return
      }
      try {
        const result: RestResult<void> = await AttachmentService.removeAttachment([file.response])
        emit('delete', file)
        message.success(result.message)
      } catch (e) {
        message.error(e instanceof Error ? e.message : String(e))
      }
    }

    function remove(file: UploadFile<ObjectWriteResult>) {
      modal.confirm({
        title: locale.value.deleteConfirmTitle,
        content: locale.value.deleteConfirmSingle,
        onOk: () => doRemove(file),
      })
    }

    function onRemove() {
      if (props.file.response) {
        remove(props.file)
      } else {
        emit('delete', props.file)
      }
    }

    function download(file: ObjectWriteResult) {
      AttachmentService.download(file.bucketName, file.objectName)
    }

    function onDownload(file: ObjectWriteResult) {
      download(file)
      emit('download', file)
    }

    expose({download, remove})

    return () => {
      const file = props.file
      const uploading = file.status === 'uploading'
      return (
        <span
          class={classNames(
            props.hashId,
            props.cssVarCls,
            `${props.prefixCls}-thumb`,
            thumbBorderClass(),
            props.itemClass,
          )}
          style={props.itemStyle}
        >
          {slots.itemRender ? (
            slots.itemRender({file})
          ) : file.thumbUrl ? (
            <BasicImage
              preview={false}
              class={classNames(props.hashId, `${props.prefixCls}-thumb-cover`)}
              {...({src: file.thumbUrl} as Record<string, unknown>)}
            />
          ) : (
            <span class={classNames(props.hashId, `${props.prefixCls}-thumb-fallback`)}>
              {slots.itemIcon?.({file}) ??
                h(getFileIcon(), {
                  class: classNames(props.hashId, `${props.prefixCls}-file-icon`),
                })}
            </span>
          )}
          {!props.disabled ? (
            <span
              class={classNames(
                props.hashId,
                `${props.prefixCls}-overlay`,
                uploading ? `${props.prefixCls}-overlay-uploading` : undefined,
              )}
            >
              {!uploading && props.canPreview?.(file) ? (
                <span
                  role="button"
                  tabindex={-1}
                  class={classNames(props.hashId, `${props.prefixCls}-overlay-action`)}
                  onClick={(e) => {
                    e.stopPropagation()
                    onClickPreview()
                  }}
                >
                  {h(EyeOutlined)}
                </span>
              ) : null}
              {props.canDelete?.(file) && !uploading ? (
                <span
                  role="button"
                  tabindex={-1}
                  class={classNames(props.hashId, `${props.prefixCls}-overlay-action`)}
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove()
                  }}
                >
                  {h(DeleteOutlined)}
                </span>
              ) : null}
              {file.response && props.canDownload?.(file) && !uploading ? (
                <span
                  role="button"
                  tabindex={-1}
                  class={classNames(props.hashId, `${props.prefixCls}-overlay-action`)}
                  onClick={(e) => {
                    e.stopPropagation()
                    onDownload(file.response as ObjectWriteResult)
                  }}
                >
                  {h(DownloadOutlined)}
                </span>
              ) : !file.response && uploading ? (
                <span class={classNames(props.hashId, `${props.prefixCls}-overlay-progress`)}>
                  {h(LoadingOutlined, {
                    class: classNames(props.hashId, `${props.prefixCls}-overlay-spin`),
                  })}
                  <span>{`${file.percent}%`}</span>
                </span>
              ) : null}
            </span>
          ) : null}
        </span>
      )
    }
  },
})

export default AttachmentFilePreview

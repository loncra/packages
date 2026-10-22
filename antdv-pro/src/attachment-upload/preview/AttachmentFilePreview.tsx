import {defineComponent, h, type PropType} from 'vue'
import {FileImageOutlined, FileUnknownOutlined, FolderOutlined, PlayCircleOutlined,} from '@antdv-next/icons'
import {BasicImage, classNames} from '@loncra/antdv'
import type {ObjectWriteResult} from '@loncra/client/resource'
import type {UploadFile} from 'antdv-next/dist/upload/interface'
import {attachmentStatusClass, isVideoFile} from '../attachmentKinds'
import {useAttachmentFileActions} from './useAttachmentFileActions'
import AttachmentThumbOverlay from './AttachmentThumbOverlay'
import type {AttachmentPreviewFileProps} from '../types'

function defaultCanPreview(file: UploadFile<ObjectWriteResult>) {
  return file.type?.includes('image/') || isVideoFile(file)
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
    hashId: {
      type: String,
      required: true,
    },
    cssVarCls: String,
  },
  emits: {
    download: (_file: ObjectWriteResult) => true,
    delete: (_file: UploadFile<ObjectWriteResult>) => true,
    preview: (_file: UploadFile<ObjectWriteResult>) => true,
  },
  setup(props, {emit, slots}) {
    const {download, remove} = useAttachmentFileActions({
      postRemove: (file) => emit('delete', file),
    })

    function getFileIcon() {
      if (props.file?.type?.includes('image/')) {
        return FileImageOutlined
      }
      if (isVideoFile(props.file)) {
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
      return attachmentStatusClass(props.prefixCls, 'thumb-border', props.file.status)
    }

    function onClickPreview() {
      emit('preview', props.file)
    }

    function onRemove() {
      remove(props.file)
    }

    function onDownload(file: ObjectWriteResult) {
      download(file)
      emit('download', file)
    }

    return () => {
      const file = props.file
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
            <AttachmentThumbOverlay
              file={file}
              disabled={props.disabled}
              prefixCls={props.prefixCls}
              hashId={props.hashId}
              cssVarCls={props.cssVarCls}
              canPreview={props.canPreview}
              canDelete={props.canDelete}
              canDownload={props.canDownload}
              onPreview={onClickPreview}
              onRemove={onRemove}
              onDownload={onDownload}
            />
          ) : null}
        </span>
      )
    }
  },
})

export default AttachmentFilePreview

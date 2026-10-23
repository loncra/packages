import {defineComponent, type PropType, type VNodeChild} from 'vue'
import {classNames} from '@loncra/antdv'
import type {ObjectWriteResult} from '@loncra/client/resource'
import type {UploadFile} from 'antdv-next/dist/upload/interface'
import {attachmentStatusClass, detectAttachmentFileKind} from '../attachmentKinds'
import {useAttachmentFileActions} from './useAttachmentFileActions'
import AttachmentThumbOverlay from './AttachmentThumbOverlay'
import BUILTIN_THUMB_RENDERERS from '../internal/attachmentPreviewRenderers'
import type {AttachmentPreviewFileProps, AttachmentPreviewRenderers} from '../types'

function defaultCanPreview(file: UploadFile<ObjectWriteResult>) {
  const kind = detectAttachmentFileKind(file)
  return kind === 'image' || kind === 'video'
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
    previewRenderers: Object as PropType<AttachmentPreviewRenderers>,
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
      const kind = detectAttachmentFileKind(file)
      const renderer = props.previewRenderers?.[kind] ?? BUILTIN_THUMB_RENDERERS[kind]
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
          ) : (
            renderer({
              file,
              prefixCls: props.prefixCls,
              hashId: props.hashId,
              cssVarCls: props.cssVarCls,
              itemIcon: slots.itemIcon?.({file}) as VNodeChild | undefined,
            })
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

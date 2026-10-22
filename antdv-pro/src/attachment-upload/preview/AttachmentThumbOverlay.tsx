import {defineComponent, type PropType, type VNode} from 'vue'
import {DeleteOutlined, DownloadOutlined, EyeOutlined, LoadingOutlined,} from '@antdv-next/icons'
import {classNames} from '@loncra/antdv'
import type {ObjectWriteResult} from '@loncra/client/resource'
import type {UploadFile} from 'antdv-next/dist/upload/interface'

const AttachmentThumbOverlay = defineComponent({
  name: 'LAttachmentThumbOverlay',
  inheritAttrs: false,
  props: {
    file: {type: Object as PropType<UploadFile<ObjectWriteResult>>, required: true},
    disabled: Boolean,
    prefixCls: {type: String, required: true},
    hashId: {type: String, required: true},
    cssVarCls: String,
    canPreview: Function as PropType<(file: UploadFile<ObjectWriteResult>) => boolean | undefined>,
    canDelete: Function as PropType<(file: UploadFile<ObjectWriteResult>) => boolean | undefined>,
    canDownload: Function as PropType<(file: UploadFile<ObjectWriteResult>) => boolean | undefined>,
    onPreview: {
      type: Function as PropType<(file: UploadFile<ObjectWriteResult>) => void>,
      required: true,
    },
    onRemove: {type: Function as PropType<() => void>, required: true},
    onDownload: {
      type: Function as PropType<(file: ObjectWriteResult) => void>,
      required: true,
    },
  },
  setup(props) {
    const hashed = (name: string) => classNames(props.hashId, props.cssVarCls, name)

    function action(name: string, onClick: (e: MouseEvent) => void, icon: VNode) {
      return (
        <span
          role="button"
          tabindex={-1}
          class={hashed(`${props.prefixCls}-overlay-action`)}
          onClick={(e: MouseEvent) => {
            e.stopPropagation()
            onClick(e)
          }}
        >
          {icon}
        </span>
      )
    }

    function renderPreviewAction() {
      if (props.file.status === 'uploading' || !props.canPreview?.(props.file)) {
        return null
      }
      return action('preview', () => props.onPreview(props.file), <EyeOutlined />)
    }

    function renderDeleteAction() {
      if (props.file.status === 'uploading' || !props.canDelete?.(props.file)) {
        return null
      }
      return action('delete', () => props.onRemove(), <DeleteOutlined />)
    }

    function renderDownloadAction() {
      if (props.file.status === 'uploading' || !props.canDownload?.(props.file)) {
        return null
      }
      return action(
        'download',
        () => props.onDownload(props.file.response as ObjectWriteResult),
        <DownloadOutlined />,
      )
    }

    function renderProgress() {
      if (props.file.status !== 'uploading' || props.file.response) {
        return null
      }
      return (
        <span class={hashed(`${props.prefixCls}-overlay-progress`)}>
          <LoadingOutlined class={hashed(`${props.prefixCls}-overlay-spin`)} />
          <span>{`${props.file.percent}%`}</span>
        </span>
      )
    }

    return () => {
      const uploading = props.file.status === 'uploading'
      return (
        <span
          class={classNames(
            props.hashId,
            `${props.prefixCls}-overlay`,
            uploading ? `${props.prefixCls}-overlay-uploading` : undefined,
          )}
        >
          {renderPreviewAction()}
          {renderDeleteAction()}
          {renderDownloadAction()}
          {renderProgress()}
        </span>
      )
    }
  },
})

export default AttachmentThumbOverlay

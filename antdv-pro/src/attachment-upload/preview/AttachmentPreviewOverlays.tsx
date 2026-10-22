import {defineComponent, type PropType, Teleport} from 'vue'
import {ImagePreviewGroup, Modal} from 'antdv-next'
import {BasicImage, classNames} from '@loncra/antdv'
import type {ObjectWriteResult} from '@loncra/client/resource'
import type {UploadFile} from 'antdv-next/dist/upload/interface'

/**
 * 预览弹层（图片组 + 视频 Modal），Teleport 到 body。
 * `group` / `modal` 是父级的状态对象（reactive），开合变化经回调交回父级改。
 */
const AttachmentPreviewOverlays = defineComponent({
  name: 'LAttachmentPreviewOverlays',
  props: {
    imageFiles: {type: Array as PropType<UploadFile<ObjectWriteResult>[]>, required: true},
    group: {
      type: Object as PropType<{open: boolean; current: number}>,
      required: true,
    },
    modal: {
      type: Object as PropType<{open: boolean; file?: UploadFile}>,
      required: true,
    },
    prefixCls: {type: String, required: true},
    hashId: {type: String, required: true},
    cssVarCls: String,
    videoUnsupportedText: {type: String, required: true},
    onGroupOpenChange: Function as PropType<(open: boolean) => void>,
    onGroupCurrentChange: Function as PropType<(current: number) => void>,
    onModalUpdate: Function as PropType<(open: boolean) => void>,
  },
  setup(props) {
    const hashed = (name?: string) => classNames(props.hashId, props.cssVarCls, name)

    return () => (
      <Teleport to="body">
        {props.group.open ? (
          <div class={hashed(`${props.prefixCls}-preview-hidden`)}>
            <ImagePreviewGroup
              preview={{
                open: props.group.open,
                current: props.group.current,
                onOpenChange: (open: boolean) => props.onGroupOpenChange?.(open),
                onChange: (cur: number) => props.onGroupCurrentChange?.(cur),
              }}
            >
              {props.imageFiles.map((file) => (
                <BasicImage
                  key={file.uid}
                  {...({
                    src: file.thumbUrl || file.url,
                    alt: file.name,
                    loading: 'lazy',
                  } as Record<string, unknown>)}
                />
              ))}
            </ImagePreviewGroup>
          </div>
        ) : null}
        {props.modal.open ? (
          <Modal
            footer={null}
            destroyOnHidden
            open={props.modal.open}
            title={props.modal.file?.name}
            onUpdate:open={(open: boolean) => props.onModalUpdate?.(open)}
            onOk={() => props.onModalUpdate?.(false)}
            onCancel={() => props.onModalUpdate?.(false)}
          >
            {props.modal.file?.type?.includes('video/') ? (
              <video
                src={props.modal.file.url}
                controls
                autoplay
                class={hashed(`${props.prefixCls}-video`)}
              >
                {props.videoUnsupportedText}
              </video>
            ) : null}
          </Modal>
        ) : null}
      </Teleport>
    )
  },
})

export default AttachmentPreviewOverlays

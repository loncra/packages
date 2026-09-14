import {computed, defineComponent, type PropType, ref, Teleport, watch} from 'vue'
import {Alert, Button, Flex, ImagePreviewGroup, Modal, Progress, theme, TypographyText,} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {BasicImage, classNames, renderIconFont} from '@loncra/antdv'
import type {RestResult} from '@loncra/client/commons'
import type {ObjectWriteResult} from '@loncra/client/resource'
import {AttachmentService} from '@loncra/client/resource'
import useApp from 'antdv-next/dist/app/useApp'
import type {UploadFile} from 'antdv-next/dist/upload/interface'
import {byteFormat} from '../../_util/format'
import {getImageBase64, getVideoThumbnail} from '../../_util/media'
import {useLocale} from '../../_util/useLocale'
import {ATTACHMENT_PREVIEW_MODE} from '../constants'
import type {
  AttachmentPreviewMode,
  AttachmentPreviewProps,
  AttachmentUploadResolvedClassNames,
  AttachmentUploadResolvedStyles,
} from '../types'
import useStyle from '../style'
import AttachmentFilePreview from './AttachmentFilePreview'

function defaultCanDelete() {
  return true
}

function getAlertType(status: string | undefined) {
  if (status === undefined) {
    return 'warning'
  }
  if (status === 'error') {
    return 'error'
  }
  if (status === 'done') {
    return 'success'
  }
  if (status === 'uploading') {
    return 'info'
  }
  return 'warning'
}

function isImageFile(file: UploadFile<ObjectWriteResult>) {
  return file.type !== 'directory' && file.type?.includes('image/') && (file.thumbUrl || file.url)
}

function cardStatusClass(prefixCls: string, status: string | undefined) {
  if (status === undefined) {
    return `${prefixCls}-card-warning`
  }
  if (status === 'uploading') {
    return `${prefixCls}-card-info`
  }
  if (status === 'done') {
    return `${prefixCls}-card-success`
  }
  if (status === 'error') {
    return `${prefixCls}-card-error`
  }
  return undefined
}

const AttachmentPreview = defineComponent({
  name: 'LAttachmentPreview',
  inheritAttrs: false,
  props: {
    fileList: {
      type: Array as PropType<UploadFile<ObjectWriteResult>[]>,
      default: () => [],
    },
    mode: {
      type: String as PropType<AttachmentPreviewMode>,
      default: ATTACHMENT_PREVIEW_MODE.LIST,
    },
    changeThumbUrl: {
      type: Boolean,
      default: true,
    },
    showFilename: {
      type: Boolean,
      default: true,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    preview: {
      type: Boolean,
      default: false,
    },
    height: String,
    width: String,
    canPreview: Function as PropType<AttachmentPreviewProps['canPreview']>,
    canDelete: {
      type: Function as PropType<AttachmentPreviewProps['canDelete']>,
      default: defaultCanDelete,
    },
    canDownload: Function as PropType<AttachmentPreviewProps['canDownload']>,
    classes: Object as PropType<AttachmentUploadResolvedClassNames>,
    styles: Object as PropType<AttachmentUploadResolvedStyles>,
    prefixCls: String,
  },
  emits: {
    'update:fileList': (_list: UploadFile<ObjectWriteResult>[]) => true,
    remove: (_file: UploadFile<ObjectWriteResult>) => true,
  },
  setup(props, {emit, slots}) {
    const locale = useLocale('AttachmentUpload')
    const {message, modal} = useApp()
    const config = useConfig()
    const {token} = theme.useToken()
    const prefixCls = computed(() =>
      config.value.getPrefixCls(
        'attachment-upload',
        props.prefixCls ?? 'loncra-attachment-upload',
      ),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)

    const previewImageGroup = ref({
      open: false,
      current: 0,
    })
    const modalOptions = ref<{
      open: boolean
      file?: UploadFile
    }>({
      open: false,
    })

    const imageFiles = computed(() => (props.fileList ?? []).filter(isImageFile))

    const itemClass = computed(() =>
      classNames(
        props.classes?.item,
        props.mode === ATTACHMENT_PREVIEW_MODE.PICTURE_CARD
          ? `${prefixCls.value}-item-lg`
          : `${prefixCls.value}-item-sm`,
      ),
    )

    function setFileList(list: UploadFile<ObjectWriteResult>[]) {
      emit('update:fileList', list)
    }

    function postRemove(file: UploadFile<ObjectWriteResult>) {
      setFileList((props.fileList ?? []).filter((f) => f.uid !== file.uid))
      emit('remove', file)
    }

    function onDownload(file: ObjectWriteResult) {
      AttachmentService.download(file.bucketName, file.objectName)
    }

    function onRemove(file: UploadFile<ObjectWriteResult>) {
      if (file.response) {
        modal.confirm({
          title: locale.value.deleteConfirmTitle,
          content: locale.value.deleteConfirmSingle,
          onOk: () => doRemove(file),
        })
      } else {
        postRemove(file)
      }
    }

    async function doRemove(file: UploadFile<ObjectWriteResult>) {
      if (!file.response) {
        return
      }
      try {
        const result: RestResult<void> = await AttachmentService.removeAttachment([file.response])
        message.success(result.message)
        postRemove(file)
      } catch (e) {
        message.error(e instanceof Error ? e.message : String(e))
      }
    }

    function openPreview(file: UploadFile<ObjectWriteResult>) {
      if (file.type?.includes('image/')) {
        const index = imageFiles.value.findIndex((f) => f.uid === file.uid)
        if (index === -1) {
          return
        }
        previewImageGroup.value.current = index
        previewImageGroup.value.open = true
      } else if (file.type?.includes('video/')) {
        modalOptions.value = {open: true, file}
      }
    }

    async function ensureThumbUrl(file: UploadFile<ObjectWriteResult>) {
      if (file.type === 'directory' || file.thumbUrl) {
        return
      }
      if (file.url && file.type?.includes('image/')) {
        setFileList(
          (props.fileList ?? []).map((f) => (f.uid === file.uid ? {...f, thumbUrl: file.url} : f)),
        )
        return
      }
      if (!file.originFileObj) {
        return
      }
      if (file.type?.includes('image/')) {
        const thumbUrl = await getImageBase64(file.originFileObj)
        setFileList((props.fileList ?? []).map((f) => (f.uid === file.uid ? {...f, thumbUrl} : f)))
      } else if (file.type?.includes('video/') && file.originFileObj) {
        const result = await getVideoThumbnail(file.originFileObj)
        setFileList(
          (props.fileList ?? []).map((f) =>
            f.uid === file.uid ? {...f, thumbUrl: result.base64, url: result.videoUrl} : f,
          ),
        )
      }
    }

    function valueChange() {
      if (!props.changeThumbUrl) {
        return
      }
      ;(props.fileList ?? []).forEach((f) => {
        void ensureThumbUrl(f)
      })
    }

    watch(
      () => props.fileList,
      () => valueChange(),
      {immediate: true, deep: true},
    )

    function renderFilePreview(
      file: UploadFile<ObjectWriteResult>,
      extra: {
        border?: boolean
        canDelete?: AttachmentPreviewProps['canDelete']
        canPreview?: AttachmentPreviewProps['canPreview']
        canDownload?: AttachmentPreviewProps['canDownload']
        onDelete?: (file: UploadFile<ObjectWriteResult>) => void
      } = {},
    ) {
      return (
        <AttachmentFilePreview
          file={file}
          border={extra.border}
          disabled={props.disabled}
          itemClass={itemClass.value}
          itemStyle={props.styles?.item}
          canDelete={extra.canDelete}
          canPreview={extra.canPreview}
          canDownload={extra.canDownload}
          prefixCls={prefixCls.value}
          hashId={hashId.value}
          cssVarCls={cssVarCls.value}
          onPreview={openPreview}
          onDelete={extra.onDelete}
          v-slots={{
            itemRender: slots.itemRender
              ? (ctx: {file: UploadFile<ObjectWriteResult>}) => slots.itemRender!(ctx)
              : undefined,
            itemIcon: slots.itemIcon
              ? (ctx: {file: UploadFile<ObjectWriteResult>}) => slots.itemIcon!(ctx)
              : undefined,
          }}
        />
      )
    }

    return () => {
      const hashed = (name?: string) => classNames(hashId.value, cssVarCls.value, name)
      const files = props.fileList ?? []
      const showMeta = !!(slots.itemTitle || slots.itemDescription || props.showFilename)

      const listMode =
        props.mode === ATTACHMENT_PREVIEW_MODE.LIST ? (
          <Flex
            vertical
            class={hashed(classNames(`${prefixCls.value}-list`, props.classes?.list))}
            gap="middle"
            style={props.styles?.list}
          >
            {slots.listBefore?.()}
            {files.map((file) =>
              slots.itemRender ? (
                slots.itemRender({file})
              ) : (
                <Alert key={file.uid} type={getAlertType(file.status)}>
                  {{
                    title: () => (
                      <Flex
                        justify="space-between"
                        align="center"
                        gap={token.value.sizeXS}
                      >
                        {renderFilePreview(file)}
                        <Flex vertical class={hashed(`${prefixCls.value}-grow`)}>
                          <Flex class={hashed(`${prefixCls.value}-grow`)}>
                            <Flex vertical class={hashed(`${prefixCls.value}-grow`)}>
                              <TypographyText ellipsis class={hashed(`${prefixCls.value}-grow`)}>
                                {file.name}
                              </TypographyText>
                              <TypographyText
                                type="secondary"
                                class={hashed(`${prefixCls.value}-size`)}
                              >
                                {`(${byteFormat(file.size || 0)})`}
                              </TypographyText>
                            </Flex>
                            {!props.disabled ? (
                              <Flex gap="small">
                                {!props.preview ? (
                                  <Button
                                    danger
                                    type="text"
                                    disabled={file.status === 'uploading'}
                                    onClick={() => onRemove(file)}
                                  >
                                    {renderIconFont('loncra-archive-x')}
                                  </Button>
                                ) : null}
                                {file.response ? (
                                  <Button
                                    type="text"
                                    onClick={() => onDownload(file.response as ObjectWriteResult)}
                                  >
                                    {renderIconFont('loncra-download')}
                                  </Button>
                                ) : null}
                              </Flex>
                            ) : null}
                          </Flex>
                          {!file.response || !props.disabled ? (
                            <Progress percent={file.percent} size="small" />
                          ) : null}
                        </Flex>
                      </Flex>
                    ),
                  }}
                </Alert>
              ),
            )}
          </Flex>
        ) : null

      const cardMode =
        props.mode === ATTACHMENT_PREVIEW_MODE.PICTURE_CARD ? (
          <span
            class={hashed(
              classNames(`${prefixCls.value}-list-cards`, props.classes?.list),
            )}
            style={props.styles?.list}
          >
            {files.map((file) => (
              <span
                key={file.uid}
                class={hashed(
                  classNames(
                    `${prefixCls.value}-card`,
                    props.preview
                      ? `${prefixCls.value}-card-preview`
                      : cardStatusClass(prefixCls.value, file.status),
                  ),
                )}
              >
                {renderFilePreview(file, {
                  border: !props.preview,
                  canDelete: (item) => !props.preview && !!props.canDelete?.(item),
                  canPreview: props.canPreview,
                  canDownload: props.canDownload,
                  onDelete: (_file) => postRemove(_file),
                })}
                {showMeta ? (
                  <span
                    class={hashed(classNames(`${prefixCls.value}-meta`, props.classes?.meta))}
                  >
                    {slots.itemTitle ? (
                      <TypographyText
                        strong
                        ellipsis={{tooltip: true}}
                        class={hashed(`${prefixCls.value}-block`)}
                      >
                        {slots.itemTitle({file})}
                      </TypographyText>
                    ) : props.showFilename ? (
                      <TypographyText
                        ellipsis={{tooltip: true}}
                        class={hashed(`${prefixCls.value}-block`)}
                      >
                        {file.name}
                      </TypographyText>
                    ) : null}
                    {slots.itemDescription ? (
                      <TypographyText
                        ellipsis={{tooltip: true}}
                        class={hashed(`${prefixCls.value}-block`)}
                      >
                        {slots.itemDescription({file})}
                      </TypographyText>
                    ) : null}
                  </span>
                ) : null}
              </span>
            ))}
            {slots.pictureCardAfter?.({showMeta})}
          </span>
        ) : null

      return (
        <span class={hashed(props.classes?.container)} style={props.styles?.container}>
          {listMode}
          {cardMode}
          <Teleport to="body">
            {previewImageGroup.value.open ? (
              <div class={hashed(`${prefixCls.value}-preview-hidden`)}>
                <ImagePreviewGroup
                  preview={{
                    open: previewImageGroup.value.open,
                    current: previewImageGroup.value.current,
                    onOpenChange: (open: boolean) => {
                      previewImageGroup.value.open = open
                    },
                    onChange: (cur: number) => {
                      previewImageGroup.value.current = cur
                    },
                  }}
                >
                  {imageFiles.value.map((file) => (
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
            {modalOptions.value.open ? (
              <Modal
                footer={null}
                destroyOnHidden
                open={modalOptions.value.open}
                title={modalOptions.value.file?.name}
                onUpdate:open={(open: boolean) => {
                  modalOptions.value = {...modalOptions.value, open}
                }}
                onOk={() => {
                  modalOptions.value.open = false
                }}
                onCancel={() => {
                  modalOptions.value.open = false
                }}
              >
                {modalOptions.value.file?.type?.includes('video/') ? (
                  <video
                    src={modalOptions.value.file.url}
                    controls
                    autoplay
                    class={hashed(`${prefixCls.value}-video`)}
                  >
                    您的浏览器不支持视频播放。
                  </video>
                ) : null}
              </Modal>
            ) : null}
          </Teleport>
        </span>
      )
    }
  },
})

export default AttachmentPreview

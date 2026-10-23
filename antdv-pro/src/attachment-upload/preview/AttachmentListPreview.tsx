import {type CSSProperties, defineComponent, type PropType, type VNodeChild} from 'vue'
import {Alert, Button, Flex, Progress, theme, TypographyText} from 'antdv-next'
import {DeleteOutlined, DownloadOutlined} from '@antdv-next/icons'
import {classNames} from '@loncra/antdv'
import type {ObjectWriteResult} from '@loncra/client/resource'
import type {UploadFile} from 'antdv-next/dist/upload/interface'
import {byteFormat} from '../../_util/format'
import {attachmentAlertType} from '../attachmentKinds'
import type {AttachmentPathItem, AttachmentPreviewRenderers} from '../types'
import AttachmentFilePreview from './AttachmentFilePreview'
import {pickItemSlots} from '../internal/attachmentItemSlots'

const AttachmentListPreview = defineComponent({
  name: 'LAttachmentListPreview',
  inheritAttrs: false,
  props: {
    files: {type: Array as PropType<UploadFile<ObjectWriteResult>[]>, required: true},
    preview: Boolean,
    disabled: Boolean,
    itemClass: String,
    itemStyle: Object as PropType<CSSProperties>,
    listClass: String,
    listStyle: Object as PropType<CSSProperties>,
    prefixCls: {type: String, required: true},
    hashId: {type: String, required: true},
    cssVarCls: String,
    previewRenderers: Object as PropType<AttachmentPreviewRenderers>,
    onPreview: {
      type: Function as PropType<(file: UploadFile<ObjectWriteResult>) => void>,
      required: true,
    },
    onRemove: {
      type: Function as PropType<(file: UploadFile<ObjectWriteResult>) => void>,
      required: true,
    },
    onDownload: {
      type: Function as PropType<(file: ObjectWriteResult) => void>,
      required: true,
    },
  },
  setup(props, {slots}) {
    const {token} = theme.useToken()
    const hashed = (name?: string) => classNames(props.hashId, props.cssVarCls, name)
    const itemSlots = pickItemSlots(slots)

    function renderActions(file: UploadFile<ObjectWriteResult>) {
      if (props.disabled) {
        return null
      }
      return (
        <Flex gap="small">
          {!props.preview ? (
            <Button
              danger
              size="small"
              type="text"
              disabled={file.status === 'uploading'}
              onClick={() => props.onRemove(file)}
            >
              <DeleteOutlined />
            </Button>
          ) : null}
          {file.response ? (
            <Button
              type="text"
              size="small"
              onClick={() => props.onDownload(file.response as ObjectWriteResult)}
            >
              <DownloadOutlined />
            </Button>
          ) : null}
        </Flex>
      )
    }

    function renderItem(file: UploadFile<ObjectWriteResult>) {
      if (slots.itemRender) {
        return slots.itemRender({file})
      }
      return (
        <Alert type={props.preview ? 'info' : attachmentAlertType(file.status)}>
          {{
            title: () => (
              <Flex justify="space-between" gap={token.value.sizeXS}>
                <AttachmentFilePreview
                  file={file}
                  disabled={props.disabled}
                  itemClass={props.itemClass}
                  itemStyle={props.itemStyle}
                  prefixCls={props.prefixCls}
                  hashId={props.hashId}
                  canDelete={() => false}
                  canDownload={() => false}
                  cssVarCls={props.cssVarCls}
                  previewRenderers={props.previewRenderers}
                  onPreview={props.onPreview}
                  v-slots={itemSlots}
                />
                <Flex vertical justify={"space-between"} class={hashed(`${props.prefixCls}-grow`)}>
                  <Flex justify={"space-between"} align={"center"} class={hashed(`${props.prefixCls}-grow`)}>
                    <Flex vertical justify="space-between" class={hashed(`${props.prefixCls}-grow`)}>
                      <TypographyText ellipsis class={hashed(`${props.prefixCls}-grow`)}>
                        {file.name}
                      </TypographyText>
                      <TypographyText
                        type="secondary"
                        class={hashed(`${props.prefixCls}-size`)}
                      >
                        {`(${byteFormat(file.size || 0)})`}
                      </TypographyText>
                    </Flex>
                    {renderActions(file)}
                  </Flex>
                  {!props.preview && (!file.response || !props.disabled) ? (
                    <Progress percent={file.percent} size="small" />
                  ) : (
                    <></>
                  )}
                </Flex>
              </Flex>
            ),
          }}
        </Alert>
      )
    }

    function renderItems(files: UploadFile<ObjectWriteResult>[], depth = 0): VNodeChild {
      return files.map((file) => (
        <div
          key={file.uid}
          style={depth > 0 ? {paddingInlineStart: token.value.size * depth} : undefined}
        >
          {renderItem(file)}
          {file.type === 'directory'
            ? renderItems((file as AttachmentPathItem).children ?? [], depth + 1)
            : null}
        </div>
      ))
    }

    return () => (
      <Flex
        vertical
        class={hashed(classNames(`${props.prefixCls}-list`, props.listClass))}
        gap="middle"
        style={props.listStyle}
      >
        {slots.listBefore?.()}
        {renderItems(props.files)}
      </Flex>
    )
  },
})

export default AttachmentListPreview

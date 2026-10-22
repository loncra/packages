import {type CSSProperties, defineComponent, type PropType} from 'vue'
import {TypographyText} from 'antdv-next'
import {classNames} from '@loncra/antdv'
import type {ObjectWriteResult} from '@loncra/client/resource'
import type {UploadFile} from 'antdv-next/dist/upload/interface'
import {attachmentStatusClass} from '../attachmentKinds'
import type {AttachmentPreviewProps} from '../types'
import AttachmentFilePreview from './AttachmentFilePreview'
import {pickItemSlots} from '../internal/attachmentItemSlots'

const AttachmentCardPreview = defineComponent({
  name: 'LAttachmentCardPreview',
  inheritAttrs: false,
  props: {
    files: {type: Array as PropType<UploadFile<ObjectWriteResult>[]>, required: true},
    preview: Boolean,
    disabled: Boolean,
    showFilename: Boolean,
    itemClass: String,
    itemStyle: Object as PropType<CSSProperties>,
    listClass: String,
    listStyle: Object as PropType<CSSProperties>,
    metaClass: String,
    prefixCls: {type: String, required: true},
    hashId: {type: String, required: true},
    cssVarCls: String,
    canDelete: Function as PropType<AttachmentPreviewProps['canDelete']>,
    canPreview: Function as PropType<AttachmentPreviewProps['canPreview']>,
    canDownload: Function as PropType<AttachmentPreviewProps['canDownload']>,
    onPreview: {
      type: Function as PropType<(file: UploadFile<ObjectWriteResult>) => void>,
      required: true,
    },
    onPostRemove: {
      type: Function as PropType<(file: UploadFile<ObjectWriteResult>) => void>,
      required: true,
    },
  },
  setup(props, {slots}) {
    const hashed = (name?: string) => classNames(props.hashId, props.cssVarCls, name)
    const showMeta = !!(slots.itemTitle || slots.itemDescription || props.showFilename)

    return () => (
      <span
        class={hashed(classNames(`${props.prefixCls}-list-cards`, props.listClass))}
        style={props.listStyle}
      >
        {props.files.map((file) => (
          <span
            key={file.uid}
            class={hashed(
              classNames(
                `${props.prefixCls}-card`,
                props.preview
                  ? `${props.prefixCls}-card-preview`
                  : attachmentStatusClass(props.prefixCls, 'card', file.status),
              ),
            )}
          >
            <AttachmentFilePreview
              file={file}
              border={!props.preview}
              disabled={props.disabled}
              itemClass={props.itemClass}
              itemStyle={props.itemStyle}
              canDelete={(item) => !props.preview && !!props.canDelete?.(item)}
              canPreview={props.canPreview}
              canDownload={props.canDownload}
              prefixCls={props.prefixCls}
              hashId={props.hashId}
              cssVarCls={props.cssVarCls}
              onPreview={props.onPreview}
              onDelete={props.onPostRemove}
              v-slots={{...pickItemSlots(slots)}}
            />
            {showMeta ? (
              <span class={hashed(classNames(`${props.prefixCls}-meta`, props.metaClass))}>
                {slots.itemTitle ? (
                  <TypographyText
                    strong
                    ellipsis={{tooltip: true}}
                    class={hashed(`${props.prefixCls}-block`)}
                  >
                    {slots.itemTitle({file})}
                  </TypographyText>
                ) : props.showFilename ? (
                  <TypographyText
                    ellipsis={{tooltip: true}}
                    class={hashed(`${props.prefixCls}-block`)}
                  >
                    {file.name}
                  </TypographyText>
                ) : null}
                {slots.itemDescription ? (
                  <TypographyText
                    ellipsis={{tooltip: true}}
                    class={hashed(`${props.prefixCls}-block`)}
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
    )
  },
})

export default AttachmentCardPreview

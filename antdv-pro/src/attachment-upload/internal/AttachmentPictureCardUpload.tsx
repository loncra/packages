import {computed, defineComponent, h, type PropType, type Ref, useModel} from 'vue'
import type {UploadChangeParam} from 'antdv-next'
import {TypographyText, Upload} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {PlusOutlined} from '@antdv-next/icons'
import {classNames} from '@loncra/antdv'
import type {ObjectWriteResult} from '@loncra/client/resource'
import type {UploadFile} from 'antdv-next/dist/upload/interface'
import {ATTACHMENT_PREVIEW_MODE} from '../constants'
import type {
  AttachmentFileItem,
  AttachmentPictureCardUploadProps,
  AttachmentPreviewMode,
  AttachmentUploadResolvedClassNames,
  AttachmentUploadResolvedStyles,
} from '../types'
import useStyle from '../style'
import AttachmentPreview from '../preview/AttachmentPreview'
import {useAttachmentUploadFiles} from './useAttachmentUploadFiles'

const AttachmentPictureCardUpload = defineComponent({
  name: 'LAttachmentPictureCardUpload',
  inheritAttrs: false,
  props: {
    fileList: {
      type: Array as PropType<AttachmentFileItem[]>,
      default: () => [],
    },
    mode: {
      type: String as PropType<AttachmentPreviewMode>,
      default: ATTACHMENT_PREVIEW_MODE.PICTURE_CARD,
    },
    preview: {
      type: Boolean,
      default: false,
    },
    showFilename: {
      type: Boolean,
      default: true,
    },
    changeThumbUrl: {
      type: Boolean,
      default: true,
    },
    disabled: Boolean,
    multiple: Boolean,
    accept: String,
    maxCount: Number,
    canPreview: Function as PropType<AttachmentPictureCardUploadProps['canPreview']>,
    canDelete: Function as PropType<AttachmentPictureCardUploadProps['canDelete']>,
    canDownload: Function as PropType<AttachmentPictureCardUploadProps['canDownload']>,
    classes: Object as PropType<AttachmentUploadResolvedClassNames>,
    styles: Object as PropType<AttachmentUploadResolvedStyles>,
    prefixCls: String,
  },
  emits: {
    'update:fileList': (_list: AttachmentFileItem[]) => true,
    change: (_info: UploadChangeParam) => true,
    remove: (_file: UploadFile<ObjectWriteResult>) => true,
  },
  setup(props, {emit, slots, attrs}) {
    const config = useConfig()
    const prefixCls = computed(() =>
      config.value.getPrefixCls(
        'attachment-upload',
        props.prefixCls ?? 'loncra-attachment-upload',
      ),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)

    // 双向绑定：父级未监听 update:fileList 时写本地值，否则由父级回流
    const fileList = useModel(props, 'fileList') as unknown as Ref<AttachmentFileItem[]>
    const {uploadFiles, antdFileList, onAntdFileListChange} = useAttachmentUploadFiles(fileList)

    function onChange(info: UploadChangeParam) {
      onAntdFileListChange(info)
      emit('change', info)
    }

    return () => {
      const {class: _attrClass, style: _attrStyle, ...rest} = attrs
      const hashed = (...names: (string | undefined)[]) =>
        classNames(hashId.value, cssVarCls.value, ...names)
      const multi = !!(props.maxCount && props.maxCount > 1)
      const showTrigger =
        !props.maxCount || uploadFiles.value.length < props.maxCount || props.preview

      return (
        <AttachmentPreview
          fileList={uploadFiles.value}
          onUpdate:fileList={(list) => {
            uploadFiles.value = list
          }}
          preview={props.preview}
          classes={props.classes}
          styles={props.styles}
          mode={ATTACHMENT_PREVIEW_MODE.PICTURE_CARD}
          disabled={props.disabled}
          showFilename={props.showFilename}
          changeThumbUrl={props.changeThumbUrl}
          canPreview={props.canPreview}
          canDelete={props.canDelete}
          canDownload={props.canDownload}
          prefixCls={prefixCls.value}
          onRemove={(file) => emit('remove', file)}
          v-slots={{
            pictureCardAfter: showTrigger
              ? ({showMeta}: {showMeta: boolean}) =>
                  !props.preview && !props.disabled ? (
                    /**
                     * 触发区：`classes.trigger` / `styles.trigger` 挂在这块虚线框上（宿主看到的就是它）。
                     * ⚠️ **不再转给 antd 的 `Upload`** —— 语义键 `trigger` 的归属就是"触发上传的那块区域"，
                     * 里面那层 `.ant-upload` 要改只能自己写全局类名（见 `types.ts` 的语义键说明）。
                     */
                    <span
                      class={hashed(
                        classNames(`${prefixCls.value}-trigger`, props.classes?.trigger),
                      )}
                      style={props.styles?.trigger}
                    >
                      <Upload
                        {...rest}
                        class={hashed(
                          `${prefixCls.value}-trigger-upload`,
                          multi ? `${prefixCls.value}-trigger-upload-multi` : undefined,
                        )}
                        fileList={antdFileList.value}
                        beforeUpload={() => false}
                        showUploadList={false}
                        maxCount={props.maxCount}
                        multiple={props.multiple}
                        accept={props.accept}
                        onChange={onChange}
                      >
                        <span
                          class={hashed(
                            `${prefixCls.value}-trigger-inner`,
                            multi ? `${prefixCls.value}-trigger-inner-multi` : undefined,
                          )}
                        >
                          <TypographyText type="secondary">
                            {h(PlusOutlined, {
                              class: hashed(`${prefixCls.value}-plus-icon`),
                            })}
                          </TypographyText>
                          {slots.uploadDescription?.()}
                        </span>
                      </Upload>
                      {showMeta && multi ? (
                        <span
                          class={hashed(
                            classNames(`${prefixCls.value}-meta`, props.classes?.meta),
                          )}
                        >
                          <TypographyText
                            type="secondary"
                            ellipsis
                            class={hashed(`${prefixCls.value}-block`)}
                          >
                            {`${uploadFiles.value.length} / ${props.maxCount}`}
                          </TypographyText>
                        </span>
                      ) : null}
                    </span>
                  ) : null
              : undefined,
            itemRender: slots.itemRender
              ? (ctx: {file: UploadFile<ObjectWriteResult>}) => slots.itemRender!(ctx)
              : undefined,
            itemIcon: slots.itemIcon
              ? (ctx: {file: UploadFile<ObjectWriteResult>}) => slots.itemIcon!(ctx)
              : undefined,
            itemTitle: slots.itemTitle
              ? (ctx: {file: UploadFile<ObjectWriteResult>}) => slots.itemTitle!(ctx)
              : undefined,
            itemDescription: slots.itemDescription
              ? (ctx: {file: UploadFile<ObjectWriteResult>}) => slots.itemDescription!(ctx)
              : undefined,
          }}
        />
      )
    }
  },
})

export default AttachmentPictureCardUpload

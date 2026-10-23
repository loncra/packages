import {computed, defineComponent, h, type PropType, type Ref} from 'vue'
import type {UploadChangeParam} from 'antdv-next'
import {TypographyText, Upload} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {PlusOutlined} from '@antdv-next/icons'
import {classNames, useTwoWayModel} from '@loncra/antdv'
import type {ObjectWriteResult} from '@loncra/client/resource'
import type {UploadFile} from 'antdv-next/dist/upload/interface'
import {ATTACHMENT_PREVIEW_MODE} from '../constants'
import type {
  AttachmentFileItem,
  AttachmentPictureCardUploadProps,
  AttachmentPreviewRenderers,
  AttachmentUploadResolvedClassNames,
  AttachmentUploadResolvedStyles,
} from '../types'
import useStyle from '../style'
import AttachmentPreview from '../preview/AttachmentPreview'
import {useAttachmentUploadFiles} from './useAttachmentUploadFiles'
import {pickItemSlots} from './attachmentItemSlots'

const AttachmentPictureCardUpload = defineComponent({
  name: 'LAttachmentPictureCardUpload',
  inheritAttrs: false,
  props: {
    fileList: {
      type: Array as PropType<AttachmentFileItem[]>,
      default: () => [],
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
    dedupe: Boolean,
    maxCount: Number,
    canPreview: Function as PropType<AttachmentPictureCardUploadProps['canPreview']>,
    canDelete: Function as PropType<AttachmentPictureCardUploadProps['canDelete']>,
    canDownload: Function as PropType<AttachmentPictureCardUploadProps['canDownload']>,
    classes: Object as PropType<AttachmentUploadResolvedClassNames>,
    styles: Object as PropType<AttachmentUploadResolvedStyles>,
    previewRenderers: Object as PropType<AttachmentPreviewRenderers>,
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

    const fileList = useTwoWayModel(props, 'fileList', emit) as unknown as Ref<AttachmentFileItem[]>
    const {uploadFiles, antdFileList, onAntdFileListChange, beforeUpload} = useAttachmentUploadFiles(
      fileList,
      {dedupe: () => !!props.dedupe},
    )
    const triggerVisible = computed(() => !props.preview && !props.disabled)

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
          previewRenderers={props.previewRenderers}
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
                  triggerVisible.value ? (
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
                        beforeUpload={beforeUpload}
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
            ...pickItemSlots(slots),
          }}
        />
      )
    }
  },
})

export default AttachmentPictureCardUpload

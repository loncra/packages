import {computed, defineComponent, type PropType, toRef} from 'vue'
import type {UploadChangeParam} from 'antdv-next'
import {Upload} from 'antdv-next'
import {useMergeSemantic, useToArr, useToProps,} from 'antdv-next/dist/_util/hooks/useMergeSemantic'
import {classNames} from '@loncra/antdv'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import type {ObjectWriteResult} from '@loncra/client/resource'
import type {UploadFile} from 'antdv-next/dist/upload/interface'
import {uploadFile as uploadAttachmentFile} from '../_util/uploadFile'
import {ATTACHMENT_PREVIEW_MODE, ATTACHMENT_UPLOAD_MODE} from './constants'
import type {
    AttachmentPreviewMode,
    AttachmentPreviewRenderers,
    AttachmentUploadClassNamesType,
    AttachmentUploadMode,
    AttachmentUploadProps,
    AttachmentUploadResolvedClassNames,
    AttachmentUploadResolvedStyles,
    AttachmentUploadStylesType,
} from './types'
import useStyle from './style'
import {useAttachmentUploadValue} from './useAttachmentUploadValue'
import {useAttachmentUploadAction} from './useAttachmentUploadAction'
import AttachmentDraggerUpload from './internal/AttachmentDraggerUpload'
import AttachmentPictureCardUpload from './internal/AttachmentPictureCardUpload'
import {pickItemSlots} from './internal/attachmentItemSlots'

const AttachmentUpload = defineComponent({
  name: 'LAttachmentUpload',
  inheritAttrs: false,
  props: {
    value: [Object, Array] as PropType<AttachmentUploadProps['value']>,
    postFilename: {
      type: String,
      default: 'file',
    },
    mode: {
      type: String as PropType<AttachmentUploadMode>,
      default: ATTACHMENT_UPLOAD_MODE.PICTURE_CARD,
    },
    promiseLimit: {
      type: Number,
      default: 3,
    },
    dedupe: {
      type: Boolean,
      default: false,
    },
    bucket: {
      type: String,
      default: 'user.file',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    preview: {
      type: Boolean,
      default: false,
    },
    showFilename: {
      type: Boolean,
      default: true,
    },
    multiple: {
      type: Boolean,
      default: true,
    },
    accept: String,
    maxCount: Number,
    action: String,
    uploadOptions: Object as PropType<Record<string, unknown>>,
    previewMode: String as PropType<AttachmentPreviewMode>,
    previewRenderers: Object as PropType<AttachmentPreviewRenderers>,
    canPreview: Function as PropType<AttachmentUploadProps['canPreview']>,
    canDelete: Function as PropType<AttachmentUploadProps['canDelete']>,
    canDownload: Function as PropType<AttachmentUploadProps['canDownload']>,
    classes: [Object, Function] as PropType<AttachmentUploadClassNamesType>,
    styles: [Object, Function] as PropType<AttachmentUploadStylesType>,
    prefixCls: String,
    rootClass: String,
  },
  emits: {
    'update:value': (_value: AttachmentUploadProps['value']) => true,
    remove: (_file: UploadFile<ObjectWriteResult>) => true,
    change: (_info: UploadChangeParam) => true,
  },
  setup(props, {emit, slots, attrs, expose}) {
    const config = useConfig()
    const prefixCls = computed(() =>
      config.value.getPrefixCls(
        'attachment-upload',
        props.prefixCls ?? 'loncra-attachment-upload',
      ),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)

    const fileList = useAttachmentUploadValue(props, emit)

    const [mergedClasses, mergedStyles] = (
      useMergeSemantic as (
        classNamesList: unknown,
        stylesList: unknown,
        info: unknown,
      ) => readonly [
        {value: AttachmentUploadResolvedClassNames},
        {value: AttachmentUploadResolvedStyles},
      ]
    )(
      useToArr(toRef(props, 'classes') as never),
      useToArr(toRef(props, 'styles') as never),
      useToProps(computed(() => props) as never),
    )

    const {upload, getFiles, buildExecutorOptions} = useAttachmentUploadAction({
      fileList,
      value: () => props.value,
      maxCount: () => props.maxCount,
      bucket: () => props.bucket,
      promiseLimit: () => props.promiseLimit,
      postFilename: () => props.postFilename,
      uploadOptions: () => props.uploadOptions,
    })

    expose({
      upload,
      getFiles,
      uploadFile: (file: UploadFile) =>
        uploadAttachmentFile(file, props.bucket, buildExecutorOptions()),
    })

    return () => {
      const {class: attrClass, style: attrStyle, ...rest} = attrs
      const hashedClass = classNames(
        prefixCls.value,
        hashId.value,
        cssVarCls.value,
        props.rootClass,
        attrClass,
      )
      const sharedSlots = pickItemSlots(slots)

      if (props.mode === ATTACHMENT_UPLOAD_MODE.DRAGGER) {
        return (
          <div class={hashedClass} style={attrStyle as never}>
            <AttachmentDraggerUpload
              {...rest}
              fileList={fileList.value}
              onUpdate:fileList={(list) => {
                fileList.value = list
              }}
              preview={props.preview}
              canPreview={props.canPreview}
              canDelete={props.canDelete}
              canDownload={props.canDownload}
              classes={mergedClasses.value}
              styles={mergedStyles.value}
              previewRenderers={props.previewRenderers}
              maxCount={props.maxCount}
              multiple={props.multiple}
              accept={props.accept}
              dedupe={props.dedupe}
              disabled={props.disabled}
              mode={props.previewMode || ATTACHMENT_PREVIEW_MODE.LIST}
              prefixCls={prefixCls.value}
              onRemove={(file) => emit('remove', file)}
              onChange={(info) => emit('change', info)}
              v-slots={sharedSlots}
            />
          </div>
        )
      }

      if (props.mode === ATTACHMENT_UPLOAD_MODE.PICTURE_CARD) {
        return (
          <div class={hashedClass} style={attrStyle as never}>
            <AttachmentPictureCardUpload
              {...rest}
              fileList={fileList.value}
              onUpdate:fileList={(list) => {
                fileList.value = list
              }}
              preview={props.preview}
              canPreview={props.canPreview}
              canDelete={props.canDelete}
              canDownload={props.canDownload}
              disabled={props.disabled}
              maxCount={props.maxCount}
              multiple={props.multiple}
              accept={props.accept}
              dedupe={props.dedupe}
              showFilename={props.showFilename}
              classes={mergedClasses.value}
              styles={mergedStyles.value}
              previewRenderers={props.previewRenderers}
              prefixCls={prefixCls.value}
              onRemove={(file) => emit('remove', file)}
              onChange={(info) => emit('change', info)}
              v-slots={{
                ...sharedSlots,
                uploadDescription: slots.uploadDescription,
              }}
            />
          </div>
        )
      }

      return (
        <div class={hashedClass} style={attrStyle as never}>
          <Upload
            {...rest}
            disabled={props.disabled}
            accept={props.accept}
            action={props.action}
            maxCount={props.maxCount}
            multiple={props.multiple}
          >
            {slots.default?.()}
          </Upload>
        </div>
      )
    }
  },
})

export default AttachmentUpload
export type {
  AttachmentUploadEmits,
  AttachmentUploadExpose,
  AttachmentUploadProps,
  AttachmentUploadSlots,
  AttachmentFileItem,
  AttachmentValue,
  AttachmentUploadExecutorOptions,
} from './types'

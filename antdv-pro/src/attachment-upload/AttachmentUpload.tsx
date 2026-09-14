import {computed, defineComponent, nextTick, type PropType, ref, toRef, watch} from 'vue'
import type {UploadChangeParam} from 'antdv-next'
import {Upload} from 'antdv-next'
import {useMergeSemantic, useToArr, useToProps,} from 'antdv-next/dist/_util/hooks/useMergeSemantic'
import {useFormItemContext} from 'antdv-next/dist/form/context'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '@loncra/antdv'
import type {ObjectWriteResult} from '@loncra/client/resource'
import type {UploadFile} from 'antdv-next/dist/upload/interface'
import {
  applyAttachmentDirectoryProgress,
  collectAttachmentFileLeaves,
  denormalizeAttachmentFromList,
  detectAttachmentValueMode,
  isObjectWriteResult,
  isUploadFile,
  normalizeAttachmentToList,
} from '../_util/attachmentList'
import {uploadFile as uploadAttachmentFile} from '../_util/uploadFile'
import {ATTACHMENT_PREVIEW_MODE, ATTACHMENT_UPLOAD_MODE} from './constants'
import type {
  AttachmentFileItem,
  AttachmentPathItem,
  AttachmentPreviewMode,
  AttachmentUploadClassNamesType,
  AttachmentUploadExecutorOptions,
  AttachmentUploadMode,
  AttachmentUploadProps,
  AttachmentUploadResolvedClassNames,
  AttachmentUploadResolvedStyles,
  AttachmentUploadStylesType,
  AttachmentValue,
} from './types'
import useStyle from './style'
import AttachmentDraggerUpload from './internal/AttachmentDraggerUpload'
import AttachmentPictureCardUpload from './internal/AttachmentPictureCardUpload'

const AttachmentUpload = defineComponent({
  name: 'LAttachmentUpload',
  inheritAttrs: false,
  props: {
    value: [Object, Array] as PropType<AttachmentValue>,
    postFilename: {
      type: String,
      default: 'file',
    },
    autoUpload: {
      type: Boolean,
      default: false,
    },
    mode: {
      type: String as PropType<AttachmentUploadMode>,
      default: ATTACHMENT_UPLOAD_MODE.PICTURE_CARD,
    },
    promiseLimit: {
      type: Number,
      default: 3,
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
    canPreview: Function as PropType<AttachmentUploadProps['canPreview']>,
    canDelete: Function as PropType<AttachmentUploadProps['canDelete']>,
    canDownload: Function as PropType<AttachmentUploadProps['canDownload']>,
    classes: [Object, Function] as PropType<AttachmentUploadClassNamesType>,
    styles: [Object, Function] as PropType<AttachmentUploadStylesType>,
    prefixCls: String,
    rootClass: String,
  },
  emits: {
    'update:value': (_value: AttachmentValue) => true,
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
    const formItemContext = useFormItemContext()
    const fileList = ref<AttachmentFileItem[]>([])
    const syncing = ref(false)

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

    watch(
      () => props.value,
      (v) => {
        if (syncing.value) {
          return
        }
        fileList.value = normalizeAttachmentToList(v ?? undefined)
      },
      {immediate: true},
    )

    watch(
      fileList,
      (list) => {
        syncing.value = true
        emit(
          'update:value',
          denormalizeAttachmentFromList(list, props.value ?? undefined, props.maxCount),
        )
        nextTick(() => {
          syncing.value = false
        })
      },
      {deep: true},
    )

    watch(
      () => props.value,
      () => {
        formItemContext?.triggerChange()
      },
      {deep: true},
    )

    function buildExecutorOptions(): AttachmentUploadExecutorOptions {
      return {
        postFilename: props.postFilename,
        promiseLimit: props.promiseLimit,
        param: (props.uploadOptions?.param ?? {}) as Record<string, unknown>,
        headers: (props.uploadOptions?.headers ?? {}) as Record<string, string>,
      }
    }

    function getObjectWriteResult(item: AttachmentFileItem): ObjectWriteResult | undefined {
      if (isObjectWriteResult(item)) {
        return item
      }
      if (isUploadFile(item) && item.response && item.status === 'done') {
        return item.response
      }
    }

    function resolveUploadResult(
      results: AttachmentFileItem[],
    ): ObjectWriteResult | ObjectWriteResult[] | undefined {
      const mode = detectAttachmentValueMode(props.value ?? undefined, props.maxCount)
      if (mode === 'single') {
        return getObjectWriteResult(results[0] as AttachmentFileItem)
      }
      return results.map((s) => getObjectWriteResult(s)).filter((s) => s) as ObjectWriteResult[]
    }

    async function upload(): Promise<ObjectWriteResult | ObjectWriteResult[] | undefined> {
      const tree = fileList.value as AttachmentPathItem[]
      const leaves = collectAttachmentFileLeaves(tree)
      const existing = leaves.filter(
        (s) => isObjectWriteResult(s) || (isUploadFile(s) && s.response && s.status === 'done'),
      )
      const pending = leaves.filter(
        (item): item is UploadFile => isUploadFile(item) && !!item.originFileObj && !item.response,
      )

      if (pending.length === 0) {
        return resolveUploadResult(existing)
      }

      const options = buildExecutorOptions()
      const stopProgressWatch = watch(
        () => pending.map((file) => [file.percent, file.status]),
        () => applyAttachmentDirectoryProgress(tree),
        {flush: 'sync'},
      )
      try {
        await Promise.all(
          pending.map(
            async (file) =>
              (file.response = await uploadAttachmentFile(file, props.bucket, options)),
          ),
        )
      } finally {
        stopProgressWatch()
        applyAttachmentDirectoryProgress(tree)
      }

      const hasDirectory = tree.some((item) => item.type === 'directory')
      if (!hasDirectory) {
        const results = leaves
          .map((item) => {
            if (isObjectWriteResult(item)) {
              return item
            }
            if (isUploadFile(item) && item.response) {
              return item.response
            }
            return null
          })
          .filter((item): item is ObjectWriteResult => item !== null)

        syncing.value = true
        fileList.value = results
        emit(
          'update:value',
          denormalizeAttachmentFromList(results, props.value ?? undefined, props.maxCount),
        )
        await nextTick()
        syncing.value = false
        return resolveUploadResult(results)
      }

      const results = leaves
        .map((item) => getObjectWriteResult(item))
        .filter((item): item is ObjectWriteResult => item !== undefined)

      return resolveUploadResult(results)
    }

    function getFiles(): AttachmentFileItem[] {
      return collectAttachmentFileLeaves(fileList.value as AttachmentPathItem[])
    }

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
      const sharedSlots = {
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
      }

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
              maxCount={props.maxCount}
              multiple={props.multiple}
              accept={props.accept}
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
              showFilename={props.showFilename}
              classes={mergedClasses.value}
              styles={mergedStyles.value}
              mode={props.previewMode || ATTACHMENT_PREVIEW_MODE.PICTURE_CARD}
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

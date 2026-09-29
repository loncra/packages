import {computed, defineComponent, h, type PropType, type Ref, useModel} from 'vue'
import type {UploadChangeParam} from 'antdv-next'
import {Space, TypographyText, TypographyTitle, UploadDragger} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {UploadOutlined} from '@antdv-next/icons'
import {classNames} from '@loncra/antdv'
import type {ObjectWriteResult} from '@loncra/client/resource'
import type {UploadFile} from 'antdv-next/dist/upload/interface'
import {useLocale} from '../../_util/useLocale'
import {ATTACHMENT_PREVIEW_MODE} from '../constants'
import type {
  AttachmentDraggerUploadProps,
  AttachmentFileItem,
  AttachmentPreviewMode,
  AttachmentUploadResolvedClassNames,
  AttachmentUploadResolvedStyles,
} from '../types'
import useStyle from '../style'
import AttachmentPreview from '../preview/AttachmentPreview'
import {useAttachmentUploadFiles} from './useAttachmentUploadFiles'

const AttachmentDraggerUpload = defineComponent({
  name: 'LAttachmentDraggerUpload',
  inheritAttrs: false,
  props: {
    fileList: {
      type: Array as PropType<AttachmentFileItem[]>,
      default: () => [],
    },
    mode: {
      type: String as PropType<AttachmentPreviewMode>,
      default: ATTACHMENT_PREVIEW_MODE.LIST,
    },
    preview: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    changeThumbUrl: {
      type: Boolean,
      default: true,
    },
    multiple: Boolean,
    accept: String,
    maxCount: Number,
    canPreview: Function as PropType<AttachmentDraggerUploadProps['canPreview']>,
    canDelete: Function as PropType<AttachmentDraggerUploadProps['canDelete']>,
    canDownload: Function as PropType<AttachmentDraggerUploadProps['canDownload']>,
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
    const locale = useLocale('AttachmentUpload')
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

    /**
     * ⚠️ 与 picture-card 那半**有意不同**：dragger 模式 pro 没有自己的 wrapper（`-trigger` 那层只存在于
     * picture-card）⇒ 语义键 `trigger` 这里**转给 antd `UploadDragger`** —— 宿主看到的那块大拖拽区就是它，
     * 落点一致。picture-card 那半则挂在 pro 自己的虚线框上（见那边的注释 + `types.ts` 的键说明）。
     */
    const uploadClasses = computed(() => ({
      trigger: props.classes?.trigger,
    }))
    const uploadStyles = computed(() => ({
      trigger: props.styles?.trigger,
    }))

    return () => {
      const {class: _attrClass, style: _attrStyle, ...rest} = attrs
      const hashed = (...names: (string | undefined)[]) =>
        classNames(hashId.value, cssVarCls.value, ...names)
      const showTrigger =
        !props.maxCount || uploadFiles.value.length < props.maxCount || props.preview

      return (
        <AttachmentPreview
          fileList={uploadFiles.value}
          onUpdate:fileList={(list) => {
            uploadFiles.value = list
          }}
          changeThumbUrl={props.changeThumbUrl}
          classes={props.classes}
          styles={props.styles}
          preview={props.preview}
          mode={props.mode}
          canPreview={props.canPreview}
          canDelete={props.canDelete}
          canDownload={props.canDownload}
          prefixCls={prefixCls.value}
          onRemove={(file) => emit('remove', file)}
          v-slots={{
            listBefore: showTrigger
              ? () =>
                  !props.preview && !props.disabled ? (
                    <UploadDragger
                      {...rest}
                      {...({
                        classes: uploadClasses.value,
                        styles: uploadStyles.value,
                        maxCount: props.maxCount,
                        multiple: props.multiple,
                        accept: props.accept,
                        fileList: antdFileList.value,
                        beforeUpload: () => false,
                        showUploadList: false,
                        onChange,
                      } as Record<string, unknown>)}
                    >
                      <Space orientation="vertical">
                        <TypographyTitle
                          level={2}
                          class={hashed(`${prefixCls.value}-dragger-title`)}
                        >
                          {h(UploadOutlined)}
                        </TypographyTitle>
                        <TypographyTitle
                          level={5}
                          class={hashed(`${prefixCls.value}-dragger-title`)}
                        >
                          {locale.value.draggerTitle}
                        </TypographyTitle>
                        <TypographyText type="secondary">
                          {locale.value.draggerSubTitle
                            .replace('{maxCount}', String(props.maxCount ?? ''))
                            .replace('{count}', String(uploadFiles.value.length))}
                        </TypographyText>
                      </Space>
                    </UploadDragger>
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

export default AttachmentDraggerUpload

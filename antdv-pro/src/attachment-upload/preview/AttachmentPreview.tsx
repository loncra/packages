import {computed, defineComponent, type PropType, type Ref, ref} from 'vue'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames, useTwoWayModel} from '@loncra/antdv'
import type {ObjectWriteResult} from '@loncra/client/resource'
import type {UploadFile} from 'antdv-next/dist/upload/interface'
import {useLocale} from '../../_util/useLocale'
import {ATTACHMENT_PREVIEW_MODE} from '../constants'
import type {
    AttachmentPreviewMode,
    AttachmentPreviewProps,
    AttachmentUploadResolvedClassNames,
    AttachmentUploadResolvedStyles,
} from '../types'
import useStyle from '../style'
import {isImageFile, isVideoFile} from '../attachmentKinds'
import {useAttachmentFileActions} from './useAttachmentFileActions'
import {useAttachmentThumbs} from './useAttachmentThumbs'
import AttachmentListPreview from './AttachmentListPreview'
import AttachmentCardPreview from './AttachmentCardPreview'
import AttachmentPreviewOverlays from './AttachmentPreviewOverlays'

function defaultCanDelete() {
  return true
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
    const config = useConfig()
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

    const fileList = useTwoWayModel(props, 'fileList', emit) as unknown as Ref<
      UploadFile<ObjectWriteResult>[]
    >

    const imageFiles = computed(() => (fileList.value ?? []).filter(isImageFile))

    const itemClass = computed(() =>
      classNames(
        props.classes?.item,
        props.mode === ATTACHMENT_PREVIEW_MODE.PICTURE_CARD
          ? `${prefixCls.value}-item-lg`
          : `${prefixCls.value}-item-sm`,
      ),
    )

    function postRemove(file: UploadFile<ObjectWriteResult>) {
      fileList.value = (fileList.value ?? []).filter((f) => f.uid !== file.uid)
      emit('remove', file)
    }

    const {download, remove} = useAttachmentFileActions({postRemove})

    function openPreview(file: UploadFile<ObjectWriteResult>) {
      if (file.type?.includes('image/')) {
        const index = imageFiles.value.findIndex((f) => f.uid === file.uid)
        if (index === -1) {
          return
        }
        previewImageGroup.value.current = index
        previewImageGroup.value.open = true
      } else if (isVideoFile(file)) {
        modalOptions.value = {open: true, file}
      }
    }

    useAttachmentThumbs({fileList, enabled: () => props.changeThumbUrl})

    function renderPanels() {
      const files = fileList.value ?? []
      const panelProps = {
        files,
        preview: props.preview,
        disabled: props.disabled,
        itemClass: itemClass.value,
        itemStyle: props.styles?.item as never,
        prefixCls: prefixCls.value,
        hashId: hashId.value,
        cssVarCls: cssVarCls.value,
      }
      if (props.mode === ATTACHMENT_PREVIEW_MODE.LIST) {
        return (
          <AttachmentListPreview
            {...panelProps}
            listClass={classNames(`${prefixCls.value}-list`, props.classes?.list)}
            listStyle={props.styles?.list as never}
            onPreview={openPreview}
            onRemove={remove}
            onDownload={download}
            v-slots={{
              listBefore: slots.listBefore,
              itemRender: slots.itemRender,
              itemIcon: slots.itemIcon,
            }}
          />
        )
      }
      if (props.mode === ATTACHMENT_PREVIEW_MODE.PICTURE_CARD) {
        return (
          <AttachmentCardPreview
            {...panelProps}
            showFilename={props.showFilename}
            listClass={classNames(`${prefixCls.value}-list-cards`, props.classes?.list)}
            listStyle={props.styles?.list as never}
            metaClass={props.classes?.meta}
            canDelete={props.canDelete}
            canPreview={props.canPreview}
            canDownload={props.canDownload}
            onPreview={openPreview}
            onPostRemove={postRemove}
            v-slots={{
              itemRender: slots.itemRender,
              itemIcon: slots.itemIcon,
              itemTitle: slots.itemTitle,
              itemDescription: slots.itemDescription,
              pictureCardAfter: slots.pictureCardAfter,
            }}
          />
        )
      }
      return null
    }

    return () => {
      const hashed = (name?: string) => classNames(hashId.value, cssVarCls.value, name)

      return (
        <span class={hashed(props.classes?.container)} style={props.styles?.container}>
          {renderPanels()}
          <AttachmentPreviewOverlays
            imageFiles={imageFiles.value}
            group={previewImageGroup.value}
            modal={modalOptions.value}
            prefixCls={prefixCls.value}
            hashId={hashId.value}
            cssVarCls={cssVarCls.value}
            videoUnsupportedText={locale.value.videoUnsupported}
            onGroupOpenChange={(open) => {
              previewImageGroup.value.open = open
            }}
            onGroupCurrentChange={(cur) => {
              previewImageGroup.value.current = cur
            }}
            onModalUpdate={(open) => {
              modalOptions.value = {...modalOptions.value, open}
            }}
          />
        </span>
      )
    }
  },
})

export default AttachmentPreview

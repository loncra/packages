import {ref, type Ref} from 'vue'
import type {UploadChangeParam, UploadFile} from 'antdv-next'
import {uploadFile} from '@loncra/antdv-pro'
import {isBusinessSuccess} from '@loncra/client/commons'
import {AttachmentService} from '@loncra/client/resource'
import type {FileViewExpose} from '../file-view'
import {validateFileOrFolderName} from './_util/validateName'
import {readExtra} from './useAttachmentSource'
import type {FileEditorNode} from './types'
import type {AttachmentFileEditorLocale} from '../locale'

function renamedObjectName(objectName: string, name: string): string | undefined {
  const splits = objectName.split('/')
  if (splits.length === 0) {
    return undefined
  }
  splits[splits.length - 1] = name
  return splits.join('/')
}

export function useAttachmentWrite(options: {
  bucket: () => string
  path: () => string
  locale: () => AttachmentFileEditorLocale
  message: {
    error: (content: string) => void
    warning: (content: string) => void
    success: (content: string) => void
  }
  confirm: (options: {title: string; content: string; onOk: () => void}) => void
  view: Ref<FileViewExpose | undefined>
}) {
  const fileUploadTrigger = ref<HTMLElement>()
  const dirUploadTrigger = ref<HTMLElement>()
  const uploadTarget = ref<FileEditorNode>()
  const session = ref(0)
  const loading = ref(false)

  function openUpload(directory: boolean, item?: FileEditorNode) {
    const trigger = directory ? dirUploadTrigger.value : fileUploadTrigger.value
    if ((item && !item.dir) || !trigger) {
      return
    }
    uploadTarget.value = item
    trigger.click()
  }

  async function onUploadChange(info: UploadChangeParam) {
    const target = uploadTarget.value
    const files = info.fileList.filter((file): file is UploadFile => !!file.originFileObj)
    if ((target && !target.dir) || files.length === 0 || loading.value) {
      return
    }
    loading.value = true
    try {
      await Promise.all(files.map((file) => uploadFile(file, options.bucket(), {
        postFilename: 'file',
        promiseLimit: 3,
        param: {
          prefix: target ? readExtra(target).objectName : options.path(),
          randomName: false,
        },
      })))
      await options.view.value?.reload(target ?? null)
    } catch (error) {
      options.message.error(error instanceof Error ? error.message : String(error))
    } finally {
      loading.value = false
      uploadTarget.value = undefined
      session.value += 1
    }
  }

  function beginRename(node: FileEditorNode) {
    node.editing = true
    node.editName = node.name
  }

  function cancelRename(node: FileEditorNode) {
    node.editing = false
  }

  async function commitRename(node: FileEditorNode) {
    const name = node.editName?.trim() ?? ''
    const error = validateFileOrFolderName(name, options.locale())
    if (error) {
      options.message.warning(error)
      return
    }
    const extra = readExtra(node)
    const newObjectName = renamedObjectName(extra.objectName, name)
    if (!newObjectName) {
      return
    }
    try {
      const result = await AttachmentService.moveAttachment({
        source: {bucketName: options.bucket(), objectName: extra.objectName},
        target: {bucketName: options.bucket(), objectName: newObjectName},
      })
      if (isBusinessSuccess(result) && result.data) {
        node.name = name
        node.extra = {
          ...extra,
          objectName: newObjectName,
          etag: result.data.etag,
          userMetadata: {
            ...(extra.userMetadata || {}),
            ...(node.dir ? {'X-Amz-Meta-Original-Filename': name} : {}),
          },
        }
        node.editing = false
      }
    } catch (error) {
      options.message.error(error instanceof Error ? error.message : String(error))
    }
  }

  function removeNode(node: FileEditorNode) {
    options.confirm({
      title: options.locale().deleteConfirmTitle,
      content: options.locale().deleteConfirmSingle,
      onOk: () => {
        const extra = readExtra(node)
        void AttachmentService.removeAttachment([
          {bucketName: options.bucket(), objectName: extra.objectName},
        ]).then(async (result) => {
          options.message.success(result.message)
          await options.view.value?.reload(null)
          options.view.value?.closeTabs((item) => {
            if (item.id === node.id) {
              return true
            }
            const itemName = (item.extra as {objectName?: string} | undefined)?.objectName
            return !!node.dir && !!itemName && itemName.startsWith(extra.objectName)
          })
        }).catch((error: unknown) => {
          options.message.error(error instanceof Error ? error.message : String(error))
        })
      },
    })
  }

  return {
    fileUploadTrigger,
    dirUploadTrigger,
    session,
    openUpload,
    onUploadChange,
    beginRename,
    cancelRename,
    commitRename,
    removeNode,
  }
}

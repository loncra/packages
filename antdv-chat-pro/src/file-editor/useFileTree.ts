import {type Ref} from 'vue'
import {
  filterTreeDeep,
  findFirstTreeNode,
  isBusinessSuccess,
  type RestResult,
  unmergeTree,
} from '@loncra/client/commons'
import type {ObjectItemInfo, ObjectWriteResult} from '@loncra/client/resource'
import {AttachmentService} from '@loncra/client/resource'
import {resolveDisplayName} from '@loncra/antdv-pro'
import {useLocale} from '../_util/useLocale'
import {validateFileOrFolderName} from './_util/validateName'
import type {EditObjectItemInfo, FileEditorState} from './types'

export interface FileTreeDeps {
  state: Ref<FileEditorState>
  getBucket: () => string
  getPath: () => string
  message: {
    error: (content: string) => void
    warning: (content: string) => void
    success: (content: string) => void
  }
  onItemRemoved: (item: ObjectItemInfo) => void
}

export function useFileTree(deps: FileTreeDeps) {
  const locale = useLocale('FileEditor')

  function toEditObjectItemInfo(item: ObjectItemInfo, replacePath: string) {
    const edit = item as EditObjectItemInfo
    if (edit.dir) {
      edit.userMetadata = {}
      edit.userMetadata['X-Amz-Meta-Original-Filename'] = item.objectName
        .replaceAll(replacePath, '')
        .replaceAll('/', '')
    }
    edit.key = item.id
    return edit
  }

  async function loadDataSource(bucket: string, path: string) {
    try {
      deps.state.value.loading = true
      const result: RestResult<ObjectItemInfo[]> = await AttachmentService.findAttachment(
        bucket,
        path,
      )
      deps.state.value.dataSource = (result.data || []).map((c) => toEditObjectItemInfo(c, path))
    } finally {
      deps.state.value.loading = false
    }
  }

  function renameItem(item: ObjectItemInfo) {
    deps.state.value.currentEditItem = item as EditObjectItemInfo
    deps.state.value.currentEditItem.editing = true
    deps.state.value.currentEditItem.editName = resolveDisplayName(item)
  }

  function reloadChildren(item: ObjectItemInfo) {
    deps.state.value.openKeys = deps.state.value.openKeys.filter((k) => k !== item.id)
    delete item.children
    return loadChildren(item)
  }

  function doDelete(item: ObjectItemInfo) {
    deps.state.value.loading = true
    return AttachmentService.removeAttachment([
      {bucketName: deps.getBucket(), objectName: item.objectName},
    ])
      .then((result: RestResult<void>) => {
        deps.message.success(result.message)
        deps.state.value.dataSource = filterTreeDeep(
          (p) => p.id !== item.id,
          deps.state.value.dataSource,
        )
        deps.onItemRemoved(item)
      })
      .catch((e: unknown) => {
        deps.message.error(e instanceof Error ? e.message : String(e))
      })
      .finally(() => {
        deps.state.value.loading = false
      })
  }

  async function fetchChildren(item: ObjectItemInfo) {
    if (item.children !== undefined) {
      return
    }
    try {
      item.loading = true
      const result: RestResult<ObjectItemInfo[]> = await AttachmentService.findAttachment(
        deps.getBucket(),
        item.objectName,
      )
      const data = result.data || []
      item.children = data.map((c) => toEditObjectItemInfo(c, item.objectName))
      if (!deps.state.value.openKeys.includes(item.id)) {
        deps.state.value.openKeys = [...deps.state.value.openKeys, item.id]
      }
    } finally {
      item.loading = false
    }
  }

  async function loadChildren(item: ObjectItemInfo) {
    if (deps.state.value.openKeys.includes(item.id)) {
      deps.state.value.openKeys = deps.state.value.openKeys.filter((k) => k !== item.id)
    } else {
      deps.state.value.openKeys = [...deps.state.value.openKeys, item.id]
    }
    await fetchChildren(item)
  }

  function setOpenKeys(keys: string[]) {
    const added = keys.filter((key) => !deps.state.value.openKeys.includes(key))
    deps.state.value.openKeys = keys
    for (const key of added) {
      const item = findFirstTreeNode((p) => p.id === key, deps.state.value.dataSource)
      if (item?.dir) {
        void fetchChildren(item)
      }
    }
  }

  async function confirmEdit(item: EditObjectItemInfo) {
    const name = item.editName?.trim() ?? ''
    const error = validateFileOrFolderName(name, locale.value)
    if (error) {
      return deps.message.warning(error)
    }
    const splits = item.objectName.split('/')
    if (splits.length === 0) {
      return
    }
    splits[splits.length - 1] = item.editName
    const newObjectName = splits.join('/')
    try {
      deps.state.value.loading = true
      const result: RestResult<ObjectWriteResult> = await AttachmentService.moveAttachment({
        source: {bucketName: deps.getBucket(), objectName: item.objectName},
        target: {bucketName: deps.getBucket(), objectName: newObjectName},
      })
      if (isBusinessSuccess(result) && result.data) {
        const exist = findFirstTreeNode((p) => p.id === item.id, deps.state.value.dataSource)
        if (exist) {
          exist.objectName = newObjectName
          exist.etag = result.data.etag
          exist.lastModified = result.data.lastModified
          exist.size = result.data.size
          exist.userMetadata = result.data.extraHeaders || {}
          if (exist.dir) {
            exist.userMetadata['X-Amz-Meta-Original-Filename'] = item.editName
          }
        }
        deps.state.value.currentEditItem = undefined
      }
    } catch (e) {
      deps.message.error(e instanceof Error ? e.message : String(e))
    } finally {
      deps.state.value.loading = false
    }
  }

  function onSelectOpenFile(item: ObjectItemInfo) {
    const paths = filterTreeDeep((p) => p.id === item.id, deps.state.value.dataSource)
    const parents = unmergeTree(paths)
      .filter((p) => p.dir)
      .map((p) => p.id)
    deps.state.value.openKeys = [...deps.state.value.openKeys, ...parents]
  }

  return {
    loadDataSource,
    renameItem,
    reloadChildren,
    doDelete,
    loadChildren,
    setOpenKeys,
    confirmEdit,
    onSelectOpenFile,
  }
}

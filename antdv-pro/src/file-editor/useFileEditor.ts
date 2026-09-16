import {computed, h, onMounted, reactive, ref, watch} from 'vue'
import type {MenuItemType, UploadChangeParam} from 'antdv-next'
import useApp from 'antdv-next/dist/app/useApp'
import {DeleteOutlined, FileAddOutlined, FolderAddOutlined, FormOutlined, ReloadOutlined} from '@antdv-next/icons'
import {HTTP_SUCCESS_EXECUTE_CODES, type RestResult} from '@loncra/client/commons'
import type {ObjectItemInfo, ObjectWriteResult} from '@loncra/client/resource'
import {AttachmentService} from '@loncra/client/resource'
import type {UploadFile} from 'antdv-next/dist/upload/interface'
import {uploadFile} from '../_util/uploadFile'
import {useLocale} from '../_util/useLocale'
import {filterTreeDeep, findFirstTreeNode, unmergeTree} from './_util/tree'
import {validateFileOrFolderName} from './_util/validateName'
import type {EditObjectItemInfo, FileEditorProps} from './types'

function isBusinessSuccess<T>(result: RestResult<T>): boolean {
  return (
    result.status === 200 &&
    (HTTP_SUCCESS_EXECUTE_CODES as readonly string[]).includes(result.executeCode)
  )
}

export function useFileEditor(props: FileEditorProps) {
  const locale = useLocale('FileEditor')
  const {modal, message} = useApp()

  const state = ref<{
    openKeys: string[]
    selectedItem?: ObjectItemInfo
    tabs: ObjectItemInfo[]
    currentEditItem?: EditObjectItemInfo
    dataSource: ObjectItemInfo[]
    loading: boolean
    upload: {
      session: number
      directory: boolean
    }
  }>({
    loading: true,
    openKeys: [],
    tabs: [],
    dataSource: [],
    upload: {
      session: 0,
      directory: false,
    },
  })

  const fileUploadTrigger = ref<HTMLElement>()
  const dirUploadTrigger = ref<HTMLElement>()
  const uploadTarget = ref<ObjectItemInfo>()

  function resolveIcon(item: ObjectItemInfo): string {
    if (item.dir) {
      return state.value.openKeys.includes(item.id) ? 'loncra-folder-open' : 'loncra-folder-closed'
    }
    return props.getIcon?.(item) ?? 'loncra-file'
  }

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

  function getDisplayName(item: ObjectItemInfo) {
    return (
      item.userMetadata?.['X-Amz-Meta-Original-Filename'] ||
      item.objectName.replace(/\/$/, '').split('/').pop() ||
      item.objectName
    )
  }

  async function loadDataSource(bucket: string, path: string) {
    try {
      state.value.loading = true
      const result: RestResult<ObjectItemInfo[]> = await AttachmentService.findAttachment(
        bucket,
        path,
      )
      state.value.dataSource = (result.data || []).map((c) => toEditObjectItemInfo(c, path))
    } finally {
      state.value.loading = false
    }
  }

  function renameItem(item: ObjectItemInfo) {
    state.value.currentEditItem = item as EditObjectItemInfo
    state.value.currentEditItem.editing = true
    state.value.currentEditItem.editName = getDisplayName(item)
  }

  async function onOperationMenuClick(menuItem: {key: string | number}, item: ObjectItemInfo) {
    if (menuItem.key === 'rename') {
      renameItem(item)
    } else if (menuItem.key === 'delete' && item) {
      modal.confirm({
        title: locale.value.deleteConfirmTitle,
        content: locale.value.deleteConfirmSingle,
        onOk: () => doDelete(item),
      })
    } else if (menuItem.key === 'refresh') {
      await reloadChildren(item)
    } else if (menuItem.key === 'uploadFile') {
      openUpload(false, item)
    } else if (menuItem.key === 'uploadDirectory') {
      openUpload(true, item)
    }
  }

  async function reloadChildren(item: ObjectItemInfo) {
    state.value.openKeys = state.value.openKeys.filter((k) => k !== item.id)
    delete item.children
    await loadChildren(item)
  }

  function openUpload(directory: boolean, item?: ObjectItemInfo) {
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
    if ((target && !target.dir) || files.length === 0 || state.value.loading) {
      return
    }
    state.value.loading = true
    try {
      await Promise.all(
        files.map((file) =>
          uploadFile(file, props.bucket, {
            postFilename: 'file',
            promiseLimit: 3,
            param: {
              prefix: target?.objectName || props.path,
              randomName: false,
            },
          }),
        ),
      )
      if (target) {
        await reloadChildren(target)
      } else {
        await loadDataSource(props.bucket, props.path)
      }
    } catch (e) {
      message.error(e instanceof Error ? e.message : String(e))
    } finally {
      state.value.loading = false
      uploadTarget.value = undefined
      state.value.upload.session++
    }
  }

  async function doDelete(item: ObjectItemInfo) {
    try {
      state.value.loading = true
      const result: RestResult<void> = await AttachmentService.removeAttachment([
        {bucketName: props.bucket, objectName: item.objectName},
      ])
      message.success(result.message)
      state.value.dataSource = filterTreeDeep((p) => p.id !== item.id, state.value.dataSource)
      closeTabsForRemoved(item)
    } catch (e) {
      message.error(e instanceof Error ? e.message : String(e))
    } finally {
      state.value.loading = false
    }
  }

  function createMenu(item: ObjectItemInfo) {
    const menu = {
      items: [] as MenuItemType[],
      onClick: (menuItem: {key: string | number}) => {
        void onOperationMenuClick(menuItem, item)
      },
    }
    if (item.dir) {
      menu.items.push(
        {
          label: locale.value.refresh,
          key: 'refresh',
          icon: () => h(ReloadOutlined),
        },
        {
          label: locale.value.uploadFile,
          key: 'uploadFile',
          icon: () => h(FileAddOutlined),
        },
        {
          label: locale.value.uploadDirectory,
          key: 'uploadDirectory',
          icon: () => h(FolderAddOutlined),
        },
      )
    }
    menu.items.push(
      {
        label: locale.value.rename,
        key: 'rename',
        icon: () => h(FormOutlined),
      },
      {
        type: 'divider' as const,
      },
      {
        label: locale.value.delete,
        key: 'delete',
        danger: true,
        icon: () => h(DeleteOutlined),
      },
    )
    return menu
  }

  function openTab(item: ObjectItemInfo) {
    if (item.dir) {
      return
    }
    if (!state.value.tabs.some((t) => t.id === item.id)) {
      state.value.tabs = [...state.value.tabs, item]
    }
    state.value.selectedItem = item
  }

  function activateTab(id: string) {
    const found = state.value.tabs.find((t) => t.id === id)
    if (found) {
      state.value.selectedItem = found
    }
  }

  function closeTab(id: string) {
    const list = state.value.tabs
    const i = list.findIndex((t) => t.id === id)
    if (i === -1) {
      return
    }
    const next = list[i + 1] ?? list[i - 1]
    state.value.tabs = list.filter((t) => t.id !== id)
    state.value.selectedItem = next
    dropPane(id)
  }

  function closeTabsForRemoved(item: ObjectItemInfo) {
    const remaining = state.value.tabs.filter((t) => {
      if (t.id === item.id) {
        return false
      }
      return !(item.dir && t.objectName.startsWith(item.objectName))
    })
    const removed = state.value.tabs.filter((t) => !remaining.some((r) => r.id === t.id))
    const activeGone = !remaining.some((t) => t.id === state.value.selectedItem?.id)
    state.value.tabs = remaining
    if (activeGone) {
      state.value.selectedItem = remaining[remaining.length - 1]
    }
    removed.forEach((t) => dropPane(t.id))
  }

  function clearTabs() {
    state.value.tabs = []
    state.value.selectedItem = undefined
    paneSaves.clear()
    paneHostRefs.clear()
    for (const key of Object.keys(tabMeta)) {
      delete tabMeta[key]
    }
  }

  const tabMeta = reactive<Record<string, {dirty: boolean; mode: string}>>({})
  const paneSaves = new Map<string, () => Promise<void>>()
  const paneHostRefs = new Map<string, (el: unknown) => void>()

  function setTabMeta(key: string, next: {dirty: boolean; mode: string}) {
    const current = tabMeta[key]
    if (current?.dirty === next.dirty && current.mode === next.mode) {
      return
    }
    tabMeta[key] = next
  }

  function dropPane(key: string) {
    paneSaves.delete(key)
    paneHostRefs.delete(key)
    delete tabMeta[key]
  }

  function onPaneDirtyChange(key: string, dirty: boolean) {
    setTabMeta(key, {dirty, mode: tabMeta[key]?.mode ?? 'view'})
  }

  function bindPaneHost(key: string, el: unknown) {
    const host = el as {
      save: () => Promise<void>
      kind: {id: string; mode: string}
    } | null
    if (!host) {
      paneSaves.delete(key)
      return
    }
    paneSaves.set(key, host.save)
    setTabMeta(key, {
      dirty: tabMeta[key]?.dirty ?? false,
      mode: host.kind.mode,
    })
  }

  function paneHostRef(key: string) {
    let fn = paneHostRefs.get(key)
    if (!fn) {
      fn = (el) => bindPaneHost(key, el)
      paneHostRefs.set(key, fn)
    }
    return fn
  }

  function onCloseTab(key: string) {
    if (tabMeta[key]?.dirty) {
      modal.confirm({
        content: locale.value.unsavedConfirm,
        onOk: () => closeTab(key),
      })
      return
    }
    closeTab(key)
  }

  function saveActive() {
    const id = state.value.selectedItem?.id
    if (!id) {
      return
    }
    void paneSaves.get(id)?.()
  }

  const activeCanSave = computed(() => {
    const id = state.value.selectedItem?.id
    if (!id || props.readonly) {
      return false
    }
    const meta = tabMeta[id]
    return meta?.mode === 'edit' && meta.dirty
  })

  async function onMenuClick(item: EditObjectItemInfo) {
    if (item.dir) {
      await loadChildren(item)
      return
    }
    openTab(item)
  }

  function cancelEdit(_item: EditObjectItemInfo) {
    state.value.currentEditItem = undefined
  }

  async function confirmEdit(item: EditObjectItemInfo) {
    const name = item.editName?.trim() ?? ''
    const error = validateFileOrFolderName(name, locale.value)
    if (error) {
      return message.warning(error)
    }
    const splits = item.objectName.split('/')
    if (splits.length == 0) {
      return
    }
    splits[splits.length - 1] = item.editName
    const newObjectName = splits.join('/')
    try {
      state.value.loading = true
      const result: RestResult<ObjectWriteResult> = await AttachmentService.moveAttachment({
        source: {bucketName: props.bucket, objectName: item.objectName},
        target: {bucketName: props.bucket, objectName: newObjectName},
      })
      if (isBusinessSuccess(result) && result.data) {
        const exist = findFirstTreeNode((p) => p.id === item.id, state.value.dataSource)
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
        state.value.currentEditItem = undefined
      }
    } catch (e) {
      message.error(e instanceof Error ? e.message : String(e))
    } finally {
      state.value.loading = false
    }
  }

  async function loadChildren(item: ObjectItemInfo) {
    if (state.value.openKeys.includes(item.id)) {
      state.value.openKeys = state.value.openKeys.filter((k) => k !== item.id)
    } else {
      state.value.openKeys = [...state.value.openKeys, item.id]
    }

    if (item.children !== undefined) {
      return
    }

    try {
      item.loading = true
      const result: RestResult<ObjectItemInfo[]> = await AttachmentService.findAttachment(
        props.bucket,
        item.objectName,
      )
      const data = result.data || []
      item.children = data.map((c) => toEditObjectItemInfo(c, item.objectName))
      state.value.openKeys = [...state.value.openKeys, item.id]
    } finally {
      item.loading = false
    }
  }

  async function onRefresh() {
    state.value.openKeys = []
    clearTabs()
    await loadDataSource(props.bucket, props.path)
  }

  function onSelectOpenFile(item: ObjectItemInfo) {
    const paths = filterTreeDeep((p) => p.id === item.id, state.value.dataSource)
    const parents = unmergeTree(paths)
      .filter((p) => p.dir)
      .map((p) => p.id)
    state.value.openKeys = [...state.value.openKeys, ...parents]
  }

  function onDownloadFile(item: ObjectItemInfo) {
    AttachmentService.download(props.bucket, item.objectName)
  }

  const tabItems = computed(() =>
    state.value.tabs.map((file) => ({
      key: file.id,
      label: getDisplayName(file),
      iconType: resolveIcon(file),
      file,
    })),
  )

  watch(
    () => [props.path, props.bucket],
    () => {
      clearTabs()
      void loadDataSource(props.bucket, props.path)
    },
  )

  onMounted(() => {
    void loadDataSource(props.bucket, props.path)
  })

  return {
    locale,
    resolveIcon,
    fileUploadTrigger,
    dirUploadTrigger,
    createMenu,
    onMenuClick,
    activateTab,
    closeTab,
    onRefresh,
    cancelEdit,
    confirmEdit,
    onSelectOpenFile,
    onDownloadFile,
    onUploadChange,
    tabItems,
    tabMeta,
    onPaneDirtyChange,
    paneHostRef,
    onCloseTab,
    saveActive,
    activeCanSave,
    onRootUpload: (directory: boolean) => openUpload(directory, undefined),
    getDisplayName,
    state,
  }
}

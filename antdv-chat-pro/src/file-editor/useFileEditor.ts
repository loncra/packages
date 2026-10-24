import {h, onMounted, ref, watch, type VNodeChild} from 'vue'
import type {MenuItemType} from 'antdv-next'
import useApp from 'antdv-next/dist/app/useApp'
import {
    DeleteOutlined,
    FileAddOutlined,
    FileOutlined,
    FolderAddOutlined,
    FolderOpenOutlined,
    FolderOutlined,
    FormOutlined,
    ReloadOutlined,
} from '@antdv-next/icons'
import type {ObjectItemInfo} from '@loncra/client/resource'
import {AttachmentService} from '@loncra/client/resource'
import {resolveDisplayName} from '@loncra/antdv-pro'
import {useLocale} from '../_util/useLocale'
import type {EditObjectItemInfo, FileEditorProps, FileEditorState} from './types'
import {useFileTabs} from './useFileTabs'
import {useFileTree} from './useFileTree'
import {useFileUpload} from './useFileUpload'

export function useFileEditor(props: FileEditorProps) {
  const locale = useLocale('FileEditor')
  const {modal, message} = useApp()

  const state = ref<FileEditorState>({
    loading: true,
    openKeys: [],
    tabs: [],
    dataSource: [],
    upload: {
      session: 0,
      directory: false,
    },
  })

  const tabs = useFileTabs({state, modal})
  const tree = useFileTree({
    state,
    getBucket: () => props.bucket,
    getPath: () => props.path,
    message,
    onItemRemoved: (item) => tabs.closeTabsForRemoved(item),
  })
  const upload = useFileUpload({
    state,
    getBucket: () => props.bucket,
    getPath: () => props.path,
    message,
    onUploaded: async (target) => {
      if (target) {
        await tree.reloadChildren(target)
      } else {
        await tree.loadDataSource(props.bucket, props.path)
      }
    },
  })

  function resolveIcon(item: ObjectItemInfo): VNodeChild {
    if (item.dir) {
      return h(state.value.openKeys.includes(item.id) ? FolderOpenOutlined : FolderOutlined)
    }
    return props.getIcon?.(item) ?? h(FileOutlined)
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

  async function onOperationMenuClick(menuItem: {key: string | number}, item: ObjectItemInfo) {
    if (menuItem.key === 'rename') {
      tree.renameItem(item)
    } else if (menuItem.key === 'delete' && item) {
      modal.confirm({
        title: locale.value.deleteConfirmTitle,
        content: locale.value.deleteConfirmSingle,
        onOk: () => void tree.doDelete(item),
      })
    } else if (menuItem.key === 'refresh') {
      await tree.reloadChildren(item)
    } else if (menuItem.key === 'uploadFile') {
      upload.openUpload(false, item)
    } else if (menuItem.key === 'uploadDirectory') {
      upload.openUpload(true, item)
    }
  }

  function onMenuClick(item: EditObjectItemInfo) {
    if (item.dir) {
      void tree.loadChildren(item)
      return
    }
    tabs.openTab(item)
  }

  function cancelEdit(_item?: EditObjectItemInfo) {
    state.value.currentEditItem = undefined
  }

  async function onRefresh() {
    state.value.openKeys = []
    tabs.clearTabs()
    await tree.loadDataSource(props.bucket, props.path)
  }

  function onDownloadFile(item: ObjectItemInfo) {
    AttachmentService.download(props.bucket, item.objectName)
  }

  const tabItems = tabs.tabItems

  watch(
    () => [props.path, props.bucket],
    () => {
      tabs.clearTabs()
      void tree.loadDataSource(props.bucket, props.path)
    },
  )

  onMounted(() => {
    void tree.loadDataSource(props.bucket, props.path)
  })

  return {
    locale,
    state,
    resolveIcon,
    getDisplayName: resolveDisplayName,
    fileUploadTrigger: upload.fileUploadTrigger,
    dirUploadTrigger: upload.dirUploadTrigger,
    createMenu,
    setOpenKeys: tree.setOpenKeys,
    onMenuClick,
    activateTab: tabs.activateTab,
    closeTab: tabs.closeTab,
    onRefresh,
    cancelEdit,
    confirmEdit: tree.confirmEdit,
    onSelectOpenFile: tree.onSelectOpenFile,
    onDownloadFile,
    onUploadChange: upload.onUploadChange,
    tabItems,
    tabMeta: tabs.tabMeta,
    onPaneDirtyChange: tabs.onPaneDirtyChange,
    paneHostRef: tabs.paneHostRef,
    onCloseTab: tabs.onCloseTab,
    saveActive: tabs.saveActive,
    activeCanSave: tabs.activeCanSave,
    onRootUpload: (directory: boolean) => upload.openUpload(directory, undefined),
  }
}
import {h, onMounted, ref, watch, type VNodeChild} from 'vue'
import {
  FileOutlined,
  FolderOpenOutlined,
  FolderOutlined,
} from '@antdv-next/icons'
import useApp from 'antdv-next/dist/app/useApp'
import {filterTreeDeep, findFirstTreeNode, unmergeTree} from '@loncra/client/commons'
import type {FileViewNode, FileViewSource, FileViewState} from './types'

export interface FileViewModelOptions {
  source: () => FileViewSource
  getIcon?: () => ((node: FileViewNode) => VNodeChild) | undefined
  confirmClose?: (node: FileViewNode) => Promise<boolean>
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function useFileView(options: FileViewModelOptions) {
  const {message} = useApp()
  const state = ref<FileViewState>({
    loading: false,
    openKeys: [],
    tabs: [],
    dataSource: [],
  })

  function resolveIcon(node: FileViewNode): VNodeChild {
    if (node.dir) {
      const opened = state.value.openKeys.includes(node.id)
      return h(opened ? FolderOpenOutlined : FolderOutlined)
    }
    return options.getIcon?.()?.(node) ?? h(FileOutlined)
  }

  async function fetchChildren(node: FileViewNode) {
    if (node.children !== undefined) {
      return
    }
    node.loading = true
    try {
      node.children = await options.source().list(node)
    } finally {
      node.loading = false
    }
  }

  async function reload(node: FileViewNode | null) {
    if (node && !node.dir) {
      return
    }
    if (!node) {
      state.value.openKeys = []
      state.value.tabs = []
      state.value.selected = undefined
      state.value.loading = true
      try {
        state.value.dataSource = await options.source().list(null)
      } catch (error) {
        message.error(errorText(error))
      } finally {
        state.value.loading = false
      }
      return
    }
    state.value.openKeys = state.value.openKeys.filter((key) => key !== node.id)
    delete node.children
    state.value.openKeys = [...state.value.openKeys, node.id]
    node.loading = true
    try {
      node.children = await options.source().list(node)
    } catch (error) {
      message.error(errorText(error))
    } finally {
      node.loading = false
    }
  }

  function setOpenKeys(keys: string[]) {
    const added = keys.filter((key) => !state.value.openKeys.includes(key))
    state.value.openKeys = keys
    for (const key of added) {
      const item = findFirstTreeNode((entry) => entry.id === key, state.value.dataSource)
      if (item?.dir) {
        void fetchChildren(item).catch((error: unknown) => message.error(errorText(error)))
      }
    }
  }

  async function toggleNode(node: FileViewNode) {
    if (!node.dir) {
      openFile(node)
      return
    }
    if (state.value.openKeys.includes(node.id)) {
      state.value.openKeys = state.value.openKeys.filter((key) => key !== node.id)
      return
    }
    state.value.openKeys = [...state.value.openKeys, node.id]
    try {
      await fetchChildren(node)
    } catch (error) {
      message.error(errorText(error))
    }
  }

  function openFile(node: FileViewNode) {
    if (!state.value.tabs.some((tab) => tab.id === node.id)) {
      state.value.tabs = [...state.value.tabs, node]
    }
    state.value.selected = node
  }

  function closeTab(id: string) {
    const list = state.value.tabs
    const index = list.findIndex((tab) => tab.id === id)
    if (index < 0) {
      return
    }
    const next = list[index + 1] ?? list[index - 1]
    state.value.tabs = list.filter((tab) => tab.id !== id)
    if (state.value.selected?.id === id) {
      state.value.selected = next
    }
  }

  async function requestCloseTab(id: string) {
    const node = state.value.tabs.find((tab) => tab.id === id)
    if (!node) {
      return
    }
    if (options.confirmClose && !(await options.confirmClose(node))) {
      return
    }
    closeTab(id)
  }

  function activateTab(id: string) {
    const found = state.value.tabs.find((tab) => tab.id === id)
    if (found) {
      state.value.selected = found
    }
  }

  function closeTabs(match: (node: FileViewNode) => boolean) {
    const remaining = state.value.tabs.filter((tab) => !match(tab))
    const activeGone = !remaining.some((tab) => tab.id === state.value.selected?.id)
    state.value.tabs = remaining
    if (activeGone) {
      state.value.selected = remaining[remaining.length - 1]
    }
  }

  function expandAncestors(id: string) {
    const paths = filterTreeDeep((entry) => entry.id === id, state.value.dataSource)
    const parents = unmergeTree(paths)
      .filter((entry) => entry.dir)
      .map((entry) => entry.id)
    state.value.openKeys = [...new Set([...state.value.openKeys, ...parents])]
  }

  watch(() => options.source(), () => {
    void reload(null)
  })

  onMounted(() => {
    void reload(null)
  })

  return {
    state,
    resolveIcon,
    reload,
    setOpenKeys,
    toggleNode,
    activateTab,
    requestCloseTab,
    closeTabs,
    expandAncestors,
  }
}

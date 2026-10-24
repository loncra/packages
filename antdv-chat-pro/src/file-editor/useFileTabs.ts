import {computed, reactive, type Ref} from 'vue'
import {useLocale} from '../_util/useLocale'
import {resolveDisplayName} from '@loncra/antdv-pro'
import type {FileEditorState} from './types'

export interface FileTabsDeps {
  state: Ref<FileEditorState>
  modal: {confirm: (options: {content: string; onOk: () => void}) => void}
}

export function useFileTabs(deps: FileTabsDeps) {
  const locale = useLocale('FileEditor')
  const tabMeta = reactive<Record<string, {dirty: boolean; mode: string}>>({})
  const paneSaves = new Map<string, () => Promise<void>>()
  const paneHostRefs = new Map<string, (el: unknown) => void>()

  function openTab(item: import('@loncra/client/resource').ObjectItemInfo) {
    if (item.dir) {
      return
    }
    if (!deps.state.value.tabs.some((t) => t.id === item.id)) {
      deps.state.value.tabs = [...deps.state.value.tabs, item]
    }
    deps.state.value.selectedItem = item
  }

  function activateTab(id: string) {
    const found = deps.state.value.tabs.find((t) => t.id === id)
    if (found) {
      deps.state.value.selectedItem = found
    }
  }

  function dropPane(key: string) {
    paneSaves.delete(key)
    paneHostRefs.delete(key)
    delete tabMeta[key]
  }

  function closeTab(id: string) {
    const list = deps.state.value.tabs
    const i = list.findIndex((t) => t.id === id)
    if (i === -1) {
      return
    }
    const next = list[i + 1] ?? list[i - 1]
    deps.state.value.tabs = list.filter((t) => t.id !== id)
    deps.state.value.selectedItem = next
    dropPane(id)
  }

  function closeTabsForRemoved(item: import('@loncra/client/resource').ObjectItemInfo) {
    const remaining = deps.state.value.tabs.filter((t) => {
      if (t.id === item.id) {
        return false
      }
      return !(item.dir && t.objectName.startsWith(item.objectName))
    })
    const removed = deps.state.value.tabs.filter((t) => !remaining.some((r) => r.id === t.id))
    const activeGone = !remaining.some((t) => t.id === deps.state.value.selectedItem?.id)
    deps.state.value.tabs = remaining
    if (activeGone) {
      deps.state.value.selectedItem = remaining[remaining.length - 1]
    }
    removed.forEach((t) => dropPane(t.id))
  }

  function clearTabs() {
    deps.state.value.tabs = []
    deps.state.value.selectedItem = undefined
    paneSaves.clear()
    paneHostRefs.clear()
    for (const key of Object.keys(tabMeta)) {
      delete tabMeta[key]
    }
  }

  function setTabMeta(key: string, next: {dirty: boolean; mode: string}) {
    const current = tabMeta[key]
    if (current?.dirty === next.dirty && current.mode === next.mode) {
      return
    }
    tabMeta[key] = next
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
      deps.modal.confirm({
        content: locale.value.unsavedConfirm,
        onOk: () => closeTab(key),
      })
      return
    }
    closeTab(key)
  }

  function saveActive() {
    const id = deps.state.value.selectedItem?.id
    if (!id) {
      return
    }
    void paneSaves.get(id)?.()
  }

  const activeCanSave = computed(() => {
    const id = deps.state.value.selectedItem?.id
    if (!id) {
      return false
    }
    const meta = tabMeta[id]
    return meta?.mode === 'edit' && meta.dirty
  })

  const tabItems = computed(() =>
    deps.state.value.tabs.map((file) => ({
      key: file.id,
      label: resolveDisplayName(file),
      file,
    })),
  )

  return {
    tabItems,
    tabMeta,
    openTab,
    activateTab,
    closeTab,
    closeTabsForRemoved,
    clearTabs,
    onPaneDirtyChange,
    paneHostRef,
    onCloseTab,
    saveActive,
    activeCanSave,
  }
}
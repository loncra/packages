import {computed, reactive, type ComputedRef, type Ref, ref} from 'vue'
import useApp from 'antdv-next/dist/app/useApp'
import {ChatMessageService, type BasicUserChatConversation, type UserChatConversationResponseBody} from '@loncra/client/message'
import {isEnumValue, YES_OR_NO_TYPE} from '@loncra/client/commons'
import {useLocale} from '../../_util/useLocale'

export interface ImConversationActions {
  remove: (item: UserChatConversationResponseBody) => void
  isFlagPending: (key: 'pinned' | 'muted', item: UserChatConversationResponseBody) => boolean
  toggleFlag: (
    key: 'pinned' | 'muted',
    item: UserChatConversationResponseBody,
  ) => Promise<BasicUserChatConversation | undefined>
}

export interface ImConversationsApi<T extends UserChatConversationResponseBody> {
  dataSource: Ref<T[]>
  sortedDataSource: ComputedRef<T[]>
  isPinned: (item: T) => boolean
  compareConversations: (a: T, b: T) => number
  findById: (id: number | undefined) => T | undefined
  findByRoomId: (roomId: number | undefined) => T | undefined
  setAll: (list: T[]) => void
  upsertToTop: (body: T) => T
  moveToTopByRoomId: (roomId: number | undefined, mutate?: (conversation: T) => void) => void
  unshiftIfAbsent: (body: T) => void
  replaceByRoomId: (roomId: number, body: T) => T | undefined
  load: () => Promise<void>
  refreshByRoomId: (roomId: number) => Promise<T | undefined>
  remove: (id: number | undefined) => void
  removeConversation: (item: T, onRemoved?: () => void) => void
  patch: (id: number | undefined, mutate: (item: T) => void) => void
  isFlagPending: (key: 'pinned' | 'muted', id: number | undefined) => boolean
  toggleFlag: (key: 'pinned' | 'muted', item: T) => Promise<BasicUserChatConversation | undefined>
  patchFlags: (items: Array<{id?: number; pinned?: unknown; muted?: unknown}>) => void
}

export function useImConversations<T extends UserChatConversationResponseBody>(): ImConversationsApi<T> {
  const {modal, message} = useApp()
  const locale = useLocale('ImConversation')
  const dataSource = ref<T[]>([]) as Ref<T[]>

  function isPinned(item: T): boolean {
    return isEnumValue(item.pinned, YES_OR_NO_TYPE.YES)
  }

  function getConversationActiveTime(item: T): number {
    return item.lastUserMessage?.creationTime ?? item.creationTime ?? 0
  }

  function compareConversations(a: T, b: T): number {
    const aPinned = isPinned(a)
    const bPinned = isPinned(b)
    if (aPinned !== bPinned) {
      return aPinned ? -1 : 1
    }
    if (aPinned && bPinned) {
      return (b.pinnedTime ?? 0) - (a.pinnedTime ?? 0)
    }
    return getConversationActiveTime(b) - getConversationActiveTime(a)
  }

  const sortedDataSource = computed<T[]>(() =>
    [...dataSource.value].sort(compareConversations),
  )

  function findById(id: number | undefined): T | undefined {
    if (id == null) {
      return undefined
    }
    return dataSource.value.find((d) => d.id === id)
  }

  function findByRoomId(roomId: number | undefined): T | undefined {
    if (roomId == null) {
      return undefined
    }
    return dataSource.value
      .filter(d => d?.room?.id)
      .find((d) => d.room.id === roomId)
  }

  function setAll(list: T[]): void {
    list.filter((d) => !d.draft).forEach((d) => (d.draft = []))
    dataSource.value = [...list]
  }

  function upsertToTop(body: T): T {
    const exist = findById(body.id)
    const target = exist ?? body
    dataSource.value = [target, ...dataSource.value.filter((d) => d.id !== body.id)]
    return target
  }

  function moveToTopByRoomId(
    roomId: number | undefined,
    mutate?: (conversation: T) => void,
  ) {
    const find = findByRoomId(roomId)
    if (!find) {
      return
    }
    mutate?.(find)
    dataSource.value = [find, ...dataSource.value.filter((d) => d.room.id !== roomId)]
  }

  function unshiftIfAbsent(body: T): void {
    if (dataSource.value.some((c) => c.id === body.id)) {
      return
    }
    dataSource.value.unshift(body)
  }

  function replaceByRoomId(roomId: number, body: T): T | undefined {
    const index = dataSource.value
      .filter(d => d?.room?.id)
      .findIndex((s) => s.room.id === roomId)
    if (index < 0) {
      return undefined
    }
    dataSource.value[index] = body
    return dataSource.value[index]
  }

  async function load(): Promise<void> {
    const result = await ChatMessageService.my()
    if (result.data) {
      setAll(result.data as T[])
    }
  }

  async function refreshByRoomId(roomId: number): Promise<T | undefined> {
    const result = await ChatMessageService.getConversation(roomId, true)
    if (!result.data) {
      return undefined
    }
    return replaceByRoomId(roomId, result.data as T)
  }

  function remove(id: number | undefined): void {
    dataSource.value = dataSource.value.filter((d) => d.id !== id)
  }

  function patch(id: number | undefined, mutate: (item: T) => void): void {
    const data = findById(id)
    if (data) {
      mutate(data)
    }
  }

  function removeConversation(item: T, onRemoved?: () => void): void {
    const id = Number(item.id)
    if (!Number.isFinite(id)) {
      return
    }
    const copy = locale.value
    modal.confirm({
      title: copy.deleteConfirmTitle,
      content: copy.deleteConfirmSingle,
      onOk: async () => doRemove([id], onRemoved),
    })
  }

  async function doRemove(ids: number[], onRemoved?: () => void): Promise<void> {
    try {
      const result = await ChatMessageService.deleteConversation(ids)
      message.success(result.message ?? '')
      for (const id of ids) {
        remove(id)
      }
      onRemoved?.()
    } catch (e) {
      message.error(e instanceof Error ? e.message : String(e))
    }
  }

  const pendingFlags = reactive(new Set<string>())

  function isFlagPending(key: 'pinned' | 'muted', id: number | undefined): boolean {
    return id != null && pendingFlags.has(`${key}:${id}`)
  }

  async function toggleFlag(key: 'pinned' | 'muted', item: T): Promise<BasicUserChatConversation | undefined> {
    const id = Number(item.id)
    if (!Number.isFinite(id) || isFlagPending(key, id)) {
      return undefined
    }
    const pendingKey = `${key}:${id}`
    pendingFlags.add(pendingKey)
    try {
      const result = key === 'pinned'
        ? await ChatMessageService.pinnedConversation([id])
        : await ChatMessageService.mutedConversation([id])
      const returned = result.data?.at(0)
      if (returned) {
        patchFlags([returned])
      }
      message.success(result.message)
      return returned
    } catch (error) {
      message.error(error instanceof Error ? error.message : String(error))
      return undefined
    } finally {
      pendingFlags.delete(pendingKey)
    }
  }

  function patchFlags(
    items: Array<{id?: number; pinned?: unknown; muted?: unknown}>,
  ): void {
    for (const c of items) {
      const data = findById(c.id)
      if (!data) {
        continue
      }
      if (c.pinned !== undefined) {
        data.pinned = c.pinned as T['pinned']
      }
      if (c.muted !== undefined) {
        data.muted = c.muted as T['muted']
      }
    }
  }

  return {
    dataSource,
    sortedDataSource,
    isPinned,
    compareConversations,
    findById,
    findByRoomId,
    setAll,
    upsertToTop,
    moveToTopByRoomId,
    unshiftIfAbsent,
    replaceByRoomId,
    load,
    refreshByRoomId,
    remove,
    removeConversation,
    patch,
    isFlagPending,
    toggleFlag,
    patchFlags,
  }
}

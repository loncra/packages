import {nextTick, onBeforeUnmount, onMounted, onUnmounted, type Ref, watch} from 'vue'
import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import {decideDraftRestore, type DraftRestoreResult, isPlaceholderDraft} from '@loncra/chat-core'

const PERSIST_DEBOUNCE_MS = 400

/** 当前这份稿是谁、怎么读写，由宿主闭包决定。key 的字符串内容发送器不解释。 */
export interface DraftBinding<TLive> {
  key: () => string | undefined
  save: (live: TLive) => Promise<void>
  load: () => Promise<TLive | null>
  clear: () => Promise<void>
}

export interface UseDraftSenderOptions<TLive> {
  /** 输入框里的活槽，不是入库用的 PersistableSlot。 */
  slots: Ref<SlotConfigType[]>
  binding: () => DraftBinding<TLive>
  readLive: () => TLive
  slotsOf: (live: TLive) => SlotConfigType[]
  onRestore: (result: DraftRestoreResult<TLive, SlotConfigType[]>) => void
  /** 词槽以外、也要触发防抖写入的数据。IM 的引用条。 */
  saveSource?: () => unknown
}

function debounce(fn: () => void, wait: number): (() => void) & {cancel: () => void} {
  let timer: ReturnType<typeof setTimeout> | undefined
  const wrapped = () => {
    if (timer !== undefined) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      timer = undefined
      fn()
    }, wait)
  }
  wrapped.cancel = () => {
    if (timer !== undefined) {
      clearTimeout(timer)
      timer = undefined
    }
  }
  return wrapped
}

/**
 * 输入后 400ms 写入，离开时立刻写。还原出词槽；只有内存是占位稿才写回 slots。
 * hydrating 期间不 put，避免刚还原又被空稿盖掉。
 */
export function useDraftSender<TLive>(options: UseDraftSenderOptions<TLive>) {
  let hydrating = false

  function missing(): DraftRestoreResult<TLive, SlotConfigType[]> {
    return {found: false, applySlots: false, slots: null, live: null}
  }

  async function flush(): Promise<void> {
    persistDebounced.cancel()
    const binding = options.binding()
    if (!binding.key() || hydrating) {
      return
    }
    try {
      await binding.save(options.readLive())
    } catch {
      // 库不可用或单文件超限时不阻断输入和切会话
    }
  }

  const persistDebounced = debounce(() => {
    void flush()
  }, PERSIST_DEBOUNCE_MS)

  function schedule(): void {
    if (hydrating) {
      return
    }
    persistDebounced()
  }

  async function clearStored(): Promise<void> {
    persistDebounced.cancel()
    const binding = options.binding()
    if (!binding.key()) {
      return
    }
    await binding.clear()
  }

  async function restore(): Promise<void> {
    persistDebounced.cancel()
    const binding = options.binding()
    if (!binding.key()) {
      options.onRestore(missing())
      return
    }
    hydrating = true
    try {
      const live = await binding.load()
      if (live == null) {
        options.onRestore(missing())
        return
      }
      const slots = options.slotsOf(live)
      const decision = decideDraftRestore(slots, isPlaceholderDraft(options.slots.value))
      if (decision.applySlots && decision.slots) {
        options.slots.value = decision.slots
      }
      options.onRestore({...decision, live})
    } finally {
      await nextTick()
      hydrating = false
    }
  }

  function onVisibilityChange(): void {
    if (document.visibilityState === 'hidden') {
      void flush()
    }
  }

  function onBeforeUnload(): void {
    void flush()
  }

  watch(
    () => options.binding().key(),
    () => {
      void restore()
    },
    {immediate: true},
  )

  watch(
    () => options.saveSource?.(),
    () => schedule(),
    {deep: true},
  )

  onMounted(() => {
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('beforeunload', onBeforeUnload)
  })

  onBeforeUnmount(() => {
    void flush()
  })

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('beforeunload', onBeforeUnload)
    persistDebounced.cancel()
  })

  return {schedule, flush, clearStored}
}

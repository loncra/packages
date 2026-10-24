import {nextTick, onBeforeUnmount, onMounted, onUnmounted, watch} from 'vue'
import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import {decideDraftRestore, type DraftRestoreResult, isPlaceholderDraft} from '@loncra/chat-core'
import type {UseDraftSenderOptions} from './types'

const PERSIST_DEBOUNCE_MS = 400

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
      return
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

import type {Ref} from 'vue'
import type {InstructionSenderHandle} from './types'

export interface InstructionViewportWatcherDeps {
  senderRef: Ref<InstructionSenderHandle | undefined>
  contextVisibleMargin: Ref<number>
  getEditableRoot: () => HTMLElement | null
  getCaretClientRect: () => DOMRect | null
  isOpen: () => boolean
  close: () => void
  refresh: () => void
}

export function createInstructionViewportWatchers(deps: InstructionViewportWatcherDeps) {
  let senderVisibilityObserver: IntersectionObserver | undefined
  let observedSenderElement: HTMLElement | undefined
  let viewportListenersBound = false
  let senderResizeObserver: ResizeObserver | undefined

  function isInstructionContextVisible(): boolean {
    const editor = deps.getEditableRoot()
    const senderEl = deps.senderRef.value?.nativeElement
    if (!editor || !senderEl) {
      return false
    }
    const margin = deps.contextVisibleMargin.value
    const senderRect = senderEl.getBoundingClientRect()
    const inViewport =
      senderRect.bottom > margin &&
      senderRect.top < window.innerHeight - margin &&
      senderRect.right > margin &&
      senderRect.left < window.innerWidth - margin
    if (!inViewport) {
      return false
    }
    const sel = window.getSelection()
    if (!sel?.rangeCount || !editor.contains(sel.anchorNode)) {
      return false
    }
    const caretRect = deps.getCaretClientRect()
    if (!caretRect) {
      return false
    }
    return (
      caretRect.bottom >= 0 &&
      caretRect.top <= window.innerHeight &&
      caretRect.right >= 0 &&
      caretRect.left <= window.innerWidth
    )
  }

  function onInstructionViewportChange() {
    if (!deps.isOpen()) {
      return
    }
    if (!isInstructionContextVisible()) {
      deps.close()
      return
    }
    deps.refresh()
  }

  function onSenderVisibilityChange(entries: IntersectionObserverEntry[]) {
    if (!deps.isOpen()) {
      return
    }
    const entry = entries[0]
    if (!entry) {
      return
    }
    if (!entry.isIntersecting || entry.intersectionRatio < 0.01) {
      deps.close()
      return
    }
    deps.refresh()
  }

  function bindSenderVisibilityObserver() {
    const senderEl = deps.senderRef.value?.nativeElement
    if (!senderEl) {
      return
    }
    if (observedSenderElement === senderEl && senderVisibilityObserver) {
      return
    }
    unbindSenderVisibilityObserver()
    senderVisibilityObserver = new IntersectionObserver(onSenderVisibilityChange, {
      root: null,
      threshold: [0, 0.01, 1],
    })
    senderVisibilityObserver.observe(senderEl)
    observedSenderElement = senderEl
  }

  function unbindSenderVisibilityObserver() {
    senderVisibilityObserver?.disconnect()
    senderVisibilityObserver = undefined
    observedSenderElement = undefined
  }

  function bindViewportListeners() {
    if (viewportListenersBound) {
      return
    }
    window.addEventListener('resize', onInstructionViewportChange, {passive: true})
    window.addEventListener('scroll', onInstructionViewportChange, {passive: true, capture: true})
    window.visualViewport?.addEventListener('resize', onInstructionViewportChange, {passive: true})
    window.visualViewport?.addEventListener('scroll', onInstructionViewportChange, {passive: true})
    viewportListenersBound = true
  }

  function unbindViewportListeners() {
    if (!viewportListenersBound) {
      return
    }
    window.removeEventListener('resize', onInstructionViewportChange)
    window.removeEventListener('scroll', onInstructionViewportChange, true)
    window.visualViewport?.removeEventListener('resize', onInstructionViewportChange)
    window.visualViewport?.removeEventListener('scroll', onInstructionViewportChange)
    viewportListenersBound = false
  }

  function bindSenderResizeObserver() {
    const senderEl = deps.senderRef.value?.nativeElement
    if (!senderEl) {
      return
    }
    senderResizeObserver?.disconnect()
    senderResizeObserver = new ResizeObserver(() => {
      onInstructionViewportChange()
    })
    senderResizeObserver.observe(senderEl)
  }

  function unbindSenderResizeObserver() {
    senderResizeObserver?.disconnect()
    senderResizeObserver = undefined
  }

  return {
    bindInstructionViewportWatchers() {
      bindSenderVisibilityObserver()
      bindViewportListeners()
      bindSenderResizeObserver()
    },
    unbindInstructionViewportWatchers() {
      unbindSenderVisibilityObserver()
      unbindViewportListeners()
      unbindSenderResizeObserver()
    },
  }
}

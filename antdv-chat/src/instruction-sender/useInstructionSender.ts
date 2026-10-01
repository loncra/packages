import {nextTick, onUnmounted, ref} from 'vue'
import type {InstructionItem, InstructionMeasure, InstructionPopoverState, UseInstructionSenderParams,} from './types'

const ZERO_WIDTH_SPACE = '\u200B'

export function useInstructionSender(params: UseInstructionSenderParams) {
  let editorScrollTarget: HTMLElement | null = null
  let senderVisibilityObserver: IntersectionObserver | undefined
  let observedSenderElement: HTMLElement | undefined
  let viewportListenersBound = false
  let senderResizeObserver: ResizeObserver | undefined

  const instructionOption = ref<InstructionPopoverState>({
    open: false,
    measure: {
      location: -1,
      prefix: '',
      keyword: '',
      dataSource: [],
    },
    displayDataSource: [],
    activeIndex: 0,
    anchorStyle: {top: '0px', left: '0px'},
  })

  const instructionPopoverRef = ref<{forceAlign?: () => void}>()
  const isComposing = ref(false)

  function getEditableRoot(): HTMLElement | null {
    if (!params.senderRef.value) {
      return null
    }
    const root = params.senderRef.value.nativeElement
    if (root.isContentEditable) {
      return root
    }
    return root.querySelector<HTMLElement>('[contenteditable="true"]')
  }

  function closeInstruction() {
    instructionOption.value.activeIndex = 0
    instructionOption.value.measure.keyword = ''
    instructionOption.value.measure.prefix = ''
    instructionOption.value.measure.location = -1
    instructionOption.value.measure.dataSource = []
    instructionOption.value.displayDataSource = []
    instructionOption.value.open = false
    unbindInstructionViewportWatchers()
  }

  function getCaretClientRect(): DOMRect | null {
    const sel = window.getSelection()
    if (!sel?.rangeCount || !sel.isCollapsed) {
      return null
    }
    const range = sel.getRangeAt(0).cloneRange()
    let rect = range.getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) {
      const marker = document.createElement('span')
      marker.textContent = ZERO_WIDTH_SPACE
      marker.style.display = 'inline-block'
      range.insertNode(marker)
      rect = marker.getBoundingClientRect()
      marker.remove()
      sel.removeAllRanges()
      sel.addRange(range)
    }
    return rect
  }

  function isInstructionContextVisible(): boolean {
    const editor = getEditableRoot()
    const senderEl = params.senderRef.value?.nativeElement
    if (!editor || !senderEl) {
      return false
    }
    const senderRect = senderEl.getBoundingClientRect()
    const inViewport =
      senderRect.bottom > params.contextVisibleMargin.value &&
      senderRect.top < window.innerHeight - params.contextVisibleMargin.value &&
      senderRect.right > params.contextVisibleMargin.value &&
      senderRect.left < window.innerWidth - params.contextVisibleMargin.value
    if (!inViewport) {
      return false
    }
    const sel = window.getSelection()
    if (!sel?.rangeCount || !editor.contains(sel.anchorNode)) {
      return false
    }
    const caretRect = getCaretClientRect()
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

  function updateInstructionAnchor() {
    if (!instructionOption.value.open) {
      return
    }
    const rect = getCaretClientRect()
    if (!rect) {
      closeInstruction()
      return
    }
    instructionOption.value.anchorStyle = {
      top: `${rect.top}px`,
      left: `${rect.left}px`,
    }
    nextTick(() => requestAnimationFrame(() => instructionPopoverRef.value?.forceAlign?.()))
  }

  function onInstructionViewportChange() {
    if (!instructionOption.value.open) {
      return
    }
    if (!isInstructionContextVisible()) {
      closeInstruction()
      return
    }
    updateInstructionAnchor()
  }

  function onSenderVisibilityChange(entries: IntersectionObserverEntry[]) {
    if (!instructionOption.value.open) {
      return
    }
    const entry = entries[0]
    if (!entry) {
      return
    }
    if (!entry.isIntersecting || entry.intersectionRatio < 0.01) {
      closeInstruction()
      return
    }
    updateInstructionAnchor()
  }

  function bindSenderVisibilityObserver() {
    const senderEl = params.senderRef.value?.nativeElement
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
    const senderEl = params.senderRef.value?.nativeElement
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

  function bindInstructionViewportWatchers() {
    bindSenderVisibilityObserver()
    bindViewportListeners()
    bindSenderResizeObserver()
  }

  function unbindInstructionViewportWatchers() {
    unbindSenderVisibilityObserver()
    unbindViewportListeners()
    unbindSenderResizeObserver()
  }

  function onEditorScroll() {
    if (!instructionOption.value.open) {
      return
    }
    updateInstructionAnchor()
  }

  function bindEditorScrollListener() {
    const sender = params.senderRef.value
    const editor = sender ? getEditableRoot() : null
    if (editor === editorScrollTarget) {
      return
    }
    editorScrollTarget?.removeEventListener('scroll', onEditorScroll)
    editorScrollTarget = editor
    editor?.addEventListener('scroll', onEditorScroll, {passive: true})
  }

  function getTextBeforeCursor(editor: HTMLElement): string {
    const sel = window.getSelection()
    if (!sel?.rangeCount || !sel.isCollapsed) {
      return ''
    }
    const range = sel.getRangeAt(0)
    if (!editor.contains(range.startContainer)) {
      return ''
    }
    const pre = document.createRange()
    pre.selectNodeContents(editor)
    pre.setEnd(range.startContainer, range.startOffset)
    return pre.toString().replace(new RegExp(ZERO_WIDTH_SPACE, 'g'), '')
  }

  function getLastMeasureIndex(
    text: string,
    prefix: string,
  ): {location: number; prefix: string; dataSource: InstructionItem[]} {
    const lastIndex = text.lastIndexOf(prefix)
    if (lastIndex < 0) {
      return {location: -1, prefix: '', dataSource: []}
    }
    return {
      location: lastIndex,
      prefix,
      dataSource: params.instructionMap.value[prefix] || [],
    }
  }

  function isValidInstructionTrigger(textBefore: string, location: number): boolean {
    if (location < 0) {
      return false
    }
    if (location === 0) {
      return true
    }
    return new RegExp(`[\\s${ZERO_WIDTH_SPACE}]`, 'g').test(textBefore[location - 1] ?? '')
  }

  function validateInstructionSearch(keyword: string, split = ' '): boolean {
    return !split || keyword.indexOf(split) === -1
  }

  function parseInstructionMeasure(textBefore: string, split = ' '): InstructionMeasure | null {
    for (const key in params.instructionMap.value) {
      const {location, prefix, dataSource} = getLastMeasureIndex(textBefore, key)
      if (!isValidInstructionTrigger(textBefore, location)) {
        continue
      }
      const keyword = textBefore.slice(location + prefix.length)
      if (!validateInstructionSearch(keyword, split)) {
        continue
      }
      return {
        location,
        prefix,
        keyword,
        dataSource,
      }
    }
    return null
  }

  function syncInstruction() {
    if (isComposing.value || params.disabled.value) {
      closeInstruction()
      return
    }
    const sender = params.senderRef.value
    if (!sender) {
      closeInstruction()
      return
    }
    const editor = getEditableRoot()
    if (!editor) {
      closeInstruction()
      return
    }

    bindEditorScrollListener()
    bindInstructionViewportWatchers()
    const measure = parseInstructionMeasure(getTextBeforeCursor(editor))
    if (!measure) {
      closeInstruction()
      return
    }

    const isNewSession =
      !instructionOption.value.open || instructionOption.value.measure.location !== measure.location

    instructionOption.value.measure = measure
    instructionOption.value.activeIndex = isNewSession ? 0 : instructionOption.value.activeIndex
    updateInstructionAnchor()
    instructionOption.value.displayDataSource = params.onFilterDataSource(
      instructionOption.value.measure.keyword,
      [...instructionOption.value.measure.dataSource],
      instructionOption.value.measure.prefix,
    )

    instructionOption.value.open = instructionOption.value.displayDataSource.length > 0
    bindInstructionViewportWatchers()
  }

  function onCompositionStart() {
    isComposing.value = true
  }

  function onCompositionEnd() {
    isComposing.value = false
    nextTick(syncInstruction)
  }

  function bindCompositionEvents() {
    const editor = getEditableRoot()
    if (!editor || editor.dataset.InstructionCompositionBound === '1') {
      return
    }
    editor.dataset.InstructionCompositionBound = '1'
    editor.addEventListener('compositionstart', onCompositionStart)
    editor.addEventListener('compositionend', onCompositionEnd)
  }

  async function handleSenderChange(_value: string, _event?: Event, _slotConfigType?: object[]) {
    bindCompositionEvents()
    await nextTick(syncInstruction)
  }

  function handleInstructionPick(option: InstructionItem) {
    const sender = params.senderRef.value
    const editor = getEditableRoot()
    if (!sender || !editor) {
      return
    }
    const measure = {...instructionOption.value.measure}
    const block = params.createInstructionSlot(option, measure)
    params.senderInsertInstruction(sender, block, measure)
    closeInstruction()
  }

  function handleSenderKeyDown(e: KeyboardEvent) {
    if (!instructionOption.value.open) {
      return
    }
    const options = instructionOption.value.displayDataSource
    if (e.key === 'Escape') {
      e.preventDefault()
      closeInstruction()
      return false
    }
    if (options.length === 0) {
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      instructionOption.value.activeIndex = (instructionOption.value.activeIndex + 1) % options.length
      return false
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      instructionOption.value.activeIndex =
        (instructionOption.value.activeIndex - 1 + options.length) % options.length
      return false
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      const picked = options[instructionOption.value.activeIndex]
      if (picked) {
        handleInstructionPick(picked)
      }
      return false
    }
  }

  onUnmounted(() => {
    unbindInstructionViewportWatchers()
    editorScrollTarget?.removeEventListener('scroll', onEditorScroll)
    editorScrollTarget = null
    const editor = getEditableRoot()
    if (editor) {
      editor.removeEventListener('compositionstart', onCompositionStart)
      editor.removeEventListener('compositionend', onCompositionEnd)
    }
  })

  return {
    instructionPopoverRef,
    instructionOption,
    handleInstructionPick,
    handleSenderKeyDown,
    handleSenderChange,
  }
}

export type InstructionSenderApi = ReturnType<typeof useInstructionSender>

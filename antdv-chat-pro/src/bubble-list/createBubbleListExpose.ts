import type {Ref} from 'vue'
import type {BubbleListExpose} from './types'

export type BubbleListHandle = {
  getScrollBox: () => HTMLElement | undefined
  jumpToMessage: (
    key: string,
    flashPending?: boolean,
    block?: ScrollLogicalPosition,
    behavior?: ScrollBehavior,
  ) => void
  scrollTo: (options: Parameters<BubbleListExpose['scrollTo']>[0]) => void
}

export function createBubbleListExpose(listRef: Ref<BubbleListExpose | undefined>): BubbleListHandle {
  return {
    getScrollBox: () => listRef.value?.getScrollBox(),
    jumpToMessage: (key, flashPending, block, behavior) =>
      listRef.value?.jumpToMessage(key, flashPending, block, behavior),
    scrollTo: (options) => listRef.value?.scrollTo(options),
  }
}

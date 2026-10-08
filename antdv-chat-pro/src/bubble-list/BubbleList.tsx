import {computed, defineComponent, h, type PropType, toRef} from 'vue'
import {BubbleList as AxBubbleList} from '@antdv-next/x'
import {Button, Flex} from 'antdv-next'
import {VerticalAlignBottomOutlined} from '@antdv-next/icons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import type {RoleType} from '@antdv-next/x/dist/bubble/interface'
import {classNames} from '@loncra/antdv'
import {DEFAULT_BUBBLE_LIST_ROLE, useBubbleList} from './useBubbleList.ts'
import useStyle, {BUBBLE_LIST_PREFIX} from './style/index.ts'
import type {BubbleListItem, BubbleRenderRow, BubbleSession} from './types.ts'

const slotNames = ['extra', 'avatar', 'header', 'contentRender', 'footer'] as const

const BubbleList = defineComponent({
  name: 'LBubbleList',
  inheritAttrs: false,
  props: {
    session: {type: Object as PropType<BubbleSession>, required: true},
    /** 为 true 时启用可见区探测（IM 已读）；Agent 保持 false */
    collectVisible: {type: Boolean, default: false},
    scrollToBottomThreshold: {type: Number, default: 100},
    throttleOnScrollWait: {type: Number, default: 300},
    throttleCollectVisibleWait: {type: Number, default: 500},
    topThreshold: {type: Number, default: 250},
    role: {type: Object as PropType<RoleType>, default: undefined},
    renderItem: {
      type: Function as PropType<(items: BubbleListItem[]) => BubbleRenderRow[]>,
      default: undefined,
    },
    isLoading: {
      type: Function as PropType<(item: BubbleListItem) => boolean>,
      default: undefined,
    },
  },
  emits: ['loadPage', 'reloadLastPage', 'visibleItems'],
  setup(props, {emit, slots, expose}) {
    const sessionRef = toRef(props, 'session')
    const listProps = computed(() => ({
      scrollToBottomThreshold: props.scrollToBottomThreshold,
      throttleOnScrollWait: props.throttleOnScrollWait,
      throttleCollectVisibleWait: props.throttleCollectVisibleWait,
      topThreshold: props.topThreshold,
    }))
    const {
      bubbleListRef,
      bubbleListItems,
      domainItems,
      bubbleListRole,
      showScrollToBottom,
      onBubbleScroll,
      jumpToBottom,
      jumpToMessage,
      getVisibleItems,
      getScrollBox,
      scrollTo,
    } = useBubbleList(
      sessionRef,
      listProps,
      {
        onLoadPage: (tag, scrollBox) => emit('loadPage', tag, scrollBox),
        onReloadLastPage: () => emit('reloadLastPage'),
        onVisibleItems: props.collectVisible
          ? (items, scrollBox) => emit('visibleItems', items, scrollBox)
          : undefined,
        renderItem: (items) => props.renderItem?.(items) ?? items
          .filter((item) => !item.hide)
          .map((bubble) => ({bubble})),
      },
      () => props.isLoading,
    )

    const resolvedRole = computed(() => props.role ?? bubbleListRole ?? DEFAULT_BUBBLE_LIST_ROLE)
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('bubble-list', BUBBLE_LIST_PREFIX))
    const [hashId, cssVarCls] = useStyle(prefixCls)

    expose({
      getScrollBox,
      getVisibleItems,
      jumpToMessage,
      jumpToBottom,
      scrollTo,
    })

    function bindSlot(name: typeof slotNames[number]) {
      const slot = slots[name]
      if (!slot) {
        return undefined
      }
      return (slotProps: {index: number}) => slot({
        ...slotProps,
        item: domainItems.value[slotProps.index],
      })
    }

    return () => {
      const bubbleSlots: Record<string, (slotProps: {index: number}) => unknown> = {}
      for (const name of slotNames) {
        const bound = bindSlot(name)
        if (bound) {
          bubbleSlots[name] = bound
        }
      }
      const rootClass = classNames(prefixCls.value, hashId.value, cssVarCls.value)
      return (
        <Flex class={rootClass}>
          <AxBubbleList
            ref={bubbleListRef}
            class={`${prefixCls.value}-list`}
            classes={{scroll: `${prefixCls.value}-scroll`}}
            items={bubbleListItems.value}
            role={resolvedRole.value}
            onScroll={onBubbleScroll}
          >
            {bubbleSlots}
          </AxBubbleList>
          {slots.bubbleListAfter?.()}
          {showScrollToBottom.value
            ? (
              <Button
                shape="circle"
                class={`${prefixCls.value}-jump`}
                onClick={() => jumpToBottom('bottom')}
                v-slots={{icon: () => h(VerticalAlignBottomOutlined)}}
              />
            )
            : null}
        </Flex>
      )
    }
  },
})

export default BubbleList

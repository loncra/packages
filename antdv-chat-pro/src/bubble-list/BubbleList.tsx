import {computed, defineComponent, h, type PropType, toRef} from 'vue'
import {BubbleList as AxBubbleList} from '@antdv-next/x'
import {Button, Flex} from 'antdv-next'
import {VerticalAlignBottomOutlined} from '@antdv-next/icons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import type {RoleType} from '@antdv-next/x/dist/bubble/interface'
import {classNames} from '@loncra/antdv'
import {createBubbleListRole, useBubbleList} from './useBubbleList'
import useStyle, {BUBBLE_LIST_PREFIX} from './style'
import type {BubbleListItem, BubbleRenderRow, BubbleSession} from './types'

const slotNames = ['extra', 'avatar', 'header', 'contentRender', 'footer'] as const

const BubbleList = defineComponent({
  name: 'LBubbleList',
  inheritAttrs: false,
  props: {
    session: {type: Object as PropType<BubbleSession>, required: true},
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
    rootClass: String,
  },
  emits: ['loadPage', 'reloadLastPage', 'visibleItems'],
  setup(props, {emit, slots, attrs, expose}) {
    const sessionRef = toRef(props, 'session')
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('bubble-list', BUBBLE_LIST_PREFIX))
    const [hashId, cssVarCls] = useStyle(prefixCls)
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
      () => prefixCls.value,
    )

    const resolvedRole = computed(() => props.role ?? createBubbleListRole(prefixCls.value))

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
      const {class: attrClass, style: attrStyle, ...rest} = attrs
      const bubbleSlots: Record<string, (slotProps: {index: number}) => unknown> = {}
      for (const name of slotNames) {
        const bound = bindSlot(name)
        if (bound) {
          bubbleSlots[name] = bound
        }
      }
      const rootClass = classNames(
        prefixCls.value,
        hashId.value,
        cssVarCls.value,
        props.rootClass,
        attrClass,
      )
      return (
        <Flex class={rootClass} style={attrStyle as never}>
          <AxBubbleList
            {...rest}
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

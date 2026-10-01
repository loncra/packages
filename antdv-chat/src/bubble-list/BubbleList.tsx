import {computed, defineComponent, type PropType, toRef} from 'vue'
import {Button, Flex} from 'antdv-next'
import {DownOutlined} from '@antdv-next/icons'
import {BubbleList as XBubbleList} from '@antdv-next/x'
import type {RoleType} from '@antdv-next/x/dist/bubble/interface'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '@loncra/antdv'
import type {ActiveChatSession, ChatBubbleItem} from '@loncra/chat-core'
import {toBubbleContent} from '@loncra/chat-core'
import {useBubbleList} from '../_util/useBubbleList'
import type {
  BubbleListCallbacks,
  BubbleListExpose,
  BubbleListProps,
  BubbleListSemanticName,
  BubbleListSemanticProps,
} from './types'
import useStyle from './style'

/** 语义节点 → class 后缀（`root` 无后缀，hashId 挂根，与 `emoji-button` 同款） */
const SEMANTIC_SUFFIX: Record<BubbleListSemanticName, string> = {
  root: '',
  list: 'list',
  scroll: 'scroll',
  scrollToBottom: 'scroll-to-bottom',
  scrollToBottomButton: 'scroll-to-bottom-button',
}

/**
 * 气泡容器（`ax-bubble-list` 的外壳）：滚动分页、跳转闪烁、可见区探测、回到底部。
 *
 * 从宿主 `components/basic/chat/BubbleList.vue` 迁入（2026-10-01，S2a-3）——**SFC → TSX**，行为逐条照抄；
 * 那 5 处宿主 Tailwind 改由 `./style/index.ts` 出默认（token 化），宿主可用语义 `classNames`/`styles` 覆盖。
 *
 * ⚠️ **本组件不提供默认 role**：宿主的 `DEFAULT_BUBBLE_LIST_ROLE` 里带宿主 Tailwind ⇒ 外观必须由宿主给
 * （`ChatBubbleList` 传 `bubbleListRole`、Agent 传 `createAgentBubbleListRole()`）。
 *
 * ⚠️ **滚动区 DOM 选择器**：`_util/useBubbleList` 依赖 x 的 `.antd-bubble-list-scroll-content`
 * （可见区探测），别在这里包一层改变结构的节点。
 */
export const BubbleList = defineComponent({
  name: 'LBubbleList',
  inheritAttrs: false,
  props: {
    session: {type: Object as PropType<ActiveChatSession>, required: true},
    /** 气泡外观（宿主给；缺省走 x 自己的默认） */
    role: {type: Object as PropType<RoleType>},
    /** 为 true 时启用可见区探测（IM 已读）；Agent 保持 false */
    collectVisible: {type: Boolean, default: false},
    scrollToBottomThreshold: {type: Number, default: 100},
    throttleOnScrollWait: {type: Number, default: 300},
    throttleCollectVisibleWait: {type: Number, default: 500},
    topThreshold: {type: Number, default: 250},
    /** ⚠️ 取 `BubbleListCallbacks['renderItem']`（**方法签名** ⇒ 参数双变），宿主传自己的条目类型才过得去 */
    renderItem: {type: Function as PropType<BubbleListCallbacks['renderItem']>},
    classNames: {type: Object as PropType<BubbleListSemanticProps['classNames']>},
    styles: {type: Object as PropType<BubbleListSemanticProps['styles']>},
    prefixCls: String,
  },
  emits: ['loadPage', 'reloadLastPage', 'visibleItems'],
  setup(props, {emit, slots, attrs, expose}) {
    const config = useConfig()
    const prefixCls = computed(() =>
      config.value.getPrefixCls('bubble-list', props.prefixCls ?? 'loncra-bubble-list'),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)

    const sessionRef = toRef(props, 'session')

    const listProps = computed<BubbleListProps>(() => ({
      scrollToBottomThreshold: props.scrollToBottomThreshold,
      throttleOnScrollWait: props.throttleOnScrollWait,
      throttleCollectVisibleWait: props.throttleCollectVisibleWait,
      topThreshold: props.topThreshold,
    }))

    const callbacks: BubbleListCallbacks<ChatBubbleItem> = {
      onLoadPage: (tag, scrollBox) => emit('loadPage', tag, scrollBox),
      onReloadLastPage: () => emit('reloadLastPage'),
      onVisibleItems: props.collectVisible
        ? (items, scrollBox) => emit('visibleItems', items, scrollBox)
        : undefined,
      /**
       * 默认渲染：**从 `data` 现算内容**（2026-10-01 S2b-2 落地 A1）。
       *
       * 存储条目里**没有 `content`**（唯一真相是 `data`）⇒ 这里用 `toBubbleContent` 派生并展开
       * （system 消息一片业务体可以派生出多条渲染项）。宿主给了 `renderItem` 就完全交给宿主
       * （如 IM 要插时间分隔条）。
       */
      renderItem: (items) =>
        props.renderItem
          ? props.renderItem(items)
          : items
              .filter((item) => !item.hide)
              .flatMap((item) =>
                toBubbleContent(item).map((entry) => ({...item, ...entry})),
              ),
    }

    const {
      bubbleListRef,
      bubbleListItems,
      showScrollToBottom,
      onBubbleScroll,
      jumpToBottom,
      jumpToMessage,
      getVisibleItems,
      getScrollBox,
      scrollTo,
    } = useBubbleList(sessionRef, listProps, callbacks)

    const api: BubbleListExpose = {
      getScrollBox,
      getVisibleItems,
      jumpToMessage,
      jumpToBottom,
      scrollTo,
    }
    expose(api)

    /** 透传 x 的具名插槽（`extra` / `avatar` / `header` / `contentRender` / `footer`） */
    function passthroughSlots(): Record<string, unknown> {
      const raw = slots as unknown as Record<
        string,
        ((...args: unknown[]) => unknown) | undefined
      >
      const out: Record<string, unknown> = {}
      for (const name of ['extra', 'avatar', 'header', 'contentRender', 'footer'] as const) {
        const slot = raw[name]
        if (slot) {
          out[name] = (slotProps: unknown) => slot(slotProps)
        }
      }
      return out
    }

    /**
     * 语义节点的 class。
     *
     * ⚠️ **只有根节点能带 `prefixCls` / `hashId` / `cssVarCls`**（2026-10-01 修掉的真实 bug）：
     * 之前把这三个类加到了**每个**部件上 ⇒ 根规则
     * `.loncra-bubble-list { height:100%; flex:1 1 0; display:flex; overflow:hidden; position:relative }`
     * **同时命中了按钮 / 回到底部容器 / 滚动区 / 列表** ——
     * · 按钮被加上 `height: 100%` + `flex: 1 1 0` ⇒ 被拉伸、`border-radius: 50%` 的圆变成椭圆，
     *   阴影看着像"方框"（用户报障）；
     * · 传给 x 的 `classes.scroll` 被打上 `overflow: hidden` + `height: 100%` ⇒ 滚动区也受影响。
     * 其余部件只需要**自己的后缀类**（样式选择器本身是后代关系 `.root .root-xxx`，不需要重复根类）。
     */
    function semanticClass(name: BubbleListSemanticName): string {
      const suffix = SEMANTIC_SUFFIX[name]
      return suffix
        ? `${prefixCls.value}-${suffix}`
        : classNames(prefixCls.value, hashId.value, cssVarCls.value)
    }

    return () => {
      const {class: attrClass, style: attrStyle, ...rest} = attrs

      return (
        <Flex
          {...rest}
          class={classNames(semanticClass('root'), props.classNames?.root, attrClass)}
          style={[props.styles?.root, attrStyle]}
        >
          <XBubbleList
            ref={bubbleListRef}
            class={classNames(semanticClass('list'), props.classNames?.list)}
            style={props.styles?.list}
            classes={{scroll: classNames(semanticClass('scroll'), props.classNames?.scroll)}}
            items={bubbleListItems.value}
            role={props.role}
            onScroll={onBubbleScroll}
            v-slots={passthroughSlots()}
          />
          {slots.bubbleListAfter?.()}
          <Flex
            class={classNames(
              semanticClass('scrollToBottom'),
              props.classNames?.scrollToBottom,
            )}
            style={props.styles?.scrollToBottom}
          >
            {showScrollToBottom.value ? (
              <Button
                shape="circle"
                class={classNames(
                  semanticClass('scrollToBottomButton'),
                  props.classNames?.scrollToBottomButton,
                )}
                style={props.styles?.scrollToBottomButton}
                onClick={() => jumpToBottom('bottom')}
                v-slots={{icon: () => slots.scrollToBottomIcon?.() ?? <DownOutlined />}}
              />
            ) : null}
          </Flex>
        </Flex>
      )
    }
  },
})

export type BubbleListInstance = InstanceType<typeof BubbleList>

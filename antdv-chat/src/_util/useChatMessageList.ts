import {nextTick, type Ref} from 'vue'
import type {PageResult} from '@loncra/client/commons'
import type {ActiveChatSession, ChatBubbleItem, ChatViewControllerBase} from '@loncra/chat-core'

/**
 * 消息列表的**分页 / 锚点 / 合入**通用流程（两域 loader 的公共骨架）。
 *
 * 迁自宿主 `composables/message-server/chat/useChatMessageLoader.ts`（317 行）与
 * `composables/ai-server/agent/useAgentMessageLoader.ts`（231 行）—— 2026-10-01 **S2b-1**。
 *
 * ⚠️ **本次是"等价抽取"，不是"行为归一"**：两域实测有 **7 处差异**，一律做成适配器回调/开关，
 * **不改任何一侧的既有行为**（差异清单见每个成员上的注释）。想归一必须先拍板（含 2 处疑似 Agent 侧 bug）。
 *
 * 与规范的分工：**页码/两端标志/锚点的纯算术**已在 `@loncra/chat-core`（`paging.ts`）；
 * 这里放"要跑异步 + 要 `nextTick`"的编排（`ActiveChatSession` / `ChatViewControllerBase` 都是规范里的形状）。
 */

/**
 * 翻页方向。
 *
 * ⚠️ **沿用宿主的既有语义（名字与直觉相反，别"顺手改对"）**：`useBubbleList` 里
 * `hasOlder() && isNearOldest()` ⇒ `onLoadPage('next')` ⇒ **`'next'` = 加载更早的一页**（`number` 递增），
 * `'previous'` = 加载更新的一页（`number` 递减）。
 */
export type ChatMessagePageTag = 'next' | 'previous'

/** 一次加载的形态 */
export interface ChatMessagePageLoad {
  /** 新条目插到 `elements` **头部**（透传域自己的 `addBubbleListMessage` 语义：IM 传 `!prepend`） */
  prepend?: boolean
  /** 先清空列表（锚点跳转 / 切换会话重载） */
  clear?: boolean
}

/**
 * 两个域 loader 的"缝"：**页从哪来、条目怎么合、会话标识怎么取**。
 *
 * 每个成员对应一处实测差异（写在这里是为了以后归一时有据可查）：
 */
export interface ChatMessageListAdapter<
  A extends ActiveChatSession<I>,
  I extends ChatBubbleItem = ChatBubbleItem,
> {
  /** 活跃会话（**可空** —— Agent 新建中 `conversationActive` 会是 `undefined`；IM 恒有值） */
  active: Ref<A | undefined>
  /** 气泡视图（`useBubbleList` 的宿主壳） */
  view: Ref<ChatViewControllerBase | undefined>
  /**
   * 取一页（**域 API + 域请求参数**：IM 带 `withoutReadableAnchor`、Agent 带 `size`）。
   *
   * 差异 ①：`elements` 是**业务体**不是渲染项 ⇒ 这里放宽成 `unknown`，由域的 `mergeMessage` 收窄。
   * 差异 ②：**"本页无效"的表达不同** —— IM 返回兜底空页 `DEFAULT_PAGE_RESULT_VALUE`（⇒ 恒有值）、
   * Agent 直接 `return undefined`（⇒ 不合并、不动 `dataSource`）。共享层只认 `undefined` = 放弃本页。
   */
  fetchPage(number: number, active: A): Promise<PageResult<unknown> | undefined>
  /**
   * 合入一条业务体（域决定 role 与 `addBubbleListMessage` 的参数）。
   *
   * 差异 ③：IM 传 `append = !prepend`（**更早的页插头**）；Agent **不传**（`append` 默认 `false` ⇒ 恒插头）。
   */
  mergeMessage(body: unknown, elements: I[], prepend: boolean): void
  /** 定位消息所在页码（域 API：IM 带 `roomId`、Agent 带 `conversation id`） */
  fetchPageNumberOf(messageId: number, active: A): Promise<number | undefined>
  /**
   * `loadMore` 的**额外**守卫（两端标志与 `pageLock` 由共享层统一判）。
   *
   * 差异 ④：IM 是"房间 id 必须有效"（`!roomId` 就返回）、Agent 是"`!active.loading`"。
   */
  canLoad(active: A): boolean
  /**
   * 方向 → 加载选项。
   *
   * 差异 ⑤（⚠️ **疑似 Agent 侧 bug，本次原样保留**）：IM 是 `{prepend: tag === 'previous'}`；
   * Agent 把它当成了 `clear`（`{clear: tag === 'previous'}`）⇒ 触底加载"更新的一页"时**会先清空列表**。
   */
  pageOptionsFor(tag: ChatMessagePageTag): ChatMessagePageLoad
  /**
   * `loadMore` 是否做**实时锚点跳转**（加载前后保持视口位置）。
   *
   * 差异 ⑥（⚠️ **Agent 侧原本被注释掉**）：IM `true`；Agent 传 `false`（保持与现状等价，别默认开）。
   */
  anchorJump?: boolean
  /** 造"没有更多了"提示气泡（域负责形状：宿主条目现在还被 `addBubbleListMessage` 塞了 `content`） */
  createNoMoreBubble(): I
  /** 造锚点系统提示气泡（域负责形状；`at` = 锚点时间 − 1ms，保证排在锚点前） */
  createAnchorBubble(systemMessage: string, at: number): I
}

export function useChatMessageList<
  A extends ActiveChatSession<I>,
  I extends ChatBubbleItem = ChatBubbleItem,
>(adapter: ChatMessageListAdapter<A, I>) {
  /** 分页防重入（`loadPage` 与 `loadMore` 共用 —— 与两域原实现一致） */
  let pageLock = false

  async function loadPage(number: number, options: ChatMessagePageLoad = {}): Promise<void> {
    const active = adapter.active.value
    if (!active || pageLock) {
      return
    }
    const {prepend = false, clear = false} = options
    try {
      pageLock = true
      const page = await adapter.fetchPage(number, active)
      if (!page) {
        return
      }
      const retained = clear ? [] : active.dataSource.elements
      active.dataSource = {...active.dataSource, ...page, elements: retained}
      // 到达端页则锁住；clear/首屏以当前页为准同步两端标志
      if (clear) {
        active.isOnFirstPage = page.first
        active.isOnLastPage = page.last
      } else {
        if (page.first) {
          active.isOnFirstPage = true
        }
        if (page.last) {
          active.isOnLastPage = true
        }
      }
      for (const body of page.elements || []) {
        adapter.mergeMessage(body, active.dataSource.elements, prepend)
      }
    } finally {
      pageLock = false
    }
  }

  /**
   * 加载"更早 / 更新"的一页，并在加载后把视口钉回原处（`anchorJump` 时）。
   */
  async function loadMore(tag: ChatMessagePageTag): Promise<void> {
    await nextTick()
    const active = adapter.active.value
    if (!active || pageLock) {
      return
    }
    // 差异 ④ 落点：IM 的房间 id 校验、Agent 的 `loading` 校验（原先都在这个位置之前）
    if (!adapter.canLoad(active)) {
      return
    }
    if (tag === 'next' && (active.isOnLastPage || active.dataSource.last)) {
      return
    }
    if (tag === 'previous' && (active.isOnFirstPage || active.dataSource.first)) {
      return
    }
    // 差异 ⑥：只有开了 anchorJump 的域才算锚点（Agent 侧这段原是注释掉的）
    const anchor = adapter.anchorJump ? findAnchor(active.dataSource.elements, tag) : undefined

    await loadPage(
      tag === 'next' ? ++active.dataSource.number : --active.dataSource.number,
      adapter.pageOptionsFor(tag),
    )
    await nextTick()
    if (anchor) {
      adapter.view.value?.jumpToMessage(
        String(anchor.key),
        false,
        tag === 'next' ? 'nearest' : 'end',
      )
    }
    if (active.dataSource.last && tag === 'next') {
      active.dataSource.elements.unshift(adapter.createNoMoreBubble())
      active.isOnLastPage = true
    }
  }

  /**
   * 跳到某条消息所在页（清空后重载 + 定位 + 可选插入系统提示）。
   * 两域此处**逐字相同**（只有取页/建气泡的差异走了适配器）。
   */
  async function jumpToAnchorPage(
    messageId: number,
    pageNumber: number,
    systemMessage?: string,
  ): Promise<void> {
    const active = adapter.active.value
    if (!active) {
      return
    }
    active.isOnLastPage = false
    active.isOnFirstPage = false
    active.loading = true
    try {
      await loadPage(pageNumber, {clear: true})

      if (active.dataSource.elements.length <= 0) {
        return
      }

      const anchorIndex = active.dataSource.elements.findIndex((b) => b.key === String(messageId))
      let key: string | number | undefined

      if (anchorIndex < 0) {
        key = active.dataSource.elements.at(0)?.key
      } else {
        const anchorBubble = active.dataSource.elements[anchorIndex]
        if (anchorBubble) {
          key = anchorBubble.key
        }
        if (systemMessage && anchorBubble) {
          const anchorTime = anchorBubble.data?.creationTime ?? 0
          active.dataSource.elements.splice(
            anchorIndex,
            0,
            adapter.createAnchorBubble(systemMessage, anchorTime - 1),
          )
        }
      }

      await nextTick()
      if (!adapter.view.value || key === undefined) {
        return
      }
      adapter.view.value.jumpToMessage(String(key))
    } finally {
      active.loading = false
    }
  }

  /** 问服务端"这条消息在第几页"，再走 `jumpToAnchorPage`（两域逐字相同，只有域 API 不同） */
  async function positioningMessage(messageId: number): Promise<void> {
    const active = adapter.active.value
    if (!active) {
      return
    }
    try {
      active.loading = true
      const pageNumber = await adapter.fetchPageNumberOf(messageId, active)
      if (pageNumber) {
        await jumpToAnchorPage(messageId, pageNumber)
      }
    } finally {
      active.loading = false
    }
  }

  return {
    loadPage,
    loadMore,
    jumpToAnchorPage,
    positioningMessage,
  }
}

export type ChatMessageListApi = ReturnType<typeof useChatMessageList>

/** 视口钉回用的锚点（原两域的 `reduceSort`：取当前列表在"行进方向"上的边界项） */
function findAnchor<I extends ChatBubbleItem>(
  elements: I[],
  tag: ChatMessagePageTag,
): I | undefined {
  if (elements.length === 0) {
    return undefined
  }
  return elements.reduce((a, b) => {
    const flag =
      tag === 'previous'
        ? (a.data?.creationTime ?? 0) >= (b.data?.creationTime ?? 0)
        : (a.data?.creationTime ?? 0) <= (b.data?.creationTime ?? 0)
    return flag ? a : b
  })
}

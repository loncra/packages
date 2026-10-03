import type {ChatBlockBase} from './block'
import type {ChatBubbleItem, ChatMessageBase} from './message'
import {CHAT_ROLE} from './role'

/**
 * 气泡列表的**纯数组变换**（不碰 Vue / x / pinia / 宿主）。
 *
 * 迁自宿主 `utils/chatUtils.ts:89-133`（2026-10-01 **S2b-2**）并落地 **A1**：
 *
 * > **`data` 是唯一可写的真相；`content` 不是条目字段，而是渲染时由 `toBubbleContent` 现算的投影。**
 *
 * 因此这里比宿主原版**少两件事**（都是有意的，见 core-types §1.4 A1）：
 * - **不写 `content`** —— 条目只挂业务体（`data`）；渲染内容由下面的 `toBubbleContent` 派生；
 * - **不做 system 拆条** —— 一片业务体**恒是一条存储条目**，多片由派生层展开（⇒ 顺手消灭了
 *   §五-16 的**重复 key**：原先每个 fragment 都用 `String(body.id)`）。
 */

/**
 * 把一条业务体合入气泡列表（去重；`append` 决定头插/尾插）。
 *
 * ⚠️ 与宿主原版**行为等价**的部分：去重按 `String(body.id)`、命中就**整体替换**该条目
 * （换新对象 ⇒ Vue 能看见变化）、`hide` 挂在条目上（容器按它过滤）。
 */
export function addBubbleListMessage(
  body: ChatMessageBase<ChatBlockBase>,
  role: ChatBubbleItem['role'],
  bubbleList: ChatBubbleItem[],
  append: boolean = false,
  hide: boolean = false,
): void {
  const item: ChatBubbleItem = {
    key: String(body.id),
    role,
    data: body,
    hide,
  }
  const index = bubbleList.findIndex((b) => b.key === String(body.id))
  if (index >= 0) {
    bubbleList[index] = item
    return
  }
  if (!append) {
    bubbleList.splice(0, 0, item)
  } else {
    bubbleList.push(item)
  }
}

/** `toBubbleContent` 的产物：一条**渲染项**的键与内容 */
export interface ChatBubbleContentEntry<C extends ChatBlockBase = ChatBlockBase> {
  key: string | number
  /**
   * `string` 这一档是**诚实**的：system 消息按 block 拆条后，每片的 `content` 本来就是块的文本值
   * （宿主原版把它 `as unknown as ChatContentBlock` 硬塞进块字段 —— §五-13 的"三态联合"就死在这里）。
   */
  content: C[] | string
}

/**
 * **渲染项**：喂气泡列表的那一份，也是插槽里拿到的 `item`
 * = 存储条目（`ChatBubbleItem`）+ `toBubbleContent` 派生出的 `content`。
 *
 * ⚠️ **两域同形**（宿主 Agent 侧的 `types/composables/chat.ts` 一直用的就是这个名字）⇒ **放规范里**，
 * 别在域里各写一份（2026-10-03 从 `antdv-chat/im/types.ts` 的 `ImBubbleItem` 上提）。
 *
 * 块泛型 `C`：域想收窄自己的块联合时（如 `ChatContentBlock`）传进来，默认放开成 `ChatBlockBase`
 * —— 与 `toBubbleContent` / `ChatBubbleContentEntry` 同一个参数，四处一致。
 */
export type ChatBubbleRenderItem<C extends ChatBlockBase = ChatBlockBase> = ChatBubbleItem<C> & {
  content: C[] | string
}

/**
 * SYSTEM 消息拆条时取一片的文字：块的 `value`（`TextBlock`）。
 *
 * ⚠️ 这里**不用 `as TextBlock` 强转**：`blocks` 的静态类型是 `C extends ChatBlockBase`（信封只有 `type`），
 * 走 `in` + `typeof` 收窄是诚实的；不是文本块（理论上不会有）就退化成空串。
 */
function blockText(block: ChatBlockBase): string {
  return 'value' in block && typeof block.value === 'string' ? block.value : ''
}

/**
 * 从业务体派生"渲染内容"。
 *
 * 返回**数组** ⇒ 允许一片业务体派生多条渲染项（system 消息按 block 拆条）。
 *
 * ⚠️ **键的约定（必须照此，否则跳转/高亮会丢）**：第一片沿用**业务体主键**（= 存储条目的 key），
 * 其余片加 `#i` 后缀。理由：
 * - `jumpToMessage(key)` 的调用方一律传**业务体主键**（`jumpToHistoryMessage` / 引用跳转 / 分页锚点
 *   都从存储条目上取 `key`）⇒ 第一片用主键，跳转/闪烁照旧命中；
 * - 其余片必须独立键，否则 Vue 列表复用错乱（这就是 §五-16 的真 bug）。
 */
export function toBubbleContent<C extends ChatBlockBase = ChatBlockBase>(
  item: Pick<ChatBubbleItem<C>, 'data' | 'role' | 'key'>,
): ChatBubbleContentEntry<C>[] {
  const blocks = item.data?.content ?? []
  const baseKey = String(item.key ?? item.data?.id ?? '')
  if (item.role === CHAT_ROLE.SYSTEM) {
    if (blocks.length === 0) {
      return [{key: baseKey, content: ''}]
    }
    return blocks.map((block, index) => ({
      key: index === 0 ? baseKey : `${baseKey}#${index}`,
      content: blockText(block),
    }))
  }
  return [{key: baseKey, content: blocks}]
}

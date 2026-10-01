import type {VersionEntityMetadata} from '@loncra/client/commons'
import type {ChatBlockBase} from './block'
import type {ChatRole} from './role'

/**
 * 消息体（两侧共同的最小形状）。
 *
 * ⚠️ **只放"两边逐字相同"的部分**：`content` + `VersionEntityMetadata`。
 * `type` / `metadata` / `principal` **各域自留** —— 2026-10-01 T2 实测（`TS2320`）：客户端实体上也声明了
 * 这些字段，域实体 `extends Omit<ClientXxx,'content'> + ChatMessageBase` 会撞**钻石继承**
 * （"Named property 'type' … are not identical"），`type: unknown` 与"可选"**都救不了**。
 *
 * 泛型 `C`：域传自己的块联合（如 `ChatContentBlock`），规范只认识信封 `ChatBlockBase`
 * —— 否则域侧到处要收窄（T2 实测 `TS2322`：`ChatBlockBase[]` 不给 `ChatContentBlock[]`）。
 *
 * ⚠️ **不含"归属根"**：IM 是 `userChatRoomId`、Agent 是 `agentConversationId` ⇒ 各域自留。
 */
export interface ChatMessageBase<C extends ChatBlockBase = ChatBlockBase>
  extends VersionEntityMetadata {
  /** 收窄为块数组（`@loncra/client` 侧是 `any`） */
  content: C[]
}

/**
 * 气泡**渲染项**：喂给 `ax-bubble-list` 的那一份。
 *
 * 与消息体的关系 —— **数据 vs 渲染壳**：
 * - `data` 是**唯一真相**且是**回指**（1 个业务体 → N 条渲染项；system 消息按 block 拆条）⇒
 *   渲染项**没法靠内容找回实体**，必须显式挂着；
 * - ⚠️ **这里没有 `content` 字段**（2026-10-01 定案 A1）：内容在渲染时由纯函数
 *   `toBubbleContent({data, role})` 从 `data` **现算**（一片业务体可派生多条渲染项，键在那里生成
 *   `id#0` / `id#1`）⇒ **结构上不可能再出现"只改了 content 没改 data"**；
 * - `hide` / `flashPending` 是**容器自有的渲染态**（共享容器会读它们，故留在规范里）。
 *
 * ⚠️ `data` 目前是**可选**：T2 实测有 **2 处合法**的"无实体 UI 项"（两个 loader 的"没有更多了 / system 提示"）
 * ⇒ 先可选；**A1 落地时**这些合成项会移出列表（改由渲染层生成），届时收成必填。
 */
export interface ChatBubbleItem<C extends ChatBlockBase = ChatBlockBase> {
  key: string | number
  role: ChatRole
  data?: ChatMessageBase<C>
  /** **容器自有渲染态**：暂不渲染但保留在数据里（IM 用它把"非首页收到的新消息"先藏着） */
  hide?: boolean
  /** **容器自有渲染态**：跳转命中 → 短暂高亮（共享的 `jumpToMessage` / flash 逻辑读写） */
  flashPending?: boolean
}

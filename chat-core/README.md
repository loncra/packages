# `@loncra/chat-core`

IM 与 Agent 共用的**标准**：词槽、气泡与会话、历史分页、草稿存储口。只提供标准与纯函数，具体实现（渲染、请求、状态、存储落地）在实现层按这套标准写。

## 安装与引用

peer：`@loncra/client`（类型与部分枚举值来源）、`dexie`（可选，只有 `@loncra/chat-core/dexie` 用）。

| 路径 | 内容 |
| --- | --- |
| `@loncra/chat-core` | 主入口：类型、纯函数、`DraftStore` 契约 |
| `@loncra/chat-core/dexie` | `DraftStore` 的 Dexie 实现 |

```ts
import {textBubble, type ImContentBlock} from '@loncra/chat-core'
import {dexieDraftStore} from '@loncra/chat-core/dexie'
```

## 模块

| 文件 | 内容 |
| --- | --- |
| `content.ts` | 词槽基类：`TextBlock`、`CustomBlock`，以及两边共用的 `AttachmentBlock`、`InstructionBlock`、`SharedContentBlock` |
| `im.ts` | IM 词槽 `ImCustomBlock` / `ReferenceBlock` / `UndoBlock` / `CallBlock`、`ImContentBlock`、`ImBubbleBody`、`ImChatBubble`、`ImDraftRecord` |
| `agent.ts` | Agent 词槽 `AgentDeltaBlock` / `AgentThinkBlock` / `AgentToolCallBlock` / `AgentAnswerBlock` / `AgentErrorBlock`、`AgentContentBlock`、`AgentBubbleBody`、`AgentChatBubble`、`AgentDraftRecord` |
| `index.ts` | 合成出口：所有块与气泡 + 两个草稿记录合成的 `DraftRecord`、`DraftScope`、`PersistableSlot` |
| `session.ts` | `ChatRole`、`ChatBubbleBody` / `ChatBubbleItem`、`ActiveChatSession`；纯函数 `textBubble`、`bubbleListContent`、`appendMessages` |
| `page.ts` | 历史分页的数组变换：`canLoadHistory`、`stepPageNumber`、`applyHistoryPage`、`locateAnchor`、`pageEdgeBubble` 等 |
| `draft.ts` | 草稿信封与存储口：`DraftRecordBase`、`PersistableSlot`、`DraftCodec`、`DraftStore`、`draftRecordId` / `draftBlobId`、`decideDraftRestore`、`isPlaceholderDraft` 等 |
| `dexie/` | `draftDatabase`、`DraftDatabase`、`dexieDraftStore` / `createDexieDraftStore`、`clearPrincipalDrafts`、`DraftBlobTooLargeError` |

## 词槽标准的组合方式

每一块都从 `TextBlock` 长出来：`TextBlock` → `CustomBlock`（带 `id`）/ `ImCustomBlock`（不带 `id`）→ 各业务块；IM 与 Agent 各有一个联合（`ImContentBlock` / `AgentContentBlock`），组合处按继承链逐支收窄。

Agent 侧比 IM 多一条支：`AgentContentBlock = SharedContentBlock | AgentDeltaBlock | AgentThinkBlock | AgentToolCallBlock | AgentAnswerBlock | AgentErrorBlock`。

气泡 = 消息实体的业务字段 + 气泡自身字段。`ImChatBubble` 只 `Omit` 掉 `content`，`AgentChatBubble` 连 `role` 一起 `Omit`；其余（`key` / 显隐布尔 / 时间等）由 `ChatBubbleBody` / `ChatBubbleItem` 与各自的 `ImBubbleBody` / `AgentBubbleBody` 补。

## 本包的开发规范

- **只出标准**：类型、契约、纯函数；渲染、请求、状态、存储实现都不在本包。`DraftStore` 只定义 `put` / `get` / `clear` 三个方法，实现由调用方传入。
- **主入口不依赖 Dexie**：Dexie 只从 `@loncra/chat-core/dexie` 进；`chat-core/package.json` 里 `dexie` 是 optional peer。
- 不含 Vue、DOM 与组件侧类型：气泡列表只描述回调用到的签名（`BubbleListCallbacks`），具体类型留在实现层。
- **每个接口都写来源**：新增或迁移类型时在头注释里写 `来源：` 管理端（或后端）的对应定义，便于回溯这套标准是从哪份实现里抽出来的。
- 类型扩展走继承，不复制字段：子接口只写自己多出来的字段，公共字段留在基类。

# `@loncra/antdv-chat-pro`

IM 与 Agent 的落地层：两套界面、配置定义与后端调用，建在 `@antdv-next/x` 与 `@loncra/antdv-pro` 之上。

## 安装与引用

peer：`vue`、`antdv-next`、`@antdv-next/icons`、`@antdv-next/x`、`@loncra/antdv`、`@loncra/antdv-chat`、`@loncra/antdv-pro`、`@loncra/chat-core`、`@loncra/client`、`@codemirror/*`（只 `FileEditor` 用）；可选 peer：`dexie`（草稿落库）、`livekit-client`（通话媒体）。`@codemirror/*`、`dexie`、`livekit-client` 的具体版本钉在 `devDependencies`，本包不装 `vue`。`dexie` 只经 `@loncra/chat-core/dexie` 使用，`@loncra/client` 只经 `commons` / `resource` / `message` / `auth` / `ai` 子路径使用。

| 路径 | 内容 |
| --- | --- |
| `@loncra/antdv-chat-pro` | 根 `index.ts` 列出的两套界面、控件、hook 与动作函数 |
| `@loncra/antdv-chat-pro/im/call` | 通话子路径：媒体契约与注册（`createImCallMedia` / `registerImCallMedia`、`ImCallMedia*` 类型）、`provideImChatCall` / `useImChatCall`（含 `ImChatCallSession` / `ImCallWindowState`）、`ImCallWindow` / `ImCallButton` / `ImCallActions`，并 re-export `useLocale` |
| `@loncra/antdv-chat-pro/im/call/livekit` | LiveKit 的媒体实现 `createLiveKitCallMedia` |
| `@loncra/antdv-chat-pro/locale/zh_CN` | 简体中文语言包 |
| `@loncra/antdv-chat-pro/locale/en_US` | 英文语言包 |

```ts
import {Provider, ImChat, AgentChat} from '@loncra/antdv-chat-pro'
import {createLiveKitCallMedia} from '@loncra/antdv-chat-pro/im/call/livekit'
```

## 控件与套件

| 控件 | 说明 | 使用说明 |
| --- | --- | --- |
| `Provider` | 全局配置：把 antdv 与 antdv-pro 两套配置一起透传下去 | [说明](./src/config-provider/README.md) |
| `ImChat` 套件 | IM 界面与内部件：`ImChat`、`ImChatView`、`ImBubbleList` / `ImBubbleContent` / `ImBubbleFooter`、`ImSender`、`ImContact`、`ImRoomSettings`、`ImConversationList`、`ImHistoriesModal`、`useImConversations` / `useImHistory`；通话在 `im/call` 子路径 | [说明](./src/im/README.md) |
| `AgentChat` 套件 | Agent 界面与内部件：`AgentChat`、`AgentBubbleList` / `AgentAssistantContent` / `AgentUserContent` / `AgentBubbleFooter`、`AgentSender`、`AgentConversationList`、`useAgentConversations` / `agentMenuKeys`、`useAgentHistory`、`SkillReleaseChangeLog`，类型 `AgentSession` | [说明](./src/agent/README.md) |
| `BubbleList` | 气泡列表底座：`useBubbleList`、`toAxBubbleItem`、`DEFAULT_BUBBLE_LIST_ROLE` | [说明](./src/bubble-list/README.md) |
| `SenderSlotBubbleContent` | 词槽气泡内容 | [说明](./src/sender-slot-bubble-content/README.md) |
| `DraftSender` | 带草稿的发送器（`DraftBinding`） | [说明](./src/draft-sender/README.md) |
| `ConversationList` | 会话列表底座（`ConversationNode`） | [说明](./src/conversation/README.md) |
| `FileEditor` | 文件预览与编辑（CodeMirror）：`panes/text/TextCodeEditor`、`filePaneKinds`、`FilePaneHost`（按类型分发）、`useFileEditor` / `useFilePane`、`panes/`、`tabs/`、`conversation/` | [说明](./src/file-editor/README.md) |
| `SystemUserPanel` | 系统用户面板 | [说明](./src/system-user-panel/README.md) |

不是控件、直接从根导出的还有：动作 `sendImMessage`、`sendAgentChat`、`interruptAgent`、`updateSessionMessage`，草稿绑定 `createImDraftBinding`、`createAgentDraftBinding`。

## 目录

本表只列目录，根文件是 `index.ts`（唯一入口）与 `vite-env.d.ts`（环境与模块声明）。

| 目录 | 内容 |
| --- | --- |
| `<控件>/` | 一个控件一个目录。骨架 `index.ts` / 主组件 `.tsx` / `style/index.ts` 见 [CONTRIBUTING.md](../CONTRIBUTING.md) 第 7 节，`types.ts` / `constants.ts` / `_util/` 按需（如 `file-editor/_util/validateName.ts`） |
| `im/`、`agent/` | 两个套件目录，内部按 `bubble/`、`sender/`、`conversation/`、`history/`、`draft/` 分，每个子域各有 `style/`；`agent/` 另有 `hub/`（插件市场与版本变更），`im/` 另有 `chat/`、`contact/`、`room/`、`call/`。两套各自的 `history`（`useAgentHistory` / `useImHistory`）互不复用：切会话不恢复翻页锚点，切走前的草稿落点在宿主（`activateConversation`），翻页由气泡列表经 `AGENT_HISTORY_KEY` inject `loadMore`，页面不转发滚动翻页；分页 size 缺省与管理端一致（10）。`AgentSender` 的 `catalogPrefix`：该指令前缀的候选面板由宿主的 `toCatalogMenuItems` / `onCatalogClick` 接管（渲染为目录菜单，选中经 `group:id` 复合 key 回调）。Agent 的草稿 codec（`agent/draft`）只有 `slots`（点名芯片在 slots 里），无 IM 侧的 `refMessages` |
| `session/` | 会话消息写回（`updateSessionMessage`） |
| `history/`、`draft/` | 跨套件共享域：`history/revealAnchor`（IM / Agent 跳转锚定）、`draft/persistableSlots`（草稿槽位序列化），各自带 `index.ts` 出口。`persistableSlots` 序列化规则：入库只存可序列化字段——丢 `customRender`（函数进不了 IDB），文件只存 uid/name/size/type/response，`File` 本体经 `collectBlobsFromSlotConfig` 单独收集（只收 `originFileObj`）；还原时还原出的 `File` 用 `markRaw` 包（Vue 不能代理 File，否则发送时 `originFileObj` 对不上）；files 块还原需注入 `restoreFilesSlot`（IM 必须注入，否则芯片没有 customRender、点发送无法 upload；Agent 无附件槽可省略，未注入时该块跳过） |
| `_util/` | `useLocale` |
| `locale/` | 本包 locale 与 `Locale` 类型 |

## 本包的开发规范

- **基础件复用，不复制**：`classNames` / `genStyleHooks` / `genFullSpinStyle` / `SPIN_KEYFRAMES` / `JUMP_KEYFRAMES` / `createUseLocale` / `fillLocale` / `useIsDark` 从 `@loncra/antdv` 引；`Provider` / `useAntdvConfig` / `Form` / `UserAvatar` / `AttachmentUpload` 等从 `@loncra/antdv-pro` 引；IM 与 Agent 的共性类型、纯函数从 `@loncra/chat-core` 引；后端调用经 `@loncra/client` 的子路径。
- **不做 socket / SSE，不开长连接**：包内不出现 `EventSource` / `WebSocket`，唯一的实时连接是 `im/call/livekit` 的媒体实现会自己建媒体会话。实时数据由宿主经 host 契约推进来 —— IM 侧 `im/host.ts` 的 `ImHost` / `ImChatHost` / `ImChatCallHost` / `ImPageHost`，Agent 侧 `agent/conversation/useAgentConversations.ts` 的 `AgentConversationHost` 与 `agent/history/useAgentHistory.ts` 的 `AgentHistoryHost`；发送侧只出函数（`sendImMessage` / `sendAgentChat` / `interruptAgent`）。
- `prefixCls` 用 `config.getPrefixCls('<名>', '<前缀常量>')`，名默认与控件同名；`FileEditor` 另有 `file-pane` / `file-tabs` / `file-conversation` 三个子前缀。
- `DraftSender` 没有自有样式，不建 `prefixCls` / `style/index.ts`。
- 例外：交给 antdv-next 子组件的 `rootClass` 入参（`ConversationList` 给 `Menu`、`useBubbleList` 经 `toAxBubbleItem` 给气泡组件），那是替子组件传根类，不是本控件自己挂根类。
- 命名：IM 侧文件 `ImXxx.tsx`、Agent 侧 `AgentXxx.tsx`，两个套件共用的件不带前缀（`BubbleList` / `ConversationList` / `DraftSender`）；`file-editor` 的子域文件带 `File` 父级前缀（`FileTabs` / `FileConversation` / `FilePaneHost`）。

通用规则见 [CONTRIBUTING.md](../CONTRIBUTING.md) 第 7–12 节与 [CONTRIBUTING-PACKAGES.md](../CONTRIBUTING-PACKAGES.md) 第 1–6 节。

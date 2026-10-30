# `AgentChat` Agent 助手套件

与 AI Agent 进行流式会话的完整页面：卡片壳（header 展示当前会话名）+ 左侧会话树 + 右侧气泡对话，内置 SSE 流式对接、插件市场（MCP / Skill）、`/` 指令芯片、工具调用人工确认（HITL）、草稿与 token 用量展示——流式传输经 `AgentStreamTransport` 契约适配（默认 x-sdk 实现，可替换为任意环境实现）。

## 何时使用 {#when-to-use}

- 需要一个开箱即用的 Agent 对话页：宿主只提供当前用户、已安装插件列表与 SSE 鉴权头，流式连接、HITL 续跑、中断全部由套件自治。
- 需要在对话中按 `/` 挑选 MCP 工具或 Skill 指令、安装/管理插件、查看 token 用量时。

## 代码演示 {#examples}

```tsx
const self = {
  ...principal.details.metadata,
  systemName: principal.name,
}

<AgentChat
  installs={pluginInstalls}
  self={self}
  buildHeaders={buildAuthHeaders}
  onInstalled={(result) => upsertPluginInstall(result)}
  onUninstalled={(id) => removePluginInstall(id)}
  v-slots={{agentAvatar: () => <Avatar>AI</Avatar>}}
/>
```

流式会话自治：SSE 连接的建立 / 断开 / 重连、HITL 确认后的续跑、发送中断都由套件内部完成——会话激活时自动对运行中的 run 建流（`loadHistory=false` 增量续传）、HITL 确认成功后自动重连、停止按钮调 `AgentService.interrupt`。事件只保留插件安装结果上报。SSE 事件按 `assistantMessageId + sseEventId` 幂等去重，重连重放不会重复渲染。

## 行为 {#behavior}

- **布局**：`Splitter` 左侧会话树（约 20%，可拖 15%–25%）+ 右侧主区。主区在 `chat` / `hub` 两个 pane 间切换，插件市场入口把 pane 切到 `hub`。
- **会话树**：数据来自 `AgentService`；默认工作区只有「新建」，会话节点只有「重命名 / 删除」，其余节点全量菜单。选中与展开受控（`update:selectedKeys` / `update:openKeys` 走内部状态，宿主无感）。
- **发送**：`submit` 后指令 slot 被抽成块（`prefix` / `slotKind: 'instruction'`）连同文本一起交给 `AgentService.chat`；新会话首条消息会先落树再切换。运行中状态由 `isRunning`（会话加载中，或存在 READY / RUNNING——流式未完成——态的 AI 气泡）驱动发送区的停止按钮。
- **指令芯片**：候选来自 `installs` 的过滤结果（targetType 为 MCP 或 SKILL、已激活、有 package、USER 装配或匹配当前工作区的 ORG 装）。触发前缀固定 `TRIGGER = '/'`，菜单项 key 为 `group:id`。
- **目录菜单接管**：`AgentSender` 的 `catalogPrefix` 契约——传入 `catalogPrefix` 后，匹配该前缀的候选面板改由 `toCatalogMenuItems` 渲染、`onCatalogClick(key, pick)` 决定选中，`pick` 的执行权仍在调用方；前缀不匹配时回落到调用方自定义的指令面板（未传插槽则用默认渲染）。
- **草稿**：`createAgentDraftBinding` 按 `{principal}:agent:{targetId}` 读写，`targetId` 是当前会话 id。Agent 草稿**只有 slots、没有 `refMessages`**（`AgentDraftRecord` 类型上就没有引用消息字段），存储走 `@loncra/chat-core/dexie`。
- **历史分页**：`useAgentHistory` 经 `AGENT_HISTORY_KEY` 向气泡列表 provide `loadMore`，向上/向下翻页由气泡列表自行触发，页面不转发滚动事件；翻页不补页边界气泡，锚点滚动恢复保持关闭；切会话不恢复翻页锚点。
- **工具调用确认（HITL）**：待确认的工具块以 ThoughtChain 呈现，支持单条与全部放行/拒绝；确认调 `AgentService.resume`，失败时回滚本地确认态，成功后自动重连续跑流。
- **token 用量**：AI 气泡 footer 展示该条回答的 input / output / cached 与缓存命中率（有 `tokenUsage` 元数据才展示），计算逻辑在 `tokenUsage.ts`（未进包根出口）。

## API

### 属性 {#props}

| 属性 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| self | 当前登录用户；草稿 principal 与界面上的"我"的身份都取自 `systemName` | `Self` | - | - |
| buildHeaders | SSE 连接的鉴权头工厂（如宿主的 `buildAuthHeaders`） | `() => Record<string, string>` | `() => ({})` | - |
| transport | SSE 传输适配器覆盖（默认 x-sdk 实现；uniapp 等环境注入自己的实现） | `AgentStreamTransport` | x-sdk 实现 | - |
| installs | 当前用户已安装插件列表，驱动 `/` 指令候选与「已安装」视图 | `UserPluginInstallResult[]` | `[]` | - |

组件不声明 `expose`，无对外方法。

### 事件 {#events}

| 事件 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| installed | 插件安装成功（市场与确认弹窗上报） | `(result: UserPluginInstallResult) => void` | - |
| uninstalled | 插件卸载成功 | `(id: number) => void` | - |

### 插槽 {#slots}

| 插槽 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| agentAvatar | AI 头像；同时用于会话区气泡头像与空态 Welcome 图标 | `() => VNodeChild` | - |

## 类型 {#types}

### AgentSession {#agentsession}

会话对象，在会话实体之上附加加载态与历史分页数据：

| 参数 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| （继承） | 会话实体字段 | `AgentConversationEntity` | - | - |
| loading | 会话加载中 | `boolean` | - | - |
| dataSource | 历史消息分页数据，流式增量由此写回 | `PageResult<HistoryBubble>` | - | - |

### Self {#self}

`PlatformUser | (UserMetadata & {systemName: string})`

`systemName` 用作草稿 principal；头像与名称展示由 `self` 整体经 `getPrincipalNameByUserDetails` 推导。

## 套件内部件

宿主通常只装配 `AgentChat`；以下部件已进包根出口，供自绘场景单独使用：

| 部件 | 说明 |
| --- | --- |
| `AgentBubbleList` | 气泡列表：thinking / answer / 工具卡分组渲染，`resume` 事件上抛；翻页走 `AGENT_HISTORY_KEY` |
| `AgentAssistantContent` | AI 回复内容块：思考块 / 回答块 / 工具调用卡 / 错误提示的分组渲染 |
| `AgentUserContent` | 用户消息内容：指令 slot 渲染为带 `/skill` / `/mcp` 图标的 Tag |
| `AgentBubbleFooter` | 气泡 footer：AI 气泡展示复制回答与 token 用量 Popover；用户气泡展示 chat type 与模型 Tag |
| `AgentSender` | 发送区：草稿绑定 + `/` 指令芯片 + 目录菜单接管（`catalogPrefix`）+ 模型/类型切换 |
| `AgentConversationList` | 会话树列表：按会话类型渲染图标与右键菜单 |
| `useAgentConversations` / `agentMenuKeys` | 会话树状态机与右键菜单装配 |
| `useAgentHistory` | 历史分页与锚点定位，内部 provide `AGENT_HISTORY_KEY`——单独使用 `AgentBubbleList` 时须搭配它提供翻页 |
| `createAgentDraftBinding` | 草稿绑定（scope `agent`，只含 slots） |
| `SkillReleaseChangeLog` | Skill 版本变更记录（也可脱离套件单独使用） |

未进包根出口的内部实现：`AgentHub` 及其市场子件（`McpMarket` / `SkillMarket` / `InstalledPlugins` / `PluginCard` / `PluginInstallModal` / `useAgentHubMarket`）、`AgentThinkBlock` / `AgentToolCallCard` / `AgentAnswerBlock`、`useAgentChat*` 系列 composable、`stream/`（`useAgentStream` 流编排与运行中 run 判定 + `xAgentStreamTransport` x-sdk 适配）、`useAgentInstructionSlots` / `agentMenus`、`pluginIcons`、草稿 codec。

样式：各子域独立 `genStyleHooks`，前缀 `loncra-agent-chat`（含卡片壳 `-card-root` / `-card-header` / `-card-body`）/ `loncra-agent-bubble` / `loncra-agent-conversation` / `loncra-agent-hub` / `loncra-agent-sender`，均可经 ConfigProvider 的 `getPrefixCls` 覆盖。

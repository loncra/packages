# `ImChat` IM 套件

基于会话列表的即时消息界面：左侧会话树 / 联系人双页签 + 右侧气泡对话，内置 @提及、引用、附件、撤回与重新编辑、已读回执、群设置与通话。socket 业务事件由套件**自治订阅**（宿主只注入一个 `subscribe` 函数），消息通知内建（`useImNotifications`），"是否弹通知"由宿主按页面状态决定。

## 何时使用 {#when-to-use}

- 需要一个开箱即用的 IM 对话页：宿主只提供当前用户、未读存储、socket 订阅函数与"是否弹通知"的判断，其余全部由套件自治。
- 需要在消息中 @ 成员、引用跳转、发送附件、发起音视频通话（LiveKit）时。

## 代码演示 {#examples}

页面接入（宿主提供 socket 订阅函数与未读存储）：

```tsx
const host: ImPageHost = {
  get self() { return {...principal.details.metadata, systemName: principal.name} },
  timeText: (unix) => dayjs(unix).fromNow(),
  roomUploadPrefix: (roomId) => `user_chat_room/${roomId}`,
  unreadCount: (id) => unreadStore.getUserChatUnreadQuantity(Number(id)),
  refreshUnread: async () => { await unreadStore.fetchUnreadQuantity() },
  subscribe: (event, handler) => socket.subscribe(event, handler),
}

<ImChat
  ref={chatRef}
  host={host}
  contacts={contacts}
  loading={loading}
  onActive={(session) => ...}
  onMuted={(body) => ...}
/>
```

全局消息通知（布局层挂载，页面外的消息也弹）：

```ts
useImNotifications({
  subscribe: (event, handler) => socket.subscribe(event, handler),
  selfSystemName: () => principal.name,
  refreshUnread: () => unreadStore.fetchUnreadQuantity(),
  shouldNotify: () => route.name !== MY_CHAT_MESSAGE_ROUTE, // 宿主按页面状态决定是否弹
  openChatFromNotification: (conversationId, messageId) => {
    void router.push({name: MY_CHAT_MESSAGE_ROUTE, query: {conversationId, messageId}})
  },
  notificationDuration: () => notificationConfig.duration,
})
```

## 行为 {#behavior}

- **socket 自治**：套件内部经 `host.subscribe` 订阅全部 im 业务事件（新消息 / 撤销 / 更新 / 已读 / 会话新建与刷新 / 成员刷新），解析与分发内建（`useImSocketEvents`）——宿主不再做"事件到方法"的转发。组件卸载自动取消订阅。
- **消息通知**：`useImNotifications`（布局层挂载）订阅新消息 / @提及 / 撤销事件——排除自己的消息、刷新未读数、静音会话不弹、@提及通知常驻且可点击定位，弹窗前经 `shouldNotify` 门禁（宿主按当前页面返回 `false` 即不弹），点击经 `openChatFromNotification` 跳转（路由知识留在宿主）。
- **布局**：`Splitter` 左侧栏（约 20%，可拖 15%–25%）+ 右侧主区。左侧栏是「会话 / 联系人」双页签（Segmented 切换）；联系人页点击某人即创建私聊会话并自动切回会话页签。
- **会话树**：数据来自 `ChatMessageService`；行尾 `…` 菜单为置顶 / 免打扰 / 删除，确认与请求收在 `useImConversations`（`removeConversation` / `toggleFlag`），删除的是当前会话时主区自动清空。
- **发送**：文本 / 附件 / 引用 / 指令芯片组装成块交给 `ChatMessageService.send`；发送成功后本地先上屏并清空草稿与引用，服务端确认由 socket 推进。
- **@提及**：仅群聊可用，触发前缀 `@`；候选为群成员（不含自己）与「所有人」，已选过的成员不再出现在候选里，「所有人」选中后候选清空。指令 slot 的 `prefix` 随草稿持久化。
- **引用**：点气泡 footer 的「引用」收集目标消息，引用条支持单个关闭与点击跳转定位。
- **撤回与重新编辑**：撤回有倒计时窗口（`useImMessageActions` 收口确认与请求）；撤回后自己的消息显示「重新编辑」链接，点击后消息移出列表、原内容回填发送区。
- **已读上报**：页面可见且持有焦点时，可见的他人消息批量上报已读并刷新未读数；切会话清空上报队列。已读明细由 socket 推送实时更新（`useImMessageRead`）。
- **草稿**：`createImDraftBinding` 按 `{principal}:im:{targetId}` 读写，`targetId` 是房间 id；草稿含 slots 与引用消息（`ImDraftLive`）。会话列表的 `[草稿]:` 预览来自 Dexie 持久化记录经包内 `draftPreview` 映射，与发送区恢复同形状。
- **历史分页**：`useImHistory` 经 `IM_HISTORY_KEY` 向气泡列表 provide `loadMore`，`previous` 插到头部、`next` 追加到尾部；已读锚点（`readableAnchor`）支持「跳转至最早未读消息」。`ImHistorySession` 是 `useImHistory` 读写会话的那段结构子集，管理端会话对象结构兼容可直接传入。
- **会话设置**：`ImRoomSettings` 覆盖改名 / 置顶 / 免打扰 / 历史 / 成员管理 / 退出 / 解散；请求经 `useImRoomActions`，状态变更统一写回 `useImConversations`。置顶 / 免打扰的执行中标记（`isFlagPending`）由 `useImConversations` 唯一持有——群设置开关的 loading 与会话列表菜单项的禁用绑的是同一份状态。
- **通话**：`im/call` 经 `ImCallMedia` 窄接口解耦，LiveKit 实现单独子路径（optional peer），宿主启动时 `registerImCallMedia` 注册工厂；来电通知的忽略 / 接听 / 拒绝经 `ImCallActions`。
## API

### 属性 {#props}

| 属性 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| host | 宿主注入契约，见 [host 契约](#host-契约) | `ImPageHost` | - | - |
| contacts | 联系人页数据源 | `SystemUserContactItem[]` | `[]` | - |
| loading | 左侧栏初始加载态 | `boolean` | `false` | - |

### 事件 {#events}

| 事件 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| active | 当前会话变化；删除当前会话后为 `undefined` | `(conversation: UserChatConversationResponseBody \| undefined) => void` | - |
| muted | 免打扰状态变更（群设置抽屉入口） | `(body: BasicUserChatConversation) => void` | - |

### 方法 {#methods}

宿主仍需要的入口，全部经 `ref` 暴露（socket 驱动的方法已内化，见 [行为](#behavior)）：

| 方法 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| openConversation | 打开指定会话（可定位到某条消息） | `(id: number, messageId?: number) => Promise<void>` | - |
| setRoomSettingsOpen | 开关右侧群设置抽屉 | `(open: boolean) => void` | - |
| refreshConversations | 全量刷新（含草稿预览重载） | `() => Promise<void>` | - |
| scrollToBottom | 当前会话滚动到底 | `() => void` | - |

## useImNotifications {#useimnotifications}

全局消息通知（包根出口，建议在布局层挂载）：

| 选项 | 说明 | 类型 |
| --- | --- | --- |
| subscribe | socket 订阅函数（返回取消订阅） | `(event: string, handler: (payload: unknown) => void) => () => void` |
| selfSystemName | 当前登录用户 | `() => string` |
| refreshUnread | 刷新全局未读 | `() => Promise<void>` |
| shouldNotify | 是否弹通知（宿主按页面状态判断；`false` 时静默跳过弹窗，未读数照常刷新） | `() => boolean` |
| openChatFromNotification | 通知点击跳转 | `(conversationId: number, messageId?: number) => void` |
| notificationDuration | 通知展示时长 | `() => number \| false \| undefined` |

## host 契约 {#host-契约}

| 契约 | 字段 | 说明 |
| --- | --- | --- |
| `ImHost` | `self` | 当前登录用户（草稿 principal、发送者判定都取 `systemName`） |
| `ImChatHost` | `timeText` | 相对时间文案 |
| | `subscribe` | socket 业务事件订阅（返回取消函数）——im 全部事件的唯一接入点 |
| | `roomUploadPrefix` | 房间附件的存储前缀（发送上传与历史附件查询共用） |
| `ImChatCallHost` | `closeTimeValue` | 通话结束后的窗口关闭倒计时 |
| `ImPageHost` | `unreadCount` | 会话未读数 |
| | `refreshUnread` | 刷新全局未读 |

消息 / 草稿的预览文案与头像渲染由套件内建（`useImContentPreview` / `createAvatarNode`），不再由宿主提供。

## 类型 {#types}

### ImChatSession {#imchatsession}

会话视图状态，在 `ImHistorySession` 之上附加发送态与当前会话引用；宿主一般不需要手工构造。

## 套件内部件

宿主通常只装配 `ImChat`；以下部件已进包根出口，供自绘场景单独使用：

| 部件 | 说明 |
| --- | --- |
| `ImChatView` | 单会话视图：气泡列表 + 发送区装配，已读上报与 @提及各自收在 composable |
| `ImBubbleList` / `ImBubbleContent` / `ImBubbleFooter` | 气泡列表与内容渲染：时间分隔条、五类自定义块、引用 / 撤回按钮 |
| `ImSender` | 发送区：草稿绑定 + 附件槽（`useImFileUploadSlots`）+ 指令芯片（`useImInstructionSlots`）+ 引用条 |
| `ImConversationList` / `useImConversations` | 会话列表与会话状态唯一归属（排序 / 置顶 / 增删改 / 标记） |
| `ImContact` | 联系人选择（单点建聊，纯展示） |
| `ImRoomSettings` | 群设置面板（请求在 `useImRoomActions`，编排状态在 `useImRoomSettings`，状态写回 `useImConversations`；成员区与群形态设置区拆为 `ImRoomMemberList` / `ImRoomGroupSettings`） |
| `ImHistoriesModal` / `useImHistory` | 历史记录弹窗（消息 + 附件检索）与历史分页 / 锚点（`IM_HISTORY_KEY` 的 provide 方） |
| `createImDraftBinding` | 草稿绑定（scope `im`，slots + refMessages） |
| `useImConversations` 的 `removeConversation` / `toggleFlag` | 会话删除确认与置顶 / 免打扰请求 |
| `useImNotifications` | 全局消息通知（见 [useImNotifications](#useimnotifications)） |
| `createAvatarNode` / `createUserAvatarNode` | 头像节点渲染（通知与自定义场景复用） |

未进包根出口的内部实现：`useImChat` / `useImChatSessions` / `useImChatDrafts`（装配三件套）、`chat/`（`useImSocketEvents` socket 自治订阅 + `parseSocket` 载荷解析 + `IM_SOCKET_EVENT` 事件名 + `useImContentPreview` 消息 / 草稿预览）、`useImReadReport` / `useImMentionInstruction` / `useImMessageActions` / `useImMessageRead`、`imRoomKinds`、`ImRoomMemberList` / `ImRoomGroupSettings`、`callBadge` / `callNotificationKey`、`ImCallVideoPanel`（单角色视频面板，左右分屏与小窗两种形态的壳样式经 `layout.ts` 纯函数产出）、`useImRoomActions` / `useImRoomSettings` / `useImRoomMemberActions`、`ImRoomMemberModal`（经 `im/room` 子路径可得）。

样式：各子域独立 `genStyleHooks`，前缀 `loncra-im-chat` / `loncra-im-chat-view` / `loncra-im-bubble` / `loncra-im-conversation` / `loncra-im-contact` / `loncra-im-room` / `loncra-im-history` / `loncra-im-sender` / `loncra-im-call`，均可经 ConfigProvider 的 `getPrefixCls` 覆盖。

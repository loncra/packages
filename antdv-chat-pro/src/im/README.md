# `ImChat` IM 套件

基于会话列表的即时消息界面：左侧会话树 / 联系人双页签 + 右侧气泡对话，内置 @提及、引用、附件、撤回与重新编辑、已读回执、群设置与通话，实时数据由宿主经 host 契约推进。

## 何时使用 {#when-to-use}

- 需要一个开箱即用的 IM 对话页：宿主负责联系人数据、socket 接线与未读存储，界面与交互全部由套件承担。
- 需要在消息中 @ 成员、引用跳转、发送附件、发起音视频通话（LiveKit）时。

## 代码演示 {#examples}

```tsx
const host: ImPageHost = {
  get self() { return {...principal.details.metadata, systemName: principal.name} },
  timeText: (unix) => dayjs(unix).fromNow(),
  messagePreview: (message, conversation) => getMessageContent(message, conversation),
  draftPreview: (draft) => getDraftContent(draft),
  roomUploadPrefix: (roomId) => `user_chat_room/${roomId}`,
  unreadCount: (id) => unreadStore.getUserChatUnreadQuantity(Number(id)),
  refreshUnread: async () => { await unreadStore.fetchUnreadQuantity() },
  subscribeReadUpdate: (handler) => socket.subscribe(CHAT_MESSAGE_READ_UPDATE, handler),
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

事件的职责边界：`active` 上报当前会话变化（删除当前会话后为 `undefined`），`muted` 上报免打扰变更；**socket 连接由宿主建立**，服务端推进经 `ImChatExpose` 的方法注入套件（见 [方法](#methods)）。

## 行为 {#behavior}

- **布局**：`Splitter` 左侧栏（约 20%，可拖 15%–25%）+ 右侧主区。左侧栏是「会话 / 联系人」双页签（Segmented 切换）；联系人页点击某人即创建私聊会话并自动切回会话页签。
- **会话树**：数据来自 `ChatMessageService`；行尾 `…` 菜单为置顶 / 免打扰 / 删除，确认与请求收在 `useImConversations`（`removeConversation` / `toggleFlag`），删除的是当前会话时主区自动清空。
- **发送**：文本 / 附件 / 引用 / 指令芯片组装成块交给 `ChatMessageService.send`；发送成功后本地先上屏并清空草稿与引用，服务端确认由 socket 推进。
- **@提及**：仅群聊可用，触发前缀 `@`；候选为群成员（不含自己）与「所有人」，已选过的成员不再出现在候选里，「所有人」选中后候选清空。指令 slot 的 `prefix` 随草稿持久化。
- **引用**：点气泡 footer 的「引用」收集目标消息，引用条支持单个关闭与点击跳转定位。
- **撤回与重新编辑**：撤回有倒计时窗口（`useImMessageActions` 收口确认与请求）；撤回后自己的消息显示「重新编辑」链接，点击后消息移出列表、原内容回填发送区。
- **已读上报**：页面可见且持有焦点时，可见的他人消息批量上报已读并刷新未读数；切会话清空上报队列。已读明细由 socket 推送实时更新（`useImMessageRead`）。
- **草稿**：`createImDraftBinding` 按 `{principal}:im:{targetId}` 读写，`targetId` 是房间 id；草稿含 slots 与引用消息（`ImDraftLive`）。会话列表的 `[草稿]:` 预览来自 Dexie 持久化记录经 `previewSlots` 的轻量映射，与发送区恢复同形状。
- **历史分页**：`useImHistory` 经 `IM_HISTORY_KEY` 向气泡列表 provide `loadMore`，`previous` 插到头部、`next` 追加到尾部；已读锚点（`readableAnchor`）支持「跳转至最早未读消息」。`ImHistorySession` 是 `useImHistory` 读写会话的那段结构子集，管理端会话对象结构兼容可直接传入。
- **会话设置**：`ImRoomSettings` 覆盖改名 / 置顶 / 免打扰 / 历史 / 成员管理 / 退出 / 解散；请求经 `useImRoomActions`，状态变更统一写回 `useImConversations`。`ImRoomMemberModal` 的加人 / 改身份 / 移除经 `useImRoomMemberActions`。置顶 / 免打扰的执行中标记（`isFlagPending`）由 `useImConversations` 唯一持有——群设置开关的 loading 与会话列表菜单项的禁用绑的是同一份状态，任一入口触发、两处同时感知。
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

宿主 socket 的注入桥，全部经 `ref` 暴露：

| 方法 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| openConversation | 打开指定会话（可定位到某条消息） | `(id: number, messageId?: number) => Promise<void>` | - |
| setRoomSettingsOpen | 开关右侧群设置抽屉 | `(open: boolean) => void` | - |
| applyIncomingMessage | 注入新消息（自己的 USER 回显会被去重） | `(message: UserChatMessageResponseBody \| UserChatMessageEntity) => void` | - |
| applyMessageUpdate | 注入消息更新（编辑回显） | `(message: UserChatMessageResponseBody \| UserChatMessageEntity) => void` | - |
| applyMessageUndo | 注入撤回（气泡转撤回卡片） | `(message: UserChatMessageEntity) => void` | - |
| addConversation | 注入 socket 推送的新会话（如被拉群） | `(conversation: UserChatConversationResponseBody) => Promise<void>` | - |
| refreshConversationByRoom | 按房间刷新会话 | `(roomId: number) => Promise<void>` | - |
| refreshConversations | 全量刷新（含草稿预览重载） | `() => Promise<void>` | - |
| refreshParticipants | 刷新当前群成员 | `(roomId: number) => Promise<void>` | - |
| scrollToBottom | 当前会话滚动到底 | `() => void` | - |

## host 契约 {#host-契约}

四级注入，按需实现：

| 契约 | 字段 | 说明 |
| --- | --- | --- |
| `ImHost` | `self` | 当前登录用户（草稿 principal、发送者判定都取 `systemName`） |
| `ImChatHost` | `timeText` | 相对时间文案 |
| | `messagePreview` | 消息预览文案（列表最后一条） |
| | `roomUploadPrefix` | 房间附件的存储前缀（发送上传与历史附件查询共用） |
| | `subscribeReadUpdate` | 订阅已读回执推送，返回取消函数 |
| `ImChatCallHost` | `closeTimeValue` | 通话结束后的窗口关闭倒计时 |
| `ImPageHost` | `draftPreview` | 草稿预览文案（会话列表 `[草稿]:`） |
| | `unreadCount` | 会话未读数 |
| | `refreshUnread` | 刷新全局未读 |

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

未进包根出口的内部实现：`useImChat` / `useImChatSessions` / `useImChatDrafts`（装配三件套）、`useImReadReport` / `useImMentionInstruction` / `useImMessageActions` / `useImMessageRead`、`imRoomKinds`、`ImRoomMemberList` / `ImRoomGroupSettings`、`callBadge` / `callNotificationKey`、`ImCallVideoPanel`（单角色视频面板，左右分屏与小窗两种形态的壳样式经 `layout.ts` 纯函数产出）、`useImRoomActions` / `useImRoomSettings` / `useImRoomMemberActions`、`ImRoomMemberModal`（经 `im/room` 子路径可得）。

样式：各子域独立 `genStyleHooks`，前缀 `loncra-im-chat` / `loncra-im-chat-view` / `loncra-im-bubble` / `loncra-im-conversation` / `loncra-im-contact` / `loncra-im-room` / `loncra-im-history` / `loncra-im-sender` / `loncra-im-call`，均可经 ConfigProvider 的 `getPrefixCls` 覆盖。

体量说明：`ImRoomSettings` 超文件阈值（463 行）不拆的理由——超出的部分是群 / 单聊两形态的设置面板 JSX，请求与权限判定已收进 `useImRoomActions` 与 `imRoomKinds`，再拆只能拆渲染，拆出的子组件只为传参而存在。

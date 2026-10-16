# Loncra packages

管理端（后台管理系统，重心是 CRUD）在变大的过程中剥离出来的公共能力：六个包，各自对外是一种"标准"，宿主按需引用。

## 六个包

| 包 | 职责 | 依赖 |
| --- | --- | --- |
| [`client`](./client)（`@loncra/client`） | 前端调后端的标准：HTTP 契约、领域类型与枚举、领域 Service | 无 |
| [`chat-core`](./chat-core)（`@loncra/chat-core`） | IM 与 Agent 共用的标准：词槽、气泡与会话、历史分页、草稿存储口 | `client` |
| [`antdv`](./antdv)（`@loncra/antdv`） | 在 `antdv-next` 之上扩展的管理端公共控件 | 无内部依赖 |
| [`antdv-chat`](./antdv-chat)（`@loncra/antdv-chat`） | 在 `@antdv-next/x` 之上扩展的聊天控件 | `antdv` |
| [`antdv-pro`](./antdv-pro)（`@loncra/antdv-pro`） | 借助 `client` 的类型与服务、在 `antdv-next` 上扩展的控件（要调后端的那类） | `antdv`、`client` |
| [`antdv-chat-pro`](./antdv-chat-pro)（`@loncra/antdv-chat-pro`） | IM 与 Agent 的落地层：两套界面、配置定义、后端调用 | `antdv`、`antdv-chat`、`antdv-pro`、`chat-core`、`client` |

依赖方向（被依赖的包 ← 依赖它的包）：

```
client        ← chat-core、antdv-pro、antdv-chat-pro
antdv         ← antdv-chat、antdv-pro、antdv-chat-pro
antdv-pro     ← antdv-chat-pro
antdv-chat    ← antdv-chat-pro
chat-core     ← antdv-chat-pro
```

「依赖」列与上图只记**本仓内部的包依赖**；外部 peer（含 `dexie` / `livekit-client` / `axios` 这类可选项）以各包自己的 `README.md` 为准。

## 宿主接线

- **引用方式**：`"@loncra/xxx": "file:../packages/xxx"`。各包 `exports` 直指 `./src/*.ts`（源码直连，没有构建产物）；**新增子路径入口时，包的 `exports` 与宿主 `tsconfig.app.json` 的 `paths` 必须同时改**，否则宿主编译时解析不到。
- **启动顺序**：先用 client 建好连接（`createClient()`，或把 `ClientConfig` 交给 `antdv-pro` 的 `ClientProvider`），再用 `antdv-chat-pro` 的 `Provider`（它在 `antdv-pro` 的 `Provider` 外面再包一层 `@antdv-next/x` 的 `XProvider`）。
- **locale**：跨包、以及与 `antdv-next/locale` 的合并由宿主做（宿主把合并结果交给 `ConfigProvider`）；包内只做一层回落 —— 宿主传入的优先，没有就用包自己的 `zh_CN`。
- **样式层**：antd 的样式住在 `@layer antd`（宿主用 `a-style-provider layer` 开启），包内 cssinjs 的 `prepend` 关闭 —— 详见 [CONTRIBUTING.md](./CONTRIBUTING.md) 第 11 节。
- **版本**：`vue` 的版本以本仓为准、宿主跟随，具体规则见 [CONTRIBUTING-PACKAGES.md](./CONTRIBUTING-PACKAGES.md) 第 5 节。

## 控件总表

每个控件一份使用说明，就放在它自己的目录里（`src/<控件>/README.md`）。**这批说明正在逐份补齐** —— 下面表里链接还打不开的，就是尚未写的那一份。控件说明的写法见 [CONTRIBUTING.md](./CONTRIBUTING.md) 第 12 节。

### `@loncra/antdv`

| 控件 | 说明 | 使用说明 |
| --- | --- | --- |
| `TooltipValidationFormItem` | 把表单项的校验信息收进 `Tooltip`，长表单不占纵向空间 | [说明](./antdv/src/tooltip-validation-form-item/README.md) |
| `QrCodeModal` | 二维码弹窗 | [说明](./antdv/src/qr-code-modal/README.md) |
| `BasicImage` | 图片展示，取不到图时回退包内自带占位图 | [说明](./antdv/src/basic-image/README.md) |
| `IconSelect` | 图标选择：图标库 / 纯文本 / 头像三形态，外加只读预览 | [说明](./antdv/src/icon-select/README.md) |
| `KeyValueTable` | 键值表格，行内可编辑，提交前收敛编辑态 | [说明](./antdv/src/key-value-table/README.md) |
| `Editor` | 富文本编辑器（`antdv-next-tiptap`） | [说明](./antdv/src/editor/README.md) |

### `@loncra/antdv-chat`

| 控件 | 说明 | 使用说明 |
| --- | --- | --- |
| `EmojiButton` | 表情选择按钮 | [说明](./antdv-chat/src/emoji-button/README.md) |
| `InstructionSender` | 可带指令的发送器（含 `useInstructionSender`） | [说明](./antdv-chat/src/instruction-sender/README.md) |
| `Markdown` / `MarkdownCodeRenderer` | Markdown 渲染与代码块渲染器 | [说明](./antdv-chat/src/markdown/README.md) |

### `@loncra/antdv-pro`

| 控件 | 说明 | 使用说明 |
| --- | --- | --- |
| `antdv-pro/Provider` | 管理端总 Provider：主题 / token / 尺寸 / 布局 | [说明](./antdv-pro/src/config-provider/README.md) |
| `ConfigProviderSetting` | 主题与布局的设置面板 | [说明](./antdv-pro/src/config-provider-setting/README.md) |
| `ClientProvider` | 把 `ClientConfig` 交给 `configureClient` | [说明](./antdv-pro/src/client-provider/README.md) |
| `CrudConfigProvider` | CRUD 配置与权限判定 | [说明](./antdv-pro/src/crud-config-provider/README.md) |
| `Form` | 受 ConfigProvider 布局驱动的表单 | [说明](./antdv-pro/src/form/README.md) |
| `ActionButton` | 把已解析的动作渲染成按钮 / 下拉 | [说明](./antdv-pro/src/action-button/README.md) |
| `UserAvatar` | 用户头像 | [说明](./antdv-pro/src/user-avatar/README.md) |
| `UserSelect` | 用户选择 | [说明](./antdv-pro/src/user-select/README.md) |
| `AttachmentUpload` | 附件上传：分片、进度、模式常量 | [说明](./antdv-pro/src/attachment-upload/README.md) |
| `AttachmentMasonry` | 附件瀑布流展示 | [说明](./antdv-pro/src/attachment-masonry/README.md) |
| `DataLoadingCardPlan` | 取数过程中的加载卡片 | [说明](./antdv-pro/src/data-loading-card-plan/README.md) |
| `BasicCrudQuery` | 查询底座：搜索区 + 取数 + 分页 + 动作解析 | [说明](./antdv-pro/src/basic-crud-query/README.md) |
| `QueryTable` | 查询内容的表格形态 | [说明](./antdv-pro/src/query-table/README.md) |
| `QueryCardGrid` | 查询内容的卡片形态 | [说明](./antdv-pro/src/query-card-grid/README.md) |
| `CrudTable` | 表格形态门面（固定实体类型后透传） | [说明](./antdv-pro/src/crud-table/README.md) |
| `CrudCardGrid` | 卡片形态门面（透传） | [说明](./antdv-pro/src/crud-card-grid/README.md) |
| `crud-page` 套件 | 页面装配 + `define*` 声明入口 + 字段注册表 | [说明](./antdv-pro/src/crud-page/README.md) |
| `useAppNotification`（hook） | 通知，需要宿主的 `<a-app>` | - |

### `@loncra/antdv-chat-pro`

| 控件 | 说明 | 使用说明 |
| --- | --- | --- |
| `antdv-chat-pro/Provider` | 全局配置：包住 `antdv-pro` 的 `Provider`，外面再套一层 `@antdv-next/x` 的 `XProvider` | [说明](./antdv-chat-pro/src/config-provider/README.md) |
| `ImChat` 套件 | IM 界面与内部件（气泡、发送器、联系人、群设置、会话列表、历史、通话） | [说明](./antdv-chat-pro/src/im/README.md) |
| `AgentChat` 套件 | Agent 界面与内部件（气泡、发送器、会话列表、历史、插件市场） | [说明](./antdv-chat-pro/src/agent/README.md) |
| `BubbleList` | 气泡列表底座 | [说明](./antdv-chat-pro/src/bubble-list/README.md) |
| `SenderSlotBubbleContent` | 词槽气泡内容 | [说明](./antdv-chat-pro/src/sender-slot-bubble-content/README.md) |
| `DraftSender` | 带草稿的发送器 | [说明](./antdv-chat-pro/src/draft-sender/README.md) |
| `ConversationList` | 会话列表底座 | [说明](./antdv-chat-pro/src/conversation/README.md) |
| `FileEditor` | 文件预览与编辑（CodeMirror） | [说明](./antdv-chat-pro/src/file-editor/README.md) |
| `SystemUserPanel` | 系统用户面板 | [说明](./antdv-chat-pro/src/system-user-panel/README.md) |

## 规范在哪

| 文档 | 管什么 |
| --- | --- |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | 控件开发规范：控件目录骨架、分层与职责、命名与类名、样式、样式层与覆盖顺序、控件使用说明的写法 |
| [CONTRIBUTING-PACKAGES.md](./CONTRIBUTING-PACKAGES.md) | 跨包通用规则：总原则、文件角色、契约与实现、粒度阈值、版本与包间引用、自动检查 |
| 各包 `README.md` | 这个包是什么 + 这个包自己的开发规范 |
| `src/<控件>/README.md` | 单个控件的使用说明：何时使用、代码演示、API、类型、语义化 DOM |

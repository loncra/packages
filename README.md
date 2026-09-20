# Loncra packages

仓根直接挂包。

| 包 | 职责 |
|---|---|
| [`client`](./client)（`@loncra/client`） | 后端 TypeScript HTTP 契约与 Service，不依赖 Vue / axios / `import.meta.env` |
| [`antdv`](./antdv)（`@loncra/antdv`） | 扩展 antdv-next：TSX 控件 + ConfigProvider locale，不调后端 |
| [`antdv-pro`](./antdv-pro)（`@loncra/antdv-pro`） | 调 `@loncra/client` 的通用 antdv 控件，依赖 client + antdv |

管理端：`"@loncra/client": "file:../packages/client"`、`"@loncra/antdv": "file:../packages/antdv"`、`"@loncra/antdv-pro": "file:../packages/antdv-pro"`。

> **`vue` 版本必须与管理端一致（当前 `3.5.42`，钉死不用 `^`）**。两边是**各自独立的安装**（本目录 `node_modules` + 管理端 `node_modules`），
> 管理端 `vue-tsc` 会把包源码一起编译 ⇒ 两处 vue 版本不同就会出现"两份 d.ts"：`VNode` / `Component` 判不等，
> 报一屏 `Type 'VNode<…>' is not assignable to type 'VNode<…>'`（看着一模一样的两行）。
> 升级 vue 时**两边同时改**，装完各自 `node_modules/vue` 与 `@vue/runtime-core` 的版本号要对得上。

## `@loncra/antdv`

对标 antdv-next 源码（`Xxx.tsx` + `defineComponent` + JSX），不是管理端 SFC。peer：`vue`、`antdv-next`；用到官方图标时再 peer `@antdv-next/icons`。禁止 `@loncra/client`、vue-i18n、Pinia、路由、Service。

| 路径 | 内容 |
|---|---|
| `@loncra/antdv` | 控件 + `useLocale` |
| `@loncra/antdv/locale/zh_CN` | 简体中文，与 `antdv-next/locale` 合并后交给 `ConfigProvider` |
| `@loncra/antdv/locale/en_US` | 英文 |

当前控件：`TooltipValidationFormItem`、`QrCodeModal`、`BasicImage`、`IconSelect`、`EmojiButton`、`Markdown` / `MarkdownCodeRenderer`、`KeyValueTable`、`Editor`（`antdv-next-tiptap`）、`InstructionSender`。要对 API 的上传 / IM / Agent 进以后的业务包，不进本包。调 client 的通用控件进 `@loncra/antdv-pro`。

## `@loncra/antdv-pro`

对标 `@loncra/antdv` 的 TSX 写法，直接调 `@loncra/client` Service。宿主（管理端）负责 `createClient()`。peer：`vue`、`antdv-next`、`@loncra/antdv`、`@loncra/client`；相对时间再 peer `dayjs`；上传分片再 peer `p-limit`；FileEditor 文本 pane 再 peer `@codemirror/*`；SystemUserPanel 列表再 peer `@antdv-next/x`。禁止 axios、`createClient`、Pinia、vue-i18n、路由、管理端 `@/apis`。CRUD 第二批。IM / Agent 以后另包。

| 路径 | 内容 |
|---|---|
| `@loncra/antdv-pro` | 控件 + `useLocale` |
| `@loncra/antdv-pro/locale/zh_CN` | 简体中文，与 antdv-next / `@loncra/antdv` locale 合并后交给 `ConfigProvider` |
| `@loncra/antdv-pro/locale/en_US` | 英文 |

当前控件：`UserAvatar`、`UserSelect`、`AttachmentMasonry`、`AttachmentUpload`、`FileEditor`、`SystemUserPanel`；

**CRUD 页面套件（列表形态已进包）**：`crud-page/` 目录 + `CrudConfigProvider` 的跳转兜底。
目录：核心在 `crud-page/`（`types.ts` / `registry.ts` / `define.ts`），列表形态在 `crud-page/home/`（`CrudHomePage.tsx` / `columns.ts`）；表单、详情以后按同样的 `<形态>/` 目录进来。
`define.ts` 是三种形态**共用**的声明入口（恒等合并 `{...core, <形态>}`）：已有 `defineHomePage`，`defineFormPage` / `defineDetailPage` 随形态一起并排加在这里。

分层（列表）：`DataLoadingCardPlan`（Card 壳 + 生命周期 + loading）→ `BasicCrudQuery`（数据 / 系统字典 / 标题 / 统一分页 / 动作解析）→ `QueryTable` · `QueryCardGrid`（内容层，受控：只画自己那套）→ `CrudTable` · `CrudCardGrid`（门面：只把旧 prop 名映射成新名，宿主零改动）。
系统字典（声明里的 `list.enums` / `list.dicts`）由 `BasicCrudQuery` 挂载时加载（`basic-crud-query/dictionaries.ts`），用 `v-model:buckets` / `v-model:dicts` 回传给建列的地方。

- `CrudHomePage`：把页面声明（`CrudListPage`）翻成 `CrudTable` 的 props；不认路由 / i18n / 弹层。
- 声明（宿主业务目录里的 `xxx.page.ts` / `xxx.home.page.ts`）：`CrudPageCore`（service / i18nPrefix / routes / fields / `i18nResolver` / `onNavigate`）+ `PageListDefinition`（columns / enums / authority / rowActions / drag…）。
- 跳转：页面声明给 `onNavigate` 就用它（`record` 是精确实体），否则落到 `CrudConfigProvider` 的 `onNavigate` 兜底，都没有则 no-op（内嵌选择器安全）。
- 文案：宿主给 `i18nResolver`，pro 只拿 key；枚举：`format: 'enum' | 'enumList'` 用 `enumId` + `list.enums` 预载的桶自算（不走宿主的全局枚举表）。
- 表单 / 详情形态（`defineFormPage` / `defineDetailPage`、壳层）尚未迁移。

## `@loncra/client`

### 入口

| 路径 | 内容 |
|---|---|
| `@loncra/client` | 聚合出口（一般按子路径导入） |
| `@loncra/client/commons` | 公共类型、枚举、REST 基类、跨模块 API |
| `@loncra/client/auth` | 认证中心 |
| `@loncra/client/resource` | 资源服务 |
| `@loncra/client/message` | 消息中心（含 IM HTTP） |
| `@loncra/client/ai` | AI 中心（Agent REST，不含 SSE） |
| `@loncra/client/adapters/axios` | 把已配置的 Axios 实例接到 `HttpClient` |

### 分层

每个模块目录：`enumerate` / `constants` / `domain` / `service`。

- **enumerate**：和后端枚举一一对应的码。commons 放在 `enumerate.ts`；领域按主题聚文件（`message/enumerate/chat.ts`），不要一码一文件。
- **constants**：权限串、请求参数名、用枚举值拼出来的判断数组。数组不是枚举。
- **Yes/No 只用 `YES_OR_NO_TYPE`**，不要再造 `SITE_PUSHABLE` 这类 0/1 克隆。
- **domain**：一层领域类型。不要放 Vue / antdv-next / 路由类型。
- **service**：继承 REST 基类的领域 CRUD；该域自己的静态 HTTP 也在这里。

`commons` 再分两类。标准是「谁会调」，不是「静态方法 / 没继承基类」：

- `commons/service/`：`Page` / `Find` 等 REST 基类。
- `commons/api/`：跨模块入口（登录、枚举/验证码、附件、头像、未读）。布局角标、任意页都会用。
- `{module}/service/`：`ChatMessageService` / `ChatCallService` / `AgentService` 这类领域 HTTP。不要进 commons，否则 commons 会依赖模块类型。

新业务模块按上面拆：只有全应用入口才进 `commons/api`。

跨模块 import 走 barrel（`from '../../commons'`）。模块内部用相对路径，避免经 index 循环。

### 启动

核心只认 `HttpClient`。使用任何 Service 之前必须 `createClient()`：

```ts
import {createClient} from '@loncra/client'
import {createAxiosHttpClient} from '@loncra/client/adapters/axios'

createClient({
  http: createAxiosHttpClient(axiosInstance),
  runtimeMode: 'MONOLITH', // 或 'MICROSERVICE'
  getAccessToken: () => storage.getItem('accessToken'),
  resourcePath: '/resource',
  openUrl: (url) => window.open(url),
  authenticationTypeHeaderName: 'Authentication-Type',
  formValueConvert: (key, value) => value, // 可选；管理端用来处理 Dayjs
})
```

`BASE_URL` 用 getter + `modulePrefix`：单体 `/api`，微服务 `/api/{module}`。

`formUrlEncoded` 在 `commons/utils`。骨架只编码；值转换由 `createClient({ formValueConvert })` 注入，单次调用也可传第三个 `valueConvert`。

### 管理端接线

- Service、领域类型、枚举、权限串从 `@loncra/client/<module>` 导入。
- `src/apis` 只留三个包装：`AuthServerService`（i18n 默认名）、`ResourceServerService`（验证码弹层）、`AgentService`（SSE）。
- `src/types/apis` 只留 UI 叠层（`BaseChatBubble`、Sender 词槽、Dayjs、vue-router），不要再转发 client 类型。
- `*_ROUTE`、Socket、provide key、视频 UI 留在管理端。

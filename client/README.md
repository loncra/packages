# `@loncra/client`

前端调后端的标准：HTTP 契约与领域 Service、领域类型与枚举。HTTP 的壳由具体前端框架实现并注入。

## 安装与引用

peer：`axios`（可选，只有 `@loncra/client/adapters/axios` 用）。

| 路径 | 内容 |
| --- | --- |
| `@loncra/client` | 聚合出口：`export *` 三个模块。同名导出会报 duplicate export，日常请按子路径导入 |
| `@loncra/client/commons` | 公共类型、枚举、REST 基类、跨模块 API |
| `@loncra/client/auth` | 认证中心 |
| `@loncra/client/resource` | 资源服务 |
| `@loncra/client/message` | 消息中心（含 IM HTTP） |
| `@loncra/client/ai` | AI 中心（Agent REST，不含 SSE） |
| `@loncra/client/adapters/axios` | 把已配置的 Axios 实例接到 `HttpClient` |

```ts
import {createClient} from '@loncra/client'
import {ChatMessageService} from '@loncra/client/message'
```

## 模块分层

每个业务模块目录（`auth` / `resource` / `message` / `ai`）结构相同：根上的 `enumerate.ts` 单文件 + `constants/`、`domain/`、`service/`（`service/` 下常再分 `api/` 与 `const.ts`）。`commons` 另有 `api` 与 `utils`，`http` 放客户端契约与全局配置。

| 层 | 放什么 |
| --- | --- |
| `enumerate.ts` | 与后端枚举一一对应的码，一个模块一个文件；不要一码一文件，也不按主题拆目录 |
| `constants` | 权限串、请求参数名、用枚举值拼出来的判断数组。数组不是枚举 |
| `domain` | 一层领域类型。不放 Vue / antdv-next / 路由类型 |
| `service` | 继承 REST 基类的领域 CRUD；该域自己的静态 HTTP 也在这里 |
| `commons/service/` | `Page` / `Find` 等 REST 基类 |
| `commons/api/` | 跨模块入口（登录、枚举/验证码、附件、头像、未读），布局角标与任意页都会用 |
| `commons/utils/` | 跨模块纯函数，如 `formUrlEncoded`、`tree` |
| `http/` | `HttpClient` / `HttpRequest` 契约、`createClient` / `configureClient` / `getClient`、`modulePrefix` |
| `adapters/` | 把具体 HTTP 库接到 `HttpClient` |

## 本包的开发规范

- `{module}/service/` 里的领域 HTTP（`ChatMessageService` / `ChatCallService` / `AgentService`）**不要进 `commons`**，否则 `commons` 会依赖模块类型。
- 只有全应用入口才进 `commons/api`。
- 跨模块 import 走 barrel（`from '../../commons'`）；模块内部用相对路径，避免经 `index` 形成循环。
- 领域类型与枚举一律从 `@loncra/client/<module>` 导出，宿主不另写副本。
- 跨包通用规则（契约分类、粒度阈值、版本与包间引用、自动检查）见 [CONTRIBUTING-PACKAGES.md](../CONTRIBUTING-PACKAGES.md)。

## 启动

核心只认 `HttpClient`。使用任何 Service 之前必须先 `createClient()`：

```ts
import {createClient} from '@loncra/client'
import {createAxiosHttpClient} from '@loncra/client/adapters/axios'

createClient({
  http: createAxiosHttpClient(axiosInstance),
  runtimeMode: 'MICROSERVICE', // 或 'MONOLITH'
  getAccessToken: () => localStorage.getItem('accessToken'),
  resourcePath: '/resource',
  openAttachmentUrl: (url) => window.open(url),
  formValueConvert: (_key, value) => toFormUrlencoded(value), // 可选：值的转换由宿主注入，函数名是宿主自己的
  uploadBlockSize: 5 * 1024 * 1024, // 可选；超过该字节走分片
})
```

- `ClientConfig` 的全部字段见 `http/types.ts`：`http` 与 `runtimeMode` 必填，其余可选。
- 要在 Vue 组件里按 props 驱动配置，走 `configureClient`：幂等，重复调用即覆盖，配置变化后自动重配。
- `modulePrefix(moduleName)` 返回单体 `/api`、微服务 `/api/{module}`；它依赖 `getClient()`，**必须在 `createClient` 之后调用**。各 Service 把它放在取 `BASE_URL` 的取值函数里，所以 `new XxxService()` 本身是纯的。
- `formUrlEncoded` 在 `commons/utils`：骨架只编码，值的转换由 `createClient({formValueConvert})` 注入，单次调用也可传第三个 `valueConvert`。

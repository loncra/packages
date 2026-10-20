# `@loncra/antdv-pro`

借助 `@loncra/client` 的类型与服务，在 `antdv-next` 上扩展的管理端控件：从布局 Provider 到 CRUD 页面的装配。

## 安装与引用

peer：`vue`、`antdv-next`、`@antdv-next/icons`、`@loncra/antdv`、`@loncra/client`、`dayjs`、`p-limit`。`dayjs` 用在 `_util/crud/dateUtils.ts` 与 `useDateFormat.ts`，`p-limit` 用在 `_util/uploadFile.ts`；`vue` 的版本只在包自己的 `devDependencies` 里钉死。

本包 `exports` 只有三个入口，控件没有单独子路径：

| 路径 | 内容 |
| --- | --- |
| `@loncra/antdv-pro` | 根 `index.ts` 列出的控件、套件、hook 与 `_util/` 基础件。**不是所有 `_util/` 都从根导出**：`media.ts`、`crud/sources.ts`、`crud/useStaleCheck.ts` 的函数等只在包内用 |
| `@loncra/antdv-pro/locale/zh_CN` | 简体中文语言包 |
| `@loncra/antdv-pro/locale/en_US` | 英文语言包 |

```ts
import {Provider, CrudHomePage, defineHomePage} from '@loncra/antdv-pro'
import zhCN from '@loncra/antdv-pro/locale/zh_CN'
```

## 控件与套件

| 控件 | 说明 | 使用说明 |
| --- | --- | --- |
| `Provider` | 管理端总 Provider：主题 / token / 尺寸 / 布局；另出 `useAntdvConfig`、`createAntdvConfig`、`ANTDV_CONFIG_KEY` | [说明](./src/config-provider/README.md) |
| `ConfigProviderSetting` | 主题与布局的设置面板，内部用 `Form` | [说明](./src/config-provider-setting/README.md) |
| `ClientProvider` | 把 `ClientConfig` 交给 `configureClient`；另出 `useClient`、`CLIENT_CONFIG_KEY` | [说明](./src/client-provider/README.md) |
| `CrudConfigProvider` | CRUD 配置与权限判定：`useCrudConfig`、`useActionAuth`。`CRUD_CONFIG_KEY` 只在控件出口，根未导出 | [说明](./src/crud-config-provider/README.md) |
| `Form` | 受 ConfigProvider 布局（`layout` / `detailLayout`）驱动的表单 | [说明](./src/form/README.md) |
| `ActionButton` | 把已解析的动作（`ResolvedAction`）渲染成按钮 / 下拉 | [说明](./src/action-button/README.md) |
| `UserAvatar` | 用户头像（只用前缀，没有自有样式） | [说明](./src/user-avatar/README.md) |
| `UserSelect` | 用户选择（含 `UserSelectOption`），内部用 `BasicCrudQuery` | [说明](./src/user-select/README.md) |
| `AttachmentUpload` | 附件上传：分片、进度、模式常量 `ATTACHMENT_UPLOAD_MODE` / `ATTACHMENT_PREVIEW_MODE` | [说明](./src/attachment-upload/README.md) |
| `AttachmentMasonry` | 附件瀑布流展示 | [说明](./src/attachment-masonry/README.md) |
| `DataLoadingCardPlan` | 取数过程中的加载卡片（`DataLoadingTask`），被 `BasicCrudQuery` 使用 | [说明](./src/data-loading-card-plan/README.md) |
| `BasicCrudQuery` | 查询底座：搜索区 + 取数 + 分页 + 动作解析。`fetchDataDictionaries` / `fetchEnumBuckets` 只在控件出口 | [说明](./src/basic-crud-query/README.md) |
| `QueryTable` | 查询内容的表格形态（列搜索 `ColumnSearchConfig`） | [说明](./src/query-table/README.md) |
| `QueryCardGrid` | 查询内容的卡片形态（拖拽排序） | [说明](./src/query-card-grid/README.md) |
| `CrudTable` | 表格形态门面：固定实体类型（`DefaultCrudEntity`）后把宿主给的参数透传给 `QueryTable` | [说明](./src/crud-table/README.md) |
| `CrudCardGrid` | 卡片形态门面：同样透传给 `QueryCardGrid` | [说明](./src/crud-card-grid/README.md) |
| `crud-page` 套件 | 页面装配：`CrudHomePage` / `CrudFormPage` / `CrudFormModal` / `CrudDetailPage` / `CrudCardGridPage`、`OperationTraceTable` / `createOperationTracePage` / `isOperationTraceVisible` / `OPERATION_TRACE_VARIANT`，声明入口 `defineHomePage` / `defineFormPage` / `defineDetailPage` / `defineCardGridPage` | [说明](./src/crud-page/README.md) |
| `useAppNotification` | hook：通知。需要宿主的 `<a-app>` 提供上下文 | - |

## 目录

| 目录 | 内容 |
| --- | --- |
| `<控件>/` | 一个控件一个目录。骨架 `index.ts` / 主组件 `.tsx` / `style/index.ts` 见 [CONTRIBUTING.md](../CONTRIBUTING.md) 第 7 节，`types.ts` 与 `constants.ts` 按需 |
| `crud-page/` | 页面装配套件：`home/`、`form/`、`form-modal/`、`detail/`、`card-grid/`、`operation-trace/`，以及 `define.ts`（声明入口）、`registry.ts`（字段组件注册表）、`types.ts` |
| `_util/` | 包内共用基础件：`format.ts`（单元格格式化）、`attachmentList.ts` / `uploadFile.ts` / `media.ts`（附件）、`useLocale.ts`，以及 `crud/`（`actions.ts` 动作解析、`defaultActions.ts` 默认动作、`useCollectionData.ts` 取数、`useCrudDelete.ts`、`useDrag.ts` / `useFlatDragDrop.ts` / `useTableRowDrag.ts`、`genDragStyle.ts`、`useMergeRowSelection.ts`、`dateUtils.ts` / `useDateFormat.ts`、`useStaleCheck.ts`、`navigate.ts`、`rowKey.ts`、`readPath.ts`、`sources.ts`、`collectionExpose.ts`） |
| `locale/` | 本包 locale 与 `Locale` 类型 |
| `notification/` | `useAppNotification`（**有意例外**：这个目录没有 `index.ts`，根入口直接从文件导出） |

## 本包的开发规范

- **基础件复用 `@loncra/antdv`**：`classNames`、`splitSemantic`、`genStyleHooks`、`createUseLocale` 都从它引，不复制。本包不用 `useIsDark`，暗色由 `config-provider` 的 `theme.darkAlgorithm` 处理。
- **后端调用一律经 `@loncra/client` 的子路径**（`commons` / `resource`）：`AttachmentService`、`BasicCrudService`、`ResourceServerService`（字典与枚举桶）、`getClient`、`SYSTEM_CONSTANT` 与各枚举。包内不出现 URL 拼接、不自建 HTTP 客户端。
- `prefixCls` 用 `getPrefixCls('<名>', 'loncra-<名>')`，名字默认等于目录名。`getPrefixCls` 取自 antd 深路径的 `useConfig()`，不是本包的 `useAntdvConfig`。两个例外：`crud-page/form` → `crud-form-page`，`notification` → `app-notification`。
- 本包有 9 个带样式的控件目录；`user-avatar` / `user-select` 只用前缀，没有样式文件。
- CSS 变量用 `--loncra-<控件>-<语义>` 手写（如 `--loncra-card-grid-columns`），不走 `getPrefixCls`。
- **分层**：`basic-crud-query` 是所有内容层的底座（内部用 `data-loading-card-plan` 与 `action-button`）→ `query-table` / `query-card-grid` 做查询内容 → `crud-table` / `crud-card-grid` 是固定实体类型的门面 → `crud-page` 装配页面（`define*` 声明翻成 props，字段组件走 `registry.ts`）。
- **Provider 层次**：`Provider`（`config-provider`）内嵌 antdv-next 的 `ConfigProvider` 与 `ClientProvider`、`CrudConfigProvider`。`Form` 与 `ConfigProviderSetting` 读 `useAntdvConfig`，CRUD 相关读 `useCrudConfig` / `useActionAuth`。

通用规则见 [CONTRIBUTING.md](../CONTRIBUTING.md) 第 7–12 节与 [CONTRIBUTING-PACKAGES.md](../CONTRIBUTING-PACKAGES.md) 第 1–6 节。

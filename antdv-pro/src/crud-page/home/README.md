# CrudHomePage 表格页壳

把 `defineHomePage` 的声明翻译成 [`CrudTable`](../../crud-table/README.md) 的 props：来源加载、动作解析、跳转都由声明驱动，宿主不再逐页接线。

## 何时使用 {#when-to-use}

- 页面有 `*.home.page.ts` 声明（`defineHomePage` 产物）：直接用本壳。
- 不走声明、自己配 props：用 [`CrudTable`](../../crud-table/README.md)。
- 卡片形态的同款壳：[`CrudCardGridPage`](../card-grid/README.md)。

## 代码演示 {#examples}

```ts
// role.page.ts —— 核心（列表 / 表单 / 详情共用一份）
import {RoleService} from '@loncra/client/auth'

export const roleCore = {
  service: new RoleService(),
  i18nPrefix: 'authServer.role',
  routes: {add: 'AuthServerRoleAdd', edit: 'AuthServerRoleEdit', detail: 'AuthServerRoleDetail'},
}
```

```ts
// role.home.page.ts —— 列表形态
import {defineHomePage} from '@loncra/antdv-pro'
import type {RoleEntity, RoleSavePayload} from '@loncra/client/auth'
import {roleCore} from './role.page'

export const roleHomePage = defineHomePage<RoleSavePayload, RoleEntity>(roleCore, {
  columns: [
    {key: 'name', width: 150, search: {component: 'input'}},
    {key: 'enabled', width: 120, search: {component: 'select'}},
    {key: 'remark', width: 300},
  ],
})
```

```vue
<!-- Home.vue -->
<template>
  <crud-home-page :page="roleHomePage" />
</template>
```

## API

### 属性 {#props}

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| page | `defineHomePage` 产物 | `CrudTableDefinition` | 必填 |
| variant | 宿主形态名，透传给声明里的 `visible` / `recordActions` | string | - |
| extra | 宿主数据，透传给声明的回调 | `Record<string, unknown>` | `{}` |
| title | 卡片头（同 `CrudTable.title`）：`false` = 不渲染标题 | `VNode \| boolean` | - |
| query | 预置查询条件（同 `CrudTable.query`） | `FilterRequest \| PageRequest` | - |
| plain | 内嵌形态：不要卡片壳 | boolean | `false` |
| fetch | 自定义取数（同 `CrudTable.fetch`） | `CollectionFetch` | - |

### 事件 {#events}

| 事件 | 说明 |
| --- | --- |
| add / edit / detail | 默认语义 = 按声明 `routes` 跳转（`page.onNavigate` 优先，否则 `CrudConfig.onNavigate`）；**绑同名事件 = 接管跳转** |
| deleted / drop / treeDrop / action | 经 `$attrs` 直通 `CrudTable`，见 [CrudTable 的事件](../../crud-table/README.md#events) |

### 插槽 {#slots}

| 插槽 | 说明 |
| --- | --- |
| title | 卡片头 |
| bodyCell | 单元格（参数同 CrudTable 的 `bodyCell`） |
| expandedRowRender | 展开行内容 |

### 方法 {#methods}

通过模板 ref 拿（expose 出去的一律是"值"，用 getter 保响应式）：

| 成员 | 说明 |
| --- | --- |
| fetchDataSource | 重新取数 |
| clearDataSource | 清空本地数据（重新取数用 `fetchDataSource`） |
| dataSource | 当前数据 |
| buckets | 已加载的枚举桶 |

## 类型 {#types}

`CrudHomePageProps` / `CrudHomePageExpose` / `CrudHomePageSlots` / `CrudHomePageConstructor` 定义在本目录 `types.ts`，从包根 `@loncra/antdv-pro` 导出。

## 语义化 DOM {#semantic-dom}

本壳不产生自己的节点：根就是 [`CrudTable`](../../crud-table/README.md#semantic-dom) 的根，`$attrs` 整体直通 `CrudTable`（其中 `scroll` 有默认 `{x: 'max-content'}`）。区域表、类名与「无落点」清单见 CrudTable 的语义化 DOM。

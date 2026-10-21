# `CrudTable` 表格门面

把宿主给的 props 原样转给 `QueryTable` 的一层壳：类型固定成 `DefaultCrudEntity`，不造名字、不做合成。

## 何时使用 {#when-to-use}

- 直接在页面里写 `<l-crud-table :service :columns />`，不经过「声明 → 组件」那套页面壳时用它。
- 已经有 `*.home.page.ts` 声明、要按声明装配：用 `CrudHomePage`，它内部才是本控件。
- 卡片形态的同款门面：`CrudCardGrid`。

## 代码演示 {#examples}

```vue
<script setup lang="ts">
import {ref} from 'vue'
import {CrudTable} from '@loncra/antdv-pro'
import {RoleService} from '@loncra/client/auth'
import type {FilterRequest} from '@loncra/client/commons'

const service = new RoleService()
const query = ref<FilterRequest>({})
const columns = [
  {key: 'name', width: 200},
  {key: 'enabled', width: 120},
]
</script>

<template>
  <crud-table v-model:query="query" :service="service" :columns="columns" />
</template>
```

## API

### 属性 {#props}

属性与 `QueryTable` **同名同形、逐个透传**，完整语义见 [QueryTable 的属性](../query-table/README.md#props)。本控件只做三件额外的事：把 `classes` / `styles` / `rootClass` / `prefixCls` 一起转下去、把 `drag` / `onRow` / `rowSelection` 转给表格、其余 attrs 原样透传。

### 事件 {#events}

事件同样是 `QueryTable` 的同名透传，见 [QueryTable 的事件](../query-table/README.md#events)。

### 插槽 {#slots}

| 插槽 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| title | 卡片头 | `() => VNodeChild` | - |
| extra | 卡片头右侧 | `() => VNodeChild` | - |
| bodyCell | 单元格 | `(args: QueryTableBodyCellArgs) => VNodeChild` | - |
| expandedRowRender | 展开行内容 | `(args: QueryTableExpandedRowArgs) => VNodeChild` | - |

### 方法 {#methods}

通过模板 ref 拿：

| 成员 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| fetchDataSource | 重新取数 | `() => Promise<void>` | - |
| remove | 走统一的删除确认流程 | `(records: DefaultCrudEntity[]) => void` | - |

## 类型 {#types}

### CrudTableConstructor {#crudtableconstructor}

> 没有 `CrudTableProps`：门面的 props 就是 `QueryTableProps`，另加 `EmitsToProps<QueryTableEmits>` 与 expose 的 `CollectionExpose`。它自己是泛型的（`TBody` / `TEntity` / `TPage` / `TId`），模板里用 `l-crud-table` 时类型由这套参数推。

`CrudTableConstructor` 从包根 `@loncra/antdv-pro` 导出。

## 语义化 DOM {#semantic-dom}

本控件不产生任何节点与类名：根就是 `QueryTable` 的根（再往下一层是 `BasicCrudQuery` 的卡片壳），`class` / `style` / `rootClass` / `prefixCls` / `classes` / `styles` 全部原样下推。区域表、类名顺序、attrs 落点与「无落点」清单都见 [QueryTable 的语义化 DOM](../query-table/README.md#semantic-dom)。

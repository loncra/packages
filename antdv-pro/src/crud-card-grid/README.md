# `CrudCardGrid` 卡片门面

把宿主给的 props 原样转给 `QueryCardGrid` 的一层壳：类型固定成 `DefaultCrudEntity`，不造名字、不做合成。

## 何时使用 {#when-to-use}

- 直接在页面里写 `<l-crud-card-grid :service />`，不经过「声明 → 组件」那套页面壳时用它。
- 已经有 `*.home.page.ts` 声明、要按声明装配：用 `CrudCardGridPage`，它内部才是本控件。
- 表格形态的同款门面：`CrudTable`。

## 代码演示 {#examples}

```vue
<script setup lang="ts">
import {ref} from 'vue'
import {CrudCardGrid} from '@loncra/antdv-pro'
import {RoleService} from '@loncra/client/auth'
import type {FilterRequest} from '@loncra/client/commons'

const service = new RoleService()
const query = ref<FilterRequest>({})
</script>

<template>
  <crud-card-grid v-model:query="query" :service="service" :grid-columns="4" />
</template>
```

不写 `#item` 时用默认卡片：标题是行主键，右下角是项内动作与拖拽把手。

## API

### 属性 {#props}

属性与 `QueryCardGrid` **同名同形、逐个透传**，完整语义见 [QueryCardGrid 的属性](../query-card-grid/README.md#props)。与表格门面不同的是：本控件**没有** `enums` / `dictionaryCodes` / `buckets` / `dictionaries` —— 卡片形态的枚举桶与数据字典由 `CrudCardGridPage` 自己拉、经 `expose` 给壳用。

### 事件 {#events}

事件同样是 `QueryCardGrid` 的同名透传，见 [QueryCardGrid 的事件](../query-card-grid/README.md#events)。

### 插槽 {#slots}

| 插槽 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| title | 卡片头 | `() => VNodeChild` | - |
| extra | 卡片头右侧 | `() => VNodeChild` | - |
| empty | 空态 | `() => VNodeChild` | - |
| item | 每张卡片 | `(slot: QueryCardGridItemSlot) => VNodeChild` | - |
| itemActions | 项内动作区域 | `(slot: QueryCardGridItemActionsSlot) => VNodeChild` | - |

### 方法 {#methods}

通过模板 ref 拿：

| 成员 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| fetchDataSource | 重新取数 | `() => Promise<void>` | - |
| remove | 走统一的删除确认流程 | `(records: DefaultCrudEntity[]) => void` | - |

## 类型 {#types}

### CrudCardGridConstructor {#crudcardgridconstructor}

> 没有 `CrudCardGridProps`：门面的 props 就是 `QueryCardGridProps`，另加 `EmitsToProps<QueryCardGridEmits>` 与 expose 的 `CollectionExpose`。它自己是泛型的（`TBody` / `TEntity` / `TPage` / `TId`），模板里用 `l-crud-card-grid` 时类型由这套参数推。

`CrudCardGridConstructor` 从包根 `@loncra/antdv-pro` 导出。

## 语义化 DOM {#semantic-dom}

本控件不产生任何节点与类名：根就是 `QueryCardGrid` 的根，`class` / `style` / `rootClass` / `prefixCls` / `classes` / `styles` 全部原样下推。区域表、类名顺序、attrs 落点与「无落点」清单都见 [QueryCardGrid 的语义化 DOM](../query-card-grid/README.md#semantic-dom)。

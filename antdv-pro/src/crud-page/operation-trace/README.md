# OperationTraceTable 操作记录

操作记录（审计）表 —— 只出表格，**不手写表格**：表格本身走表格形态的 DSL（`createOperationTracePage()` 产出声明，交给 [`CrudHomePage`](../home/README.md) 渲染）。

## 两种形态（同一个声明）

| 形态 | 用法 | 说明 |
| --- | --- | --- |
| **嵌入** | 什么都不用做：[`CrudFormPage`](../form/README.md) / [`CrudDetailPage`](../detail/README.md) 检测到核心声明了 `operationDataTraceTarget` 且实体 `id` / `creationTime` 齐，就自动渲染（详情壳连分割线一起加） | 嵌入态（`variant = OPERATION_TRACE_VARIANT`）自动隐藏"审计类型 / 审计目标 / 轨迹 id"三列，时间筛选取"该记录创建之后"为默认值 |
| **整页** | `createOperationTracePage()` + `<crud-home-page :page="page" />` | 审计列表页（操作数据轨迹），全部列可见 |

**渲染条件（唯一判定）**是导出的 `isOperationTraceVisible(target, entity)`：`target` + 实体 `id` + `creationTime` 三者齐。用它的地方（本表格、页面的分割线）**都必须调这一个函数**，别各写一遍条件。

## 代码演示 {#examples}

```ts
// OperationDataTraceHome.vue（宿主整页形态）
import {CrudHomePage, createOperationTracePage} from '@loncra/antdv-pro'
import dayjs from 'dayjs'

const page = createOperationTracePage({afterDefault: dayjs().startOf('d').format('YYYY-MM-DD HH:mm:ss')})
```

```vue
<template>
  <crud-home-page :page="page" />
</template>
```

`createOperationTracePage({service?, afterDefault?})`：`service` 缺省用 `OperationDataTraceAuditEventService`；`afterDefault` 给 `timestamp` 列的时间筛选取缺省值。

嵌入态（表单 / 详情壳）只需要在核心声明里写一行：

```ts
defineHomePage(core, {...})   // core.operationDataTraceTarget: 'email'
```

## 两条约定（改代码前必读）

1. **文案在这里不做任何接管**：声明里的 `labelKey` 是**全 key**（`Crud.operationTrace.*`），走标准那条链（页面声明 → `CrudConfig.i18nResolver` = 宿主的 `i18n.global.t`）。早先这里自造过一个"相对 `Crud` 命名空间"的 resolver ⇒ 声明给的是全 key ⇒ 必然落空 ⇒ **表头显示 key 原文**（2026-09-29 宿主截图报过）。**两套解析就是这个 bug 的根源，别再往回加**。
2. **声明必须在 `setup` 里实例化**（`createOperationTracePage()` 不是模块级常量）：服务类构造期会取 `BASE_URL`，模块级执行时 client 还没建好。每挂一个本组件只建一次。

## API

### 属性 {#props}

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| target | 审计目标（核心声明的 `operationDataTraceTarget`） | string | - |
| entity | 当前实体（取 `id` / `creationTime` / 查询 `after`） | `OperationTraceEntity` | - |

### 插槽 {#slots}

| 插槽 | 说明 |
| --- | --- |
| default | 表格之后（页面想追加点内容时用）；参数 `{entity}` |

## 类型与导出 {#types}

`OperationTraceEntity` / `OperationTraceTableProps` / `OperationTraceTableSlots` 与 `OperationTraceTable` / `isOperationTraceVisible` / `OPERATION_TRACE_VARIANT` / `createOperationTracePage` 都从包根 `@loncra/antdv-pro` 导出。

## 语义化 DOM {#semantic-dom}

根是一个普通 `div`（`class` / `style` / 其余 attrs 落它身上）；内部就是 [`CrudHomePage`](../home/README.md#semantic-dom)（`plain` 形态）+ 插槽内容。

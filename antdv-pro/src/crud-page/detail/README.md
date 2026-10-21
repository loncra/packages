# CrudDetailPage 详情页壳

`defineDetailPage` 的声明翻译成 `a-descriptions`：取数、列数、操作记录块、陈旧检查都由声明驱动。

## 何时使用 {#when-to-use}

- 页面有 `*.detail.page.ts` 声明（`defineDetailPage` 产物）。
- 详情不吃"来源推导"：要预加载的枚举 / 字典在声明 `detail.enums` / `detail.dictionaryCodes` 里**显式**给。

## 代码演示 {#examples}

```ts
// audit-event.detail.page.ts（节选自宿主真实页面）
import {defineDetailPage} from '@loncra/antdv-pro'
import type {AuditEventEntity} from '@loncra/client/auth'
import {auditEventCore} from './audit-event.page'

export const auditEventDetailPage = defineDetailPage(auditEventCore, {
  column: {xxxl: 2, xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1},
  createEntity: () => ({id: '', principal: '', timestamp: 0, type: ''}),
  fields: [
    'id',
    {key: 'principal', render: (_v, e: AuditEventEntity) => e.data?.details?.metadata?.realName || e.principal},
    'timestamp',
    'type',
  ],
  getDetail: async (id, ctx) => {
    const result = await auditEventService.detail(String(id), String(ctx.extra.after ?? ''))
    return result.data ?? undefined
  },
})
```

```vue
<!-- Detail.vue -->
<template>
  <crud-detail-page v-if="ok" :id="id" :page="auditEventDetailPage" @stale="onStale">
    <template #afterDescriptions="{entity}"> …宿主自己画的块… </template>
  </crud-detail-page>
</template>
```

## 行为

- **取数**：声明写了 `detail.getDetail` 就用它（收**干净值**，`RestResult` 的拆包在声明里做；带额外查询参数的接口靠它），否则 `service.get(id)`；取不到提示"已删除"类文案。`postGetEntity` 可在展示前加工。
- **列数**：声明 `detail.column`，缺省宽屏两列、窄屏一列；`layout` 跟随 ConfigProvider 的「详情布局」（`detailLayout`），整页响应式切换。
- **操作记录块**：核心声明 `operationDataTraceTarget` + 实体 `id` / `creationTime` 三者齐才渲染（判定用 [`isOperationTraceVisible`](../operation-trace/README.md)，分割线由本壳加、值不齐时分割线也不出）。
- **陈旧检查**：切回页签时重拉比对，默认 `'overwrite'`（详情是只读的，变了直接覆盖）；有结论 `emit('stale', info)`。

## API

### 属性 {#props}

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| page | `defineDetailPage` 产物 | `CrudDetailDefinition` | 必填 |
| id | 详情主键；不传 = 不取数（纯初值渲染） | `string \| number` | - |
| contextExtra | 宿主数据，进 `PageDeclContext.extra`（`getDetail` / `postGetEntity` 的回调里能拿到） | `Record<string, unknown>` | `{}` |
| variant | 宿主形态名 | string | - |

### 事件 {#events}

| 事件 | 说明 |
| --- | --- |
| stale | 陈旧检查有结论（`'deleted'` / `'modified'`） |

### 插槽 {#slots}

| 插槽 | 说明 |
| --- | --- |
| extra | 卡片头右侧 |
| afterDescriptions | 描述列表之后、操作记录之前（"请求信息"这类按数据显隐的块画在这里）；参数 `{entity, extra, buckets, dictionaries}` |
| afterOperationDataTrace | 操作记录块之后 |

### 方法 {#methods}

| 成员 | 说明 |
| --- | --- |
| entity / buckets / dictionaries | 当前实体与已加载的来源（getter 转发保响应式） |

## 类型 {#types}

`CrudDetailPageProps` / `CrudDetailPageExpose` / `CrudDetailPageSlots` / `CrudDetailPageConstructor` 定义在本目录 `types.ts`，从包根 `@loncra/antdv-pro` 导出。

## 语义化 DOM {#semantic-dom}

根是 [`DataLoadingCard`](../../data-loading-card/README.md) 的卡片，`$attrs` 直通它；主体是 `a-descriptions`（无区域键），操作记录块见 [`OperationTraceTable`](../operation-trace/README.md#semantic-dom)。

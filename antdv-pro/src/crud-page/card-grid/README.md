# CrudCardGridPage 卡片页壳

把 `defineCardGridPage` 的声明翻译成 [`CrudCardGrid`](../../crud-card-grid/README.md) 的 props：卡片形态的列表页壳。

## 何时使用 {#when-to-use}

- 页面有 `*.home.page.ts` 卡片声明（`defineCardGridPage` 产物）。
- 不走声明、直接配 props：用 [`CrudCardGrid`](../../crud-card-grid/README.md)。
- 表格形态的同款壳：[`CrudHomePage`](../home/README.md)。

## 与表格形态的两处分道

- **没有 `columns`**：卡片外观由 `#item` 插槽自己画（不写就用内置默认卡）；
- **来源只能显式声明**：卡片没有"列上的搜索项"可推导，要预加载的枚举 / 字典在声明里写 `enums` / `dictionaryCodes`（本壳统一拉好并 expose，插槽里直接用）。

## 代码演示 {#examples}

```ts
// carousel.page.ts —— 核心
import {CarouselService} from '@loncra/client/resource'

export const carouselCore = {
  service: new CarouselService(),
  i18nPrefix: 'resourceServer.carousel',
}
```

```ts
// carousel.home.page.ts —— 卡片形态
import {defineCardGridPage} from '@loncra/antdv-pro'
import type {CarouselEntity, CarouselSavePayload} from '@loncra/client/resource'
import {carouselCore} from './carousel.page'

export const carouselHomePage = defineCardGridPage<CarouselSavePayload, CarouselEntity>(carouselCore, {
  drag: true,
  onDrop: ({sorts}, app) => {
    // 落库按业务 service 来（pro 不替业务落库）；完事刷新网格
    app.collection.fetchDataSource()
  },
})
```

```vue
<!-- Home.vue：给了 #item 就自己画卡（动作行与拖拽把手也要自己放，参数里都给了） -->
<template>
  <crud-card-grid-page :page="carouselHomePage" v-model:query="query">
    <template #item="{record, itemActions, dragEnabled, onDragStart, onDragEnd}">
      <a-card size="small" :title="record.name" @click.stop>
        <template #actions>
          <l-action-button
            size="small"
            type="text"
            always-dropdown
            :actions="itemActions"
          />
          <div v-if="dragEnabled" draggable="true" @dragstart="onDragStart($event)" @dragend="onDragEnd">
            <a-typography-text type="secondary">::</a-typography-text>
          </div>
        </template>
      </a-card>
    </template>
  </crud-card-grid-page>
</template>
```

## API

### 属性 {#props}

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| page | `defineCardGridPage` 产物 | `CrudCardGridDefinition` | 必填 |
| variant | 宿主形态名 | string | - |
| extra | 宿主数据，透传给声明回调 | `Record<string, unknown>` | `{}` |
| title | 卡片头（同 `CrudCardGrid.title`）：`false` = 不渲染 | `VNode \| boolean` | - |
| query | 预置查询条件 | `FilterRequest \| PageRequest` | - |
| plain | 内嵌形态：不要卡片壳 | boolean | `false` |

### 事件 {#events}

| 事件 | 说明 |
| --- | --- |
| add / edit / detail | 默认语义 = 按声明 `routes` 跳转；绑同名事件 = 接管 |
| drop | 落库出口：声明 `cardGrid.onDrop`（第二参 `app` 里有 `collection` 可刷新）；绑同名事件 = 接管（`$attrs` 展开在显式绑定之后） |
| deleted / action | 经 `$attrs` 直通 `CrudCardGrid` |

### 插槽 {#slots}

| 插槽 | 说明 |
| --- | --- |
| title / extra / empty | 卡片头 / 头部右侧 / 空态，直通 `CrudCardGrid` |
| item | 每张卡片：给了它内置默认卡就不渲染，`itemActions` / `dragEnabled` / `onDragStart` / `onDragEnd` 都在插槽参数里 |
| itemActions | 项内动作区域（与 `#item` 二选一时通常配 `#item` 自己放） |

### 方法 {#methods}

| 成员 | 说明 |
| --- | --- |
| fetchDataSource | 重新取数 |
| clearDataSource | 清空数据 |
| dataSource / buckets / dictionaries | 当前数据与已加载的来源（`#item` 逃生读它们，别再发一次同样的请求） |

## 类型 {#types}

`CrudCardGridPageProps` / `CrudCardGridPageExpose` / `CrudCardGridPageSlots` / `CrudCardGridPageConstructor` 定义在本目录 `types.ts`，从包根 `@loncra/antdv-pro` 导出。

## 语义化 DOM {#semantic-dom}

本壳不产生自己的节点：根就是 [`CrudCardGrid`](../../crud-card-grid/README.md#semantic-dom) 的根，`$attrs` 直通；区域表见 CrudCardGrid 的语义化 DOM。

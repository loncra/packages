# `QueryCardGrid` 卡片网格

把同一份「取数 / 分页 / 字典 / 标题 / 工具栏 / 项内动作」按卡片网格排出来的内容层：数据在 `BasicCrudQuery` 基类里，本控件只负责画网格、管选中、接拖拽。

## 何时使用 {#when-to-use}

- 要一屏看多条的列表（附件、资源、模板），表格太宽或信息该按卡片读时用它。
- 页面壳 `CrudCardGrid` / `CrudCardGridPage` 在它之上包一层「声明 → 组件」，声明里能配的是本控件的子集。
- 只要卡片壳、内容自己画：用 `BasicCrudQuery`。

## 代码演示 {#examples}

```vue
<script setup lang="ts">
import {ref} from 'vue'
import {QueryCardGrid} from '@loncra/antdv-pro'
import type {FilterRequest} from '@loncra/client/commons'
import {EmailMessageService} from '@loncra/client/message'

const service = new EmailMessageService()
const query = ref<FilterRequest>({})
</script>

<template>
  <query-card-grid v-model:query="query" :service="service" :grid-columns="4" drag />
</template>
```

不写 `#item` 时用默认卡片：标题是主键，右下角是项内动作（有权限时）与拖拽把手。

`drag` 打开后拖动只改本地顺序并抛 `drop`，持久化要自己接：`@drop="(sorts) => service.sort(sorts)"`（排序方法名各 service 不同，这里不绑死）。

## API

### 属性 {#props}

| 属性 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| service | 取数服务：有 `page` 走 `page`（`number` 缺省补 1），否则走 `find`；两者都没有则返回空、不报错 | `CollectionService` | - | - |
| fetch | 自定义取数；给了就不看 `service` | `CollectionFetch` | - | - |
| immediate | 挂载后立即取数 | boolean | `true` | - |
| refreshOnActivate | keep-alive 激活时的刷新策略，语义同基类 | `RefreshOnActivate` | `true` | - |
| title | 卡片头：`VNode` 直接用、`false` 不要卡片头、不给走默认标题 | `VNode \| boolean` | - | - |
| plain | 内嵌形态：不要卡片壳 | boolean | `false` | - |
| hasPermission | 覆盖 `CrudConfig.hasPermission`；本 prop > 配置 > 一律无权限 | `(permission: string) => boolean` | - | - |
| authority | 各动作需要的权限串（`true` = 不判） | `AuthorityProps` | - | - |
| toolbarActions | 标题右侧动作：数组 = 与默认 `add` / `deleteSelected` 合并；`false` = 整排不出 | `ToolbarActionDefinition[] \| false` | - | - |
| recordActions | 项内动作：数组 = 与默认 `edit` / `detail` / `delete` 合并；`false` = 不要 | `RecordActionDefinition[] \| false` | - | - |
| drag | 拖拽开关 + 幽灵内容：`true` = 可拖、`(record) => 内容` = 可拖且它就是幽灵、对象形态 `{dragPreview, direction}` 才认 `direction` | `CardGridDragProp` | - | - |
| gridColumns | 每行几张卡片；每项宽度按 `calc(100% / N)` 算 | number | `5` | - |
| selectable | 点卡片是否切换选中 | boolean | `true` | - |
| rowKey | 项主键（拖拽与选中的同一性判断都按它） | `TableProps['rowKey']` | `id` | - |
| pagination | 分页对象（`v-model`）；`false` 不出分页 | `TableProps['pagination']` | `{hideOnSinglePage: true, align: 'center'}` | - |
| prefixCls | 前缀，默认 `loncra-query-card-grid` | string | - | - |
| rootClass | 并入根元素的类名，位置在宿主 `class` 之前 | string | - | - |
| classes | 区域表，见 [语义化 DOM](#semantic-dom)：`card` / `spin` / `pagination`（基类三区域）+ `cardGrid.root` / `cardGrid.item` | `QueryCardGridClasses` | - | - |
| styles | 同上区域的样式表 | `QueryCardGridStyles` | - | - |
| dataSource | 当前数据（`v-model`） | `TEntity[]` | `[]` | - |
| loading | 加载态（`v-model`）；写本地立即生效并同步 `emit`，宿主不接事件也照样转圈 | boolean | `false` | - |
| query | 当前查询（`v-model`） | `FilterRequest \| PageRequest` | `{}` | - |
| selectedItems | 选中集合（`v-model`），点卡片往里写 | `TEntity[]` | `[]` | - |

`title` / `toolbarActions` / `recordActions` 三个声明里 `default: undefined` 不能省：类型带了 `Boolean`，父级「不传」会被 Vue 的布尔转换变成 `false`，语义立刻翻转。

### 事件 {#events}

| 事件 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| update:dataSource / update:loading / update:query / update:selectedItems / update:pagination | 各 `v-model` 的回写 | 对应属性类型 | - |
| action | 动作被点（工具栏自定义动作 / 项内自定义动作）。**项内动作只收自定义 `id`**：内置 `edit` / `detail` / `delete` 不发这个事件 | `(payload) => void` | - |
| add | 工具栏「新增」被点 | `() => void` | - |
| edit / detail | 项内「编辑」/「详情」被点，回传记录 | `(record: TEntity) => void` | - |
| deleted | 删除成功后抛 | `(records: TEntity[]) => void` | - |
| drop | 平铺拖拽落位：排序结果 + 目标 + 起止下标 | `(sorts, target, fromIndex, toIndex) => void` | - |

### 插槽 {#slots}

| 插槽 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| title | 卡片头，优先于 `title` prop；`title` 为 `false` 时不渲染 | `() => VNodeChild` | - |
| extra | 卡片头右侧；不给就放默认动作按钮 | `() => VNodeChild` | - |
| empty | 空态；不给用 `Empty` | `() => VNodeChild` | - |
| item | 每张卡片；不给用默认卡片 | `(slot: QueryCardGridItemSlot) => VNodeChild` | - |
| itemActions | 项内动作区域；给了就替换默认卡片右下角那组按钮 | `(slot: QueryCardGridItemActionsSlot) => VNodeChild` | - |

`item` 槽拿到 `onDragStart` / `onDragEnd`：自己画卡片又要能拖时，把它们接到自己的把手上（默认卡片的把手已经接好）。

### 方法 {#methods}

通过模板 ref 拿：

| 成员 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| fetchDataSource | 重新取数 | `() => Promise<void>` | - |
| remove | 走统一的删除确认流程 | `(records: TEntity[]) => void` | - |

## 类型 {#types}

### CardGridDragProp {#cardgriddragprop}

> `DragProp<TEntity> | {dragPreview: DragProp<TEntity>; direction: 'horizontal' | 'vertical'}`。直接写 `DragProp` 时方向按横向；要纵向（一排一张之类的排布）才用对象形态。

### QueryCardGridClasses / QueryCardGridStyles {#querycardgridclasses}

> `extends BasicCrudQueryClasses`（继承 `card` / `spin` / `pagination` 三个基类区域，原样转发给基类）+ `cardGrid?: {root?: string; item?: string}`（落本控件自己的网格容器与每一项）。`QueryCardGridStyles` 同形，`cardGrid` 的值为 `CSSProperties`。

### QueryCardGridItemSlot / QueryCardGridItemActionsSlot {#querycardgriditemslot}

> `{record, index, selected, dragEnabled, onDragStart, onDragEnd, itemActions}`；`itemActions` 版去掉 `selected`。`itemActions` 已按权限 / `visible` / 运行态解析好，`recordActions: false` 时是空数组。

`QueryCardGridProps` / `QueryCardGridEmits` / `QueryCardGridSlots` / `QueryCardGridClasses` / `QueryCardGridStyles` / `CardGridDragProp` / `CardGridDragDirection` 都从包根 `@loncra/antdv-pro` 导出。

## 语义化 DOM {#semantic-dom}

根元素由 `DataLoadingCard`（`BasicCrudQuery` 的壳）渲染：默认形态 `.ant-card`，`plain` 形态裸 `div`。根类名顺序是 `loncra-query-card-grid` → `hashId` → `cssVarCls` → `rootClass` → 宿主 `class`，`style` 也落这里。

| 区域 | 说明 |
| --- | --- |
| root | 上面那个根元素（`.ant-card` 或 `plain` 的 `div`） |
| card | 卡片壳的语义键，转发给基类的 `Card`；`plain` 下没有落点 |
| spin | 内容区 `Spin` 的语义键（基类出的那个）；`:loading="false"` 时没有落点 |
| pagination | 分页器 `Pagination` 的语义键；`:pagination="false"` 时没有落点 |
| cardGrid.root | 网格容器（所有卡片的外层） |
| cardGrid.item | 每一张卡片（`CardGrid` 的根） |

自有类名都在本控件自己画的节点上，**每个节点都带 `prefixCls` + `hashId` + `cssVarCls`**：

| 落点 | 类名 |
| --- | --- |
| 网格容器 | 上面四个片段 + `${prefixCls}-grid` |
| 空态容器 | 同上 + `${prefixCls}-grid-empty` |
| 每张卡片 | 上面四个片段 + `${prefixCls}-item` |
| 选中的卡片 | 同上 + `${prefixCls}-item-selected` |
| 拖拽把手 | 上面四个片段 + `${prefixCls}-drag-handle` |
| 拖拽幽灵 | 上面四个片段 + `${prefixCls}-drag-ghost` |

`gridColumns` 不是类名能表达的量，由根元素注入 CSS 变量 `--loncra-card-grid-columns`，样式里用它算每项宽度（变量名在 `constants.ts` 里只有一份）。

**attrs 落点**：`class` / `style` 落根（`style` 支持对象 / 数组 / 字符串，数组不会被丢）；其余 attrs 下推给基类，最终落到卡片壳上。

**无落点**：空态的 `Empty`、默认卡片里的标题与 `Typography.Text` 没有区域键，要改只能从上面的自有类名往下写选择器，或者用 `#item` 槽自己画。

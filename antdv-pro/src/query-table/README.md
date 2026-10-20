# QueryTable 表格

## 何时使用 {#when-to-use}

- 需要一个**已经接好取数 / 分页 / 字典 / 标题 / 工具栏 / 行内动作**的 antd `Table`：直接用本控件。
- 页面壳（`CrudHomePage` / `CrudTable`）在它之上再包一层「声明 → 组件」的翻译，那份声明里能配的东西是本控件的子集。
- 只要卡片壳、内容自己画：用 `BasicCrudQuery`。

本控件**只画表格**：列、筛选、拖拽列、自带标题、各种槽。数据、分页、字典、标题、动作全由 `BasicCrudQuery` 负责，本控件把它的 model 用 `v-model` 接过来，再把它 expose 的能力转发出去。

## 代码演示 {#examples}

```vue
<script setup lang="ts">
import {markRaw} from 'vue'
import {Input, Select} from 'antdv-next'
import {QueryTable} from '@loncra/antdv-pro'
import type {SearchableColumnType} from '@loncra/antdv-pro'
import type {SysRoleEntity} from '@loncra/client/resource'

const service = roleService
const columns: SearchableColumnType<SysRoleEntity>[] = [
  {key: 'name', width: 200, search: {component: markRaw(Input)}},
  {
    key: 'enabled',
    width: 100,
    search: {
      component: markRaw(Select),
      props: {options: [{label: '启用', value: true}]},
    },
  },
]
</script>

<template>
  <query-table v-model:query="query" :service="service" :columns="columns" />
</template>
```

## API

### 属性 {#props}

| 属性 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| service | 取数服务（走它自己的 `find`），必需 | `CollectionService` | - | - |
| columns | 列声明；带 `search.component` 的列会变成可筛选列（见[列筛选](#column-search)） | `SearchableColumnType[]` | `[]` | - |
| immediate | 挂载后立即取数 | boolean | `true` | - |
| refreshOnActivate | keep-alive 激活时的刷新策略，语义同基类 | `RefreshOnActivate` | `true` | - |
| title | 卡片头：`VNode` 直接用、`false` 不要卡片头、不给走默认标题 | `VNode \| boolean` | - | - |
| hasPermission | 覆盖 `CrudConfig.hasPermission`；本 prop > 配置 > 一律无权限 | `(permission: string) => boolean` | - | - |
| authority | 各动作需要的权限串（`true` = 不判） | `AuthorityProps` | - | - |
| toolbarActions | 标题右侧动作：数组 = 与默认 `add` / `deleteSelected` 合并；`false` = 整排不出 | `ToolbarActionDefinition[] \| false` | - | - |
| recordActions | 行内动作：数组 = 与默认 `edit` / `detail` / `delete` 合并；`false` = 不要（「操作」列也不补） | `RecordActionDefinition[] \| false` | - | - |
| enums / dictionaryCodes | 要预载的枚举桶（按模块分组）/ 数据字典 code | `EnumBucketRequest[]` / `(string \| undefined)[]` | - | - |
| buckets / dictionaries | 预载结果（`v-model` 回给建列的地方） | `EnumBucketsResponseBody` / `PageDictionaries` | `{}` | - |
| bordered | 透给 `Table` 的 `bordered` | boolean | `true` | - |
| plain | 内嵌形态：不要卡片壳、不要外层 `Spin`，标题与工具栏落到表格自带标题 `.ant-table-title` | boolean | `false` | - |
| fetch | 自定义取数，给了就不再走 `service.find` | `CollectionFetch` | - | - |
| drag | 拖拽开关 + 幽灵内容：`true` = 可拖、`(record) => 内容` = 可拖且它就是幽灵 | `DragProp` | - | - |
| onRow | 透给 `Table` 的 `onRow`（与拖拽接线合并，不是覆盖） | `TableProps['onRow']` | - | - |
| rowKey | 行主键 | `TableProps['rowKey']` | `id` | - |
| rowSelection | 行选择配置；`false` 不出选择列 | `TableProps['rowSelection'] \| false` | - | - |
| pagination | 分页对象（`v-model`）；`false` 不出分页 | `TableProps['pagination']` | `{hideOnSinglePage: true, align: 'center'}` | - |
| prefixCls | 前缀，默认 `loncra-query-table` | string | - | - |
| rootClass | 并入根元素的类名，位置在宿主 `class` 之前 | string | - | - |
| classes | 区域表，见 [语义化 DOM](#semantic-dom)：`card` / `spin` / `pagination` / `table` | `QueryTableClasses` | - | - |
| styles | 同上区域的样式表 | `QueryTableStyles` | - | - |
| dataSource | 当前数据（`v-model`） | `TEntity[]` | `[]` | - |
| loading | 加载态（`v-model`） | boolean | `false` | - |
| query | 当前查询（`v-model`），筛选与翻页都往里写 | `FilterRequest \| PageRequest` | `{}` | - |
| selectedRows | 选中集合（`v-model`） | `TEntity[]` | `[]` | - |

三条与声明形态有关的边界：

- **`title` / `toolbarActions` / `recordActions` 不能省 `default: undefined`**：三者类型里都带 `Boolean`，父级「不传」时 Vue 的布尔转换会把它变成 `false`，语义立刻翻转（不要卡片头 / 整排按钮不出 / 「操作」列整列不补）。
- **行选择列会自动开**：没传 `rowSelection` 且基类 `needsBulkSelection` 为真（工具栏里存在当前用户有权限的内置批量动作）时，补一个 `{fixed: true, type: 'checkbox'}`；传 `false` 才彻底关掉。
- **「操作」列会自动补**：基类 `hasRecordActions` 为真（有行内动作且有权限）时追加一列 `action`（`fixed: right`，宽 80），单元格里画 `bodyCell` 槽 + `ActionButton`。
- **`scroll` 有默认值**：所有列都带 `width` 时求和成 `{x: 总数}`，否则 `{x: 'max-content'}`；宿主传了 `scroll` 就用宿主的。

### 事件 {#events}

| 事件 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| update:dataSource / update:loading / update:query / update:selectedRows / update:pagination / update:buckets / update:dictionaries | 各 `v-model` 的回写 | 对应属性类型 | - |
| action | 动作被点（工具栏自定义动作 / 行内自定义动作），payload 由基类组装 | `(payload) => void` | - |
| add | 工具栏「新增」被点 | `() => void` | - |
| edit / detail | 行内「编辑」/「详情」被点，回传记录（`dataIndex === 'action'` 的列由本控件处理） | `(record: TEntity) => void` | - |
| deleted | 删除成功后抛 | `(records: TEntity[]) => void` | - |
| drop | 平铺拖拽落位：排序结果 + 目标 + 起止下标 | `(sorts, target, fromIndex, toIndex) => void` | - |
| treeDrop | 树形拖拽落位：额外带落点位置与树快照 | `(sorts, drag, target, payload) => void` | - |

### 插槽 {#slots}

| 插槽 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| title | 卡片头（`plain` 时落到表格自带标题），优先于 `title` prop | `() => VNodeChild` | - |
| extra | 卡片头右侧；不给就放默认动作按钮 | `() => VNodeChild` | - |
| bodyCell | 单元格；「操作」列会先渲染它再追加动作按钮 | `(args: {text, record, index, column}) => VNodeChild` | - |
| expandedRowRender | 展开行内容 | `(args: {record, index, indent, expanded}) => VNodeChild` | - |

`plain` 时标题必须挂在表格自己身上（`.ant-table-title`）：antd 对嵌套表会整体偏移 `.ant-table-wrapper:only-child .ant-table`，标题若留在卡片头就会与表格错位。

### 方法 {#methods}

通过模板 ref 拿，`$props` 之外还有：

| 成员 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| fetchDataSource | 重新取数 | `() => Promise<void>` | - |
| remove | 走统一的删除确认流程 | `(records: TEntity[]) => void` | - |
| hasRecordActions | 是否可能画出行内动作（**值，不是 ref**） | boolean | - |
| needsBulkSelection | 是否需要行选择列（**值，不是 ref**） | boolean | - |

后两个是 getter 转发基类的当前值，写 `.value` 只会拿到 `undefined`。

## 类型 {#types}

### ColumnSearchConfig {#columnsearchconfig}

> `{component?, props?, expression?, queryName?, defaultValue?}`

### SearchableColumnType {#searchablecolumntype}

> `ColumnType<TEntity> & {search?: ColumnSearchConfig}`。列 `key` 是**实体字段名**（`readPath` / `renderCell` 按它匹配）。

### QueryTableClasses / QueryTableStyles {#querytableclasses}

> 区域表：基类的 `card` / `spin` / `pagination` + 本控件的 `table`（antd `Table` 的语义键）。

`QueryTableProps` / `QueryTableClasses` / `QueryTableStyles` / `QueryTableEmits` / `QueryTableSlots` / `QueryTableConstructor` / `ColumnSearchConfig` / `SearchableColumnType` 都从包根 `@loncra/antdv-pro` 导出。

## 列筛选 {#column-search}

列上写 `search.component` 就变成可筛选列，本控件把 antd 原生的筛选下拉（`filterDropdown = () => null`）换成自绘的一张卡：搜索组件 + 三个按钮（搜索 / 重置 / 清空）。

- **`queryName` 不写会自动生成**：`filter_[<表字段名>_<expression || 'eq'>]`。表字段名只把列 `key` 的**第一段**做 camelCase → snake_case（`authMode` → `auth_mode`），点后面的段不转（后端嵌套段走实体 / JSON 属性，本来就是 camelCase）。已经有显式 `queryName` 的列不做映射。
- **`defaultValue` 只在第一次建列时写进 `query`**，之后重建列不会覆盖用户改过的值。
- **回车即搜索**：焦点在 `input` 上按 Enter 触发（`textarea`、可编辑元素、`ant-select` / `ant-picker` 内部的输入、`button` / `checkbox` / `radio` 都不算），`Shift+Enter` 不触发。

## 语义化 DOM {#semantic-dom}

根元素是 `BasicCrudQuery` 的根：默认形态 `.ant-card`，`plain` 形态它自己的 `div`。根类顺序 `${prefixCls}` → `hashId` → `cssVarCls` → `rootClass` → 宿主 `class`，`style` 也落这里；根上同时还有基类的 `loncra-basic-crud-query` 与 `loncra-data-loading-card`（它是那一层的根）。

| 区域 | 说明 |
| --- | --- |
| root | 上面那个根元素（`.ant-card` 或 `plain` 的 `div`） |
| card | 卡片形态下 `Card` 的语义键；`plain` 下没有落点 |
| spin | 内容区 `Spin` 的语义键；本控件不关 `Spin`，卡片形态下恒存在 |
| pagination | 分页器 `Pagination` 的语义键；`:pagination="false"` 时没有落点 |
| table | antd `Table` 的语义键，原样透传：`root` / `section` / `title` / `footer` / `content`，嵌套的 `header.*` / `body.*`（`wrapper` / `cell` / `row`）与 `pagination.*` |

自有类名都在本控件自己画的节点上：

| 落点 | 类名 |
| --- | --- |
| `plain` 时的表格自带标题 | `${prefixCls}` + `hashId` + `cssVarCls` + `${prefixCls}-table-title` |
| 筛选下拉面板 | `${prefixCls}` + `hashId` + `cssVarCls` + `${prefixCls}-filter-dropdown` |
| 筛选图标的激活态 | `${prefixCls}` + `hashId` + `cssVarCls` + `${prefixCls}-filter-icon-active` |
| 拖拽把手 | `${prefixCls}` + `hashId` + `cssVarCls` + `${prefixCls}-drag-handle` |
| 拖拽幽灵 | `${prefixCls}` + `hashId` + `cssVarCls` + `${prefixCls}-drag-ghost` |

样式文件里只有 5 组规则：表格头/内容圆角归零、`.ant-table-title` 的一行 flex、筛选图标激活色、拖拽把手与幽灵、筛选面板内边距。

**已知与「其余 attrs 展开在根上」的偏差**：除 `class` / `style` 之外的 attrs（`scroll` / `expandable` / `id` / `data-*` …）仍落在内部 `<Table>` 上，不是根。这样 `scroll` / `expandable` 这类未声明成 props 的表格参数不用逐个升格；要定位到根请用 `class` / `rootClass` / `classes`。

**无落点**：`Space` / `SpaceCompact` / 筛选面板里的三个 `Button` / `Typography.Text` / 筛选图标本身都没有区域键，要改只能从上面的自有类名往下写选择器。

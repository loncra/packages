# `BasicCrudQuery` 集合底座

集合页的公共内核：取数、分页、字典、权限与动作都在这里，真正的表格 / 卡片由默认插槽里的形态组件自己画。

## 何时使用 {#when-to-use}

- **扩展点**：要一种新形态（时间轴、看板、甘特……）时复用它 —— 数据与动作那一层不必重写。`QueryTable` 与 `QueryCardGrid` 就是这么接的。
- **它能给你**：`v-model` 化的 `dataSource` / `loading` / `query` / `pagination` / 选中 / 字典；默认工具栏（新增、批量删除）与默认行内动作（编辑、详情、删除）；`plain` 时把标题和工具栏交给内容的插槽作用域。
- **它不画业务内容**：默认插槽空着时，只剩一张空卡片 + 一条分页。

## 代码演示 {#examples}

### 形态组件怎么接（`QueryTable` 的骨架）

```tsx
<BasicCrudQuery
  ref={basic}
  {...attrs}
  service={props.service}
  immediate={props.immediate}
  refreshOnActivate={props.refreshOnActivate}
  title={props.title}
  hasPermission={props.hasPermission}
  authority={props.authority}
  toolbarActions={props.toolbarActions}
  recordActions={props.recordActions}
  enums={props.enums}
  dictionaryCodes={props.dictionaryCodes}
  selectedKey="selectedRows"
  prefixCls={props.prefixCls}
  plain={props.plain}
  fetch={props.fetch}
  dataSource={dataSource.value}
  loading={loading.value}
  query={query.value}
  selectedRows={selectedRows.value}
  pagination={tablePagination.value}
  buckets={buckets.value}
  dictionaries={dictionaries.value}
  onUpdate:dataSource={(value) => (dataSource.value = value)}
  onUpdate:loading={(value) => (loading.value = value)}
  onUpdate:query={(value) => (query.value = value)}
  onUpdate:selectedRows={(value) => (selectedRows.value = value)}
  onUpdate:pagination={(value) => (tablePagination.value = value)}
  onUpdate:buckets={(value) => (buckets.value = value)}
  onUpdate:dictionaries={(value) => (dictionaries.value = value)}
  onAction={(payload) => emit('action', payload)}
  onAdd={() => emit('add')}
  onEdit={(record) => emit('edit', record)}
  onDetail={(record) => emit('detail', record)}
  onDeleted={(records) => emit('deleted', records)}
  v-slots={{
    title: slots.title ? () => slots.title?.() : undefined,
    default: (content) => (
      <Table
        title={content.title ? () => content.title : undefined}
        dataSource={dataSource.value}
        loading={loading.value}
        pagination={false}
      />
    ),
  }}
/>
```

三处不能省：

- `Table` 必须传 `pagination={false}` —— 分页由内核统一渲染，不关掉会出现两个分页器。
- 转发 `title` 槽 —— 否则宿主的 `#title` 到不了卡片头（`QueryTable` 就是这么做的）。
- 各 `v-model` 都要接住并回写 —— 内核只在"受控"时以宿主为准，漏掉哪个哪个就停在初值（详见 `loading` 一行）。

### 自画内容的最小用法

```tsx
<BasicCrudQuery ref={base} service={service} plain>
  <MyTimeline :items="dataSource" />
</BasicCrudQuery>
```

`plain` 时没有卡片壳，但遮罩照旧由基类出：`loading` 为真时 `DataLoadingCard` 的 `Spin` 包住整块内容（含分页）。注意**分页仍然会渲染**：默认 `pagination` 是对象，只有显式 `:pagination="false"` 才不出。

## API

### 属性 {#props}

| 属性 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| service | 集合服务，`find` 走它取数。**即使给了 `fetch` 也必填** —— 默认删除动作的可用性还看它的 `delete` | `CollectionService` | 必填 | - |
| immediate | 挂载后是否立刻取数（字典无条件先加载） | boolean | `true` | - |
| refreshOnActivate | keep-alive 切回时的行为：`true` 自动重取、`false` 不刷、函数完全接管（内核不再自动取数） | [RefreshOnActivate](#refreshonactivate) | `true` | - |
| title | 四级命中：`false` > `#title` 槽 > 本 prop > `CrudConfig.resolveDefaultTitle()`。`false` 时**连宿主的 `#extra` 槽一起关**（右侧工具栏也消失） | `VNode \| boolean` | - | - |
| hasPermission | 权限判定口。命中顺序：本 prop **覆盖** `CrudConfig.hasPermission`；两者都没有则一律 `false`（fail-closed） | `(permission: string) => boolean` | - | - |
| authority | 默认动作各自的权限串。**`undefined` / `false` 表示"没有权限"**，永远显示要显式写 `true` | [AuthorityProps](#authorityprops) | - | - |
| toolbarActions | 标题右侧动作；给数组则先与默认的 `add` / `deleteSelected` 合并（同 id **逐字段**覆盖）；`false` 整个右侧不出 | `ToolbarActionDefinition[] \| false` | - | - |
| recordActions | 行内 / 项内动作；规则同上，默认 `edit` / `detail` / `delete`；`false` 时形态组件不会补"操作"列 | `RecordActionDefinition[] \| false` | - | - |
| fetch | 自定义取数；给了就不再走 `service.find` | `CollectionFetch` | - | - |
| plain | 不要卡片壳，标题 / 工具栏改由默认插槽作用域下发 | boolean | `false` | - |
| selectedKey | 选中集合挂哪个 prop（形态组件固定传） | `'selectedRows' \| 'selectedItems'` | `'selectedRows'` | - |
| dataSource | 当前数据（`v-model`） | `TEntity[]` | `[]` | - |
| loading | 加载态（`v-model`），为真时内容区 `Spin` 遮住内容 + 分页；受控判定同 `DataLoadingCard` | boolean | `false` | - |
| query | 当前查询（`v-model`），翻页会往里写 `number` / `size` | `FilterRequest \| PageRequest` | `{}` | - |
| pagination | 分页对象（`v-model`）；`false` 不渲染分页。里面的 `onChange` 会被内核覆盖 | `TableProps['pagination']` | `{hideOnSinglePage: true, align: 'center'}` | - |
| selectedRows / selectedItems | 选中集合（`v-model`），按 `selectedKey` 取其中一个 | `TEntity[]` | `[]` | - |
| enums | 要预载的枚举桶，按模块分组 | [EnumBucketRequest](#enumbucketrequest)[] | - | - |
| dictionaryCodes | 要预载的数据字典 code | `(string \| undefined)[]` | - | - |
| buckets / dictionaries | 预载结果（`v-model` 回给建列的地方） | `EnumBucketsResponseBody` / `PageDictionaries` | `{}` | - |
| prefixCls | 前缀，默认 `loncra-basic-crud-query` | string | - | - |
| rootClass | 并入根元素（`DataLoadingCard`）的类名，位置在宿主 `class` 之前 | string | - | - |
| classes | 区域表，见 [语义化 DOM](#semantic-dom)：`card` / `spin` / `pagination` | `BasicCrudQueryClasses` | - | - |
| styles | 同上区域的样式表 | `BasicCrudQueryStyles` | - | - |

`drag` / `rowKey` 只出现在 `QueryCollectionProps` 类型里，**本组件的 props 没有声明它们**（真正消费的是 `QueryTable`）。所以 TSX 不报错，但传进来只会当普通属性落到根元素上（`plain` 时那个 `div` 上会出现 `drag="true"` 之类），不驱动任何行为。

随属性走的几条边界：

- **"受控"只在宿主同时给了值与对应的 `update:*` 时成立**：只给值不接事件时，`useModel` 会留本地副本，宿主传的值只当初始值。
- **`selectedKey` 在 `setup` 时绑定**：运行中从 `selectedRows` 改成 `selectedItems` 不会重绑。
- **同 id 覆盖是逐字段合并**：自定义 `{id: 'add', run}` 只换 `run`，`permission` 仍是 `authority?.add` ⇒ 没配 `authority` 的按钮依旧不显示。
- **字典失败会连累取数**：`onPlanMounted` 先 `await loadDictionaries()` 再取数，没有 `try/catch` ⇒ 字典接口挂了列表一片空，错误冒成未处理拒绝。
- **取数失败不兜底**：`fetchDataSource` 只有 `try/finally`，没有 `catch`；宿主的 axios 层已统一 `message.error`，这里不重复提示、也不吞错。
- **`refreshOnActivate` 的三条**：只在 keep-alive 内触发；任务还在跑（`running` 未清）时切回会被忽略；首次 `activated` 恒定跳过 ⇒ `immediate: false` + keep-alive 的首屏一次都不取数。函数形态返回的 Promise 只被用来置位/复位 `loading`，reject 不会被接住。

### 事件 {#events}

| 事件 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| update:dataSource / update:loading / update:query / update:pagination / update:selectedRows / update:selectedItems / update:buckets / update:dictionaries | 各 `v-model` 的回写 | 对应属性类型 | - |
| action | 两处来源：① 内置「新增」（`{id: 'add', context}`，工具栏上下文）② **行内**自定义动作（记录上下文）。**自定义工具栏动作不抛** —— 内核渲染工具栏 `ActionButton` 时没接 `onAction`，那些动作只执行自己的 `run`。内置 id（`edit` / `detail` / `delete`）也不抛 | `(payload) => void` | - |
| add | 工具栏「新增」被点 | `() => void` | - |
| edit / detail | 行内「编辑」/「详情」被点，回传记录 | `(record: TEntity) => void` | - |
| deleted | 删除**成功后**抛，回传被删记录；失败走 `message.error`，不抛 | `(records: TEntity[]) => void` | - |

同一件事通常有两条路，**选一条**：行内自定义动作既会执行 `run` 又会抛 `action`，两处都写同一个处理就等于执行两次。

- **删除链路**：确认 → `service.delete` 成功 → 抛 `deleted` → 自动重新取数；失败只 `message.error`，不抛。
- **行内动作别用内置 id**：`onRecordAction` 只按 id 判，自定义动作叫 `edit` / `detail` / `delete` 时 `action` 事件会被静默吞掉（`run` 照常执行）。

### 插槽 {#slots}

| 插槽 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| default | 内容（形态组件）。`plain` 时带作用域 `{title, extra}`，非 `plain` 时作用域为空 | `(content) => VNodeChild` | - |
| title | 页面自带标题，优先于 `title` prop（`title: false` 时连它一起忽略） | `() => VNodeChild` | - |
| extra | 标题右侧；不给就放默认动作按钮。`QueryTable` 与 `QueryCardGrid` 都转发 | `() => VNodeChild` | - |

### 方法 {#methods}

通过模板 ref 拿（`BasicCrudQueryExpose`）：

| 成员 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| fetchDataSource | 重新取数（先置 `loading`，结束后抛 `update:pagination`） | `() => Promise<void>` | - |
| remove | 走统一的删除确认流程。空数组直接返回；service 不能删时静默什么都不做 | `(records: TEntity[]) => void` | - |
| resolveRecordActions | 解析某条记录的行内动作（已按权限过滤），形态组件画「操作」列用它 | `(record: TEntity) => ResolvedAction[]` | - |
| onRecordAction | 行内动作点击后转发（内置 id 直接忽略） | `(id: string, record: TEntity) => void` | - |
| hasRecordActions | 是否可能画出行内动作（**值不是 ref**）。只看权限，不看数据 | boolean | - |
| needsBulkSelection | 是否需要自动开行选择列：工具栏里存在**且当前用户有权限**的内置批量动作。**不看 service 是否可删、也不看有没有选中** | boolean | - |

`hasRecordActions` / `needsBulkSelection` 是 getter 暴露的**当前值**：Vue 的 `expose` 会自动解包 ref，写 `.value` 只会拿到 `undefined`。

## 类型 {#types}

### RefreshOnActivate {#refreshonactivate}

> `boolean | (() => void | Promise<void>)`

### AuthorityProps {#authorityprops}

> `{add?, edit?, detail?, delete?}`，每项 `string | boolean`。`undefined` / `false` = 没权限；`true` = 不判权限。

### EnumBucketRequest {#enumbucketrequest}

> `{module: string, ids: string[]}`。**必须给模块**：桶按"模块 + 枚举 id"索引，只给 id 查不到。

### BasicCrudQueryContentProps {#basiccrudquerycontentprops}

> `{title?: VNodeChild, extra?: VNodeChild}` —— `plain` 时 `default` 插槽的作用域。

`BasicCrudQueryProps` / `BasicCrudQueryClasses` / `BasicCrudQueryStyles` / `BasicCrudQueryEmits` / `BasicCrudQuerySlots` / `BasicCrudQueryExpose` / `QueryCollectionProps` / `AuthorityProps` / `EnumBucketRequest` 从包根 `@loncra/antdv-pro` 导出；**`RefreshOnActivate` 与 `BasicCrudQueryContentProps` 目前只在子路径 `./basic-crud-query` 里**（`QueryTable` 就是这么取的）。

## 语义化 DOM {#semantic-dom}

根元素就是 `DataLoadingCard`：默认形态 `.ant-card`，`plain` 形态它自己的 `div`。两种形态的根上都挂同一串类，顺序是 `${prefixCls}` → `hashId` → `cssVarCls` → `rootClass` → 宿主 `class`，`style` 也落这里；其余 attrs 全量落到这个根上。

`DataLoadingCard` 自己也会把 `loncra-data-loading-card` 连同它的 `hashId` / `cssVarCls` 挂到**同一个元素**上（它就是那层的根），所以根上有两个前缀类。

| 区域 | 说明 |
| --- | --- |
| root | 上面那个根元素（`.ant-card` 或 `plain` 的 `div`） |
| card | 转手给 `DataLoadingCard` 的 `classes.card` / `styles.card`：卡片形态下生效，`plain` 下没有落点 |
| spin | 内容区那个 `Spin` 的语义键（`DataLoadingCard` 的 `spin` 默认开）：`loading` 为真时遮住内容 + 分页，`plain` 下同样有 |
| pagination | 分页器 `Pagination` 的语义键原样透传；`:pagination="false"` 时没有落点 |

自有类名两处，样式规则只有一条 `marginTop`：

| 落点 | 类名 |
| --- | --- |
| 根元素 | `${prefixCls}`（没有带后缀的自有类） |
| 分页的 antd 根 `.ant-pagination` | `${prefixCls}` + `hashId` + `cssVarCls` + `${prefixCls}-pagination` |

`prefixCls` 默认 `loncra-basic-crud-query`（`getPrefixCls('basic-crud-query', props.prefixCls ?? 'loncra-basic-crud-query')`）：宿主 `ConfigProvider` 的 `prefixCls` 只有在组件自己的 `prefixCls` **为空**时才生效。形态组件不传 `prefixCls` 时（`QueryCardGrid` 就没传），分页类名与网格前缀不同源。

`plain` 下 `classes.card` / `styles.card` 静默失效（没有 `Card` 可落），标题与工具栏也不再进卡片头 —— 它们通过默认插槽的作用域 `{title, extra}` 交给内容，不消费就没人渲染。


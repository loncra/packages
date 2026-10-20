# `DataLoadingCard` 加载卡片

给「取数 → 渲染」这一层包一张卡片：消费者把取数函数交给两个时机口，卡片负责跑它、点亮 `loading`、并在内容区转圈。

## 何时使用 {#when-to-use}

- **页面级取数**：`BasicCrudQuery`（列表底座）、`CrudFormPage`（表单页）、`CrudDetailPage`（详情页）都用它当外壳。
- **要卡片头 + 内容区遮罩**：`title` 交给它（或让 `CrudConfig.resolveDefaultTitle()` 兜），`#extra` 放右上角动作。
- **只要取数编排、不要卡片壳**：传 `plain` —— 弹层里不该再套一张卡。`CrudFormPage` 的 `plain` 正是弹层形态。

它不认识内容：加载什么全由消费者通过 `onMounted` / `onActivated` 交进来。

## 代码演示 {#examples}

### 列表底座（`BasicCrudQuery`）

```tsx
<DataLoadingCard
  {...attrs}
  loading={loading.value}
  onUpdate:loading={(value: boolean) => (loading.value = value)}
  onMounted={onPlanMounted}
  onActivated={onPlanActivated}
  plain={props.plain}
  spin={false}
  title={props.title}
  v-slots={{
    title: !props.plain && slots.title ? () => slots.title?.() : undefined,
    extra: props.plain ? undefined : () => slots.extra?.() ?? <ActionButton actions={toolbarActions.value} />,
    default: () => content,
  }}
/>
```

列表自带 `loading`，所以 `spin={false}`，避免两层遮罩。`plain` 时标题与工具栏不再进卡片头，而是通过默认插槽的作用域参数交给内容（`QueryTable` 把它们落到 `Table.title`）—— 所以示例里的 `content` 不是"什么都没有的裸内容"。

### 表单页（`CrudFormPage`）

```tsx
<DataLoadingCard
  {...(attrs as Record<string, unknown>)}
  plain={props.plain}
  title={props.title}
  loading={spinning.value}
  onUpdate:loading={(value: boolean) => (spinning.value = value)}
  onMounted={load}
  onActivated={checkStale}
>
  <Form model={entity.value} />
</DataLoadingCard>
```

表单页要用 `loading` 驱动保存按钮，所以自己持有 `spinning` 并接住 `update:loading`（受控写法）。

### 详情页（`CrudDetailPage`）

```tsx
<DataLoadingCard
  {...(attrs as Record<string, unknown>)}
  onMounted={load}
  onActivated={checkStale}
  v-slots={{
    extra: slots.extra ? () => slots.extra?.() : undefined,
    default: () => <Descriptions bordered items={items.value} />,
  }}
/>
```

详情页**不传 `loading`**：走组件内部的本地兜底（非受控），也就不用担心外部值把复位权抢走；也不传 `title`，卡片头交给宿主注入的 `resolveDefaultTitle()`。

### 模板写法

```vue
<l-data-loading-card
  v-model:loading="loading"
  :on-mounted="load"
  :on-activated="checkStale"
/>
```

`onMounted` / `onActivated` 是 **prop 名**，不是 Vue 的生命周期钩子；模板里写 `:on-mounted`（`@mounted="load"` 编译结果相同，但读起来更像生命周期，别用）。

## API

### 属性 {#props}

| 属性 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| loading | 加载态。任务执行期间由本组件点亮、`try/finally` 复位；**同一时刻只跑一个任务**（`running` 未清空时再触发会被忽略）。受控规则见下方说明 | boolean | `false` | - |
| onMounted | 挂载时执行的任务。**命名与 Vue 生命周期同名**，模板写 `:on-mounted` | [DataLoadingTask](#dataloadingtask) | - | - |
| onActivated | keep-alive 切回时执行的任务。**只在被 `keep-alive` 缓存时才会触发**；且首次 `activated` 不执行（那是同一轮挂载，留给 `onMounted`）⇒ 只传这个、不传 `onMounted` 时首屏不会取数 | [DataLoadingTask](#dataloadingtask) | - | - |
| title | 卡片头。优先级：`false` > `#title` 槽 > 本 prop > `CrudConfig.resolveDefaultTitle()`。传 `false` 时**连 `#title` 槽一起忽略**；传 `true` 等于空标题（没有意义） | `VNode \| boolean` | - | - |
| plain | 不渲染 `Card`，只留一个裸 `div`；不消费 `title` / `#extra`。**不改变 `Spin` 行为**，是否转圈仍只看 `spin` | boolean | `false` | - |
| spin | 内容区是否套 `Spin`。`false` 用于"内容自带加载态"（CRUD 列表） | boolean | `true` | - |
| rootClass | 并入根元素的类名，位置在宿主 `class` 之前 | string | - | - |
| classes | 区域表，见 [语义化 DOM](#semantic-dom)：`card` / `spin` | `DataLoadingCardClasses` | - | - |
| styles | 同上区域的样式表 | `DataLoadingCardStyles` | - | - |
| class / style | 未声明，走 attrs：与 `rootClass` 一起落到根元素（卡片形态 = `.ant-card`，`plain` = 自己的 `div`） | - | - | - |

`title` 的 prop 声明里 `default: undefined` **不能删**：类型带了 `Boolean`，父级「不传」会被 Vue 的布尔转换变成 `false`，那就成了「不要卡片头」，`resolveDefaultTitle` 永远不会执行。

`loading` 的受控规则（Vue `useModel`）：

- **同时**传 `loading` 与 `onUpdate:loading`（含 `v-model:loading`）= 受控：内部只 emit，宿主不回写就一次都不会转。
- 只传 `loading`、不接事件 = 非受控：内部写自己的工作副本，宿主传的值只当初始值。
- `BasicCrudQuery` / `CrudFormPage` 是受控写法，`CrudDetailPage` 是非受控。

### 事件 {#events}

| 事件 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| update:loading | 任务开始 / 结束时抛 | `(value: boolean) => void` | - |

### 插槽 {#slots}

| 插槽 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| default | 卡片内容区 | `() => VNodeChild` | - |
| title | 卡片头，优先于 `title` prop；`title === false` 时不看它 | `() => VNodeChild` | - |
| extra | 卡片右上角，只在卡片形态渲染（`plain` 下整块不消费） | `() => VNodeChild` | - |

## 类型 {#types}

### DataLoadingTask {#dataloadingtask}

> `() => unknown | Promise<unknown>`。同步、异步都接受；返回的 Promise **不被本组件接住错误**（见下方边界）。

```ts
const load: DataLoadingTask = async () => {
  await fetchEntity()
}
```

`DataLoadingCardProps` / `DataLoadingCardClasses` / `DataLoadingCardStyles` / `DataLoadingCardSlots` / `DataLoadingCardEmits` 与 `DataLoadingTask` 都从包根 `@loncra/antdv-pro` 导出。

## 语义化 DOM {#semantic-dom}

两种形态，根元素不同，但**挂类契约一致**：

| 形态 | 根元素 | attrs 落点 | 根上挂什么 |
| --- | --- | --- | --- |
| 默认（卡片） | `.ant-card` | `.ant-card` 根，**全量透传**：`variant` / `size` / `hoverable` 等都真生效 | `loncra-data-loading-card` + `hashId` + `cssVarCls` + `rootClass` + 宿主 `class` |
| `plain` | 自己的 `div` | 那个 `div` | 同上 |

| 区域 | 说明 |
| --- | --- |
| root | 上面两种形态的根元素：`prefixCls` → `hashId` → `cssVarCls` → `rootClass` → 宿主 `class`，`style` 也落这里 |
| card | 卡片本体 `Card` 的语义键原样透传（`classes.card.body` 之类），**只在这个形态存在**；`plain` 下没有落点 |
| spin | 内容区 `Spin` 的语义键原样透传；`spin={false}` 时没有落点 |

两种形态下不等价的是 **`classes.card` / `styles.card`**：Card 专属参数，`plain` 下没有 `Card` 可落，静默失效。宿主若想贴边写 `:classes="{card: {body: 'p-0!'}}"`，只在卡片形态生效。

`prefixCls` **恒为 `loncra-data-loading-card`**：`getPrefixCls('data-loading-card', 'loncra-data-loading-card')` 的第二个参数是 customize 覆盖值（非空直接返回，见 `antdv-next/dist/config-provider/context.js` 的 `defaultGetPrefixCls`），所以宿主 `ConfigProvider` 的 `prefixCls` 改不动它。

唯一的自有类名 `${prefixCls}-spin`：

| 落点 | 规则 |
| --- | --- |
| 卡片形态里的 `Spin` 根（同时带 `hashId` / `cssVarCls`） | `display:block; width:100%; height:100%`，内部 `.ant-spin-container` **显式设为** `height:100%`（不是继承）。真正"撑满"要宿主给卡片/body 高度，否则只有 `display:block; width:100%` 生效 |
| `plain` 形态里的 `Spin` | **不挂**这个类，也不带 `hashId` / `cssVarCls` ⇒ 撑满规则在该形态下不生效 |

其它 DOM 事实：

- `spin` 为 `true` 时，内容**恒定**包在 `.ant-spin > .ant-spin-container` 里（不转圈时也在）⇒ 选择器写 `.ant-card-body > .ant-spin > …` 才稳。
- 卡片头（`.ant-card-head`）只在"标题可渲染、`#extra` 有内容、或传了 `tabList`"时出现（`antdv-next/dist/card/Card.js:115`）：`title === false` 且没有 `#extra` ⇒ 连 head 都不渲染；`title === false` 但有 `#extra` ⇒ head 出来、里面只有 extra。
- 没有弹层、没有传送到 body 的节点。

几处边界：

- **任务抛错不接住**：`run()` 里的异步包装只有 `try/finally`，没有 `catch` ⇒ 宿主任务 reject 会变成未处理拒绝，界面也不会给提示。宿主自己 `try/catch` 并决定提示方式。
- **没有取消机制**：`run()` 只做"忽略"不做"中止"，任务拿不到 `AbortSignal`、卸载也不取消 ⇒ 旧请求晚到会覆盖新状态，竞态得宿主自己去重（`CrudDetailPage` 用 `useStaleCheck` 补的就是这个）。
- **只传 `onActivated` 的首屏缺口**：首次 `activated` 恒定跳过，若同时没有 `onMounted`，首屏一次都不跑。
- **`plain` 下只剩根可定制**：`Spin` 不挂 `${prefixCls}-spin`（那条撑满规则在该形态不生效），`classes.card` / `styles.card` 也没有落点；要定位内容只能从根往下写选择器。
- **`title` 传 `true`** 会渲染出空标题（`true` 不是 VNode），要「不要标题」请传 `false`。

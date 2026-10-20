# `KeyValueTable` 键值表格

行内可编辑的键值对表格：新增、编辑、取消、删除，提交前可把仍在编辑态的行一次性收口。

## 何时使用 {#when-to-use}

- 表单里需要维护一组「名称 → 值」，条数不固定。
- 值只有一项时用普通输入；一项或多项混用时开 `multipleValue`。

## 代码演示 {#examples}

### 表单字段

```vue
<a-form :model="form">
  <l-key-value-table
    v-model:value="form.headers"
    :form-item-name-prefix="['headers']"
    title="请求头"
    multiple-value
  />
</a-form>
```

`formItemNamePrefix` 决定单元格里 `FormItem` 的 `name`，必须与 `model` 上的路径一致，校验结果才会挂到对应行上。

### 提交前收口编辑态

```ts
const tableRef = ref<KeyValueTableExpose>()

async function submit() {
  tableRef.value?.confirmAllEditingRows()
  await save(form.headers)
}
```

## API

### 属性 {#props}

| 属性 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| value | 行数据，配合 `v-model:value` | [KeyValueRow[]](#keyvaluerow) | `[]` | - |
| formItemNamePrefix | 编辑态单元格 `FormItem` 的 `name` 前缀，完整 `name` 是 `[...前缀, index, 'key' 或 'value']` | string[] | `[]` | - |
| title | 标题栏文案；只有标题栏存在时才有「新增」按钮（空串等同没有） | string | - | - |
| multipleValue | 值列用 `mode="tags"` 的 `Select`，值存成 `string[]`；新增行的初值是空数组（单值模式给空字符串） | boolean | `false` | - |
| edit | 是否可编辑；关掉后没有编辑 / 删除 / 新增入口。**数据行自带 `editing: true` 时不要关它**：操作列消失、单元格仍是编辑器，这一行会卡在编辑态 | boolean | `true` | - |
| prefixCls | 改根前缀 | string | -（组件内兜底 `loncra-key-value-table`） | - |
| rootClass | 追加到根元素 | string | - | - |
| classes | 语义化 DOM 类名表，区域见 [语义化 DOM](#semantic-dom) | `KeyValueTableClasses` | - | - |
| styles | 语义化 DOM 样式表，区域与 `classes` 相同 | `KeyValueTableStyles` | - | - |

`prefixCls` 不传时组件内部用的是非空兜底（`loncra-key-value-table`），因此 `ConfigProvider` 的全局 `prefixCls` **不会**影响它。

`class` / `style` 未声明，走 attrs，二者落在根 `div` 上；其余 attrs 透传给内部 `Table`。

### 事件 {#events}

| 事件 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| update:value | 值变化。**只在新增加 / 删除行时触发**（这两处会换一个新的数组） | `(value: KeyValueRow[]) => void` | - |
| change | 行变更后触发：删除、确认编辑、取消编辑。**新增不发** `change` | `(item: KeyValueRow, data: KeyValueRow[]) => void` | - |

单元格内的修改是**原地写回行对象**的，所以"改了一个字"只会发 `change`，不会发 `update:value`。宿主两条都要听：新增 / 删除以 `update:value` 为准，单元格编辑与确认 / 取消以 `change` 为准。

### 插槽 {#slots}

| 插槽 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| title | 自定义标题栏；入参是 `title` 属性。没有 `title` 也没有这个插槽时，标题栏（连同「新增」按钮）都不渲染 | `(ctx: { title?: string }) => any` | - |

### 方法 {#methods}

| 方法 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| confirmAllEditingRows | 把仍在编辑态的行逐行确认（每行发一次 `change`）。**不发 `update:value`**、也不做校验（提交链路上表单校验已经先跑过） | `() => void` | - |

「确定」按钮（操作列的 `✓`）会先用外层 `Form` 的 `validateFields` 校验本行「名称」「值」两个单元格，未通过就留在编辑态，错误沿用 `TooltipValidationFormItem` 的提示；组件不在 `Form` 内时拿不到表单实例，按原样直接确认。

## 类型 {#types}

### KeyValueRow {#keyvaluerow}

| 属性 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| id | 行标识，新增时由组件用 `crypto.randomUUID()` 生成 | string | - | - |
| key | 名称列的值 | string | - | - |
| value | 值列的值；`multipleValue` 为真时是 `string[]` | string[] \| string | - | - |
| editing | 是否处于编辑态 | boolean | - | - |
| origin | 进入编辑时的快照，仅编辑期间存在；取消编辑用它回滚 | [KeyValueRow](#keyvaluerow) | - | - |

## 语义化 DOM {#semantic-dom}

| 区域 | 说明 |
| --- | --- |
| root | 根元素 `div`（本组件自己的）：`loncra-key-value-table` + `hashId` + `cssVarCls` + `rootClass` + 宿主 `class`，`style` 也落这里 |
| table | 内部 `Table`（`bordered`、`pagination=false`、`scroll.y=275`、`rowKey="id"`） |
| title | 表头上那一行 `Flex`：「标题 + 新增按钮」；`title` 属性与 `title` 插槽都没有时不渲染 |
| keyInput | 编辑态名称列的 `Input` |
| valueInput | 编辑态值列的 `Input`（`multipleValue` 为假时） |
| valueSelect | 编辑态值列的 `Select`（`multipleValue` 为真时），自有类名 `-value-select` |
| action | 操作列的按钮组 `SpaceCompact`（编辑态「确定 / 取消」，非编辑态「编辑 / 删除」） |

- 列固定：「名称（`width: 120`）/ 值 / 操作（`width: 100`、`align: center`、`fixed: right`）」，操作列只在 `edit` 为真时出现。
- **没有自有类名**的节点：`.ant-table` 容器、操作列的三个按钮、标题栏的「新增」按钮 —— 要定制走 `classes.table` 或从根往下写选择器。
- 编辑态每个单元格结构是 `FormItem(noStyle, hasFeedback) > TooltipValidationFormItem > Input / Select`，必填校验由这个 `FormItem` 自己承担。

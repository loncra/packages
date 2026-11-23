# `KeyValueTable` 键值表格

行内可编辑的键值对表格：新增、编辑、取消、删除，提交前可把仍在编辑态的行一次性收口。

## 何时使用 {#when-to-use}

- 表单里需要维护一组「名称 → 值」，条数不固定。
- 值只有一项时用普通输入；一项或多项混用时开 `multipleValue`。
- 行数固定的场景（如安装时按包配置收集密钥）：`addable=false` 关掉「新增」，`columns` 把某列设为 `readonly`，行数据自带 `editing: true` 即为内联输入模式。

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
| formItemNamePrefix | 编辑态单元格 `FormItem` 的 `name` 前缀，完整 `name` 是 `[...前缀, index, 列字段名]`（列字段名见 [columns](#columns) 的 `field`） | string[] | `[]` | - |
| title | 标题栏文案；只有标题栏存在时才有「新增」按钮（空串等同没有） | string | - | - |
| multipleValue | 值列用 `mode="tags"` 的 `Select`，值存成 `string[]`；新增行的初值是空数组（单值模式给空字符串） | boolean | `false` | - |
| addable | 是否显示「新增」按钮（仅控制新增入口；新增行的行对象是响应式的，编辑可正常触发校验） | boolean | `true` | - |
| columns | 列配置，`key` / `value` 各接受一个 [KeyValueColumnConfig](#keyvaluecolumnconfig)：`title` 列头文案、`readonly` 列只读（恒文本、无输入控件）、`field` 行字段名映射（`FormItem` name 随之变化）、`rules` 编辑态校验规则（`null` / 空数组 = 不校验）；两列缺省均可编辑，列头回落 locale（名称 / 值） | `{key?: KeyValueColumnConfig, value?: KeyValueColumnConfig}` | - | - |
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

「确定」按钮（操作列的 `✓`）会先用外层 `Form` 的 `validateFields` 按列字段名校验本行两个单元格（`field` 映射后即为映射字段），未通过就留在编辑态，错误沿用 `TooltipValidationFormItem` 的提示；组件不在 `Form` 内时拿不到表单实例，按原样直接确认。

## 类型 {#types}

### KeyValueRow {#keyvaluerow}

| 属性 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| id | 行标识，新增时由组件用 `crypto.randomUUID()` 生成 | string | - | - |
| key | 名称列的值 | string | - | - |
| value | 值列的值（`columns.value.field` 未映射时）；`multipleValue` 为真时是 `string[]` | string[] \| string | - | - |
| editing | 是否处于编辑态 | boolean | - | - |
| origin | 进入编辑时的快照，仅编辑期间存在；取消编辑用它回滚 | [KeyValueRow](#keyvaluerow) | - | - |
| placeholder | 值列编辑态输入框的占位提示（行级） | string | - | - |

### KeyValueColumnConfig {#keyvaluecolumnconfig}

| 属性 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| title | 列头文案覆盖；缺省回落组件内 locale（名称 / 值） | string | - | - |
| readonly | 该列恒为文本展示（编辑态也不渲染输入控件） | boolean | `false` | - |
| field | 该列绑定的行字段名；`FormItem` name 的最后一段也随之变化 | string | `key` / `value` | - |
| rules | 编辑态单元格的校验规则；**显式 `null` 或空数组 = 不校验**，缺省 `[{required: true}]` | `FormItemProps['rules'] \| null` | - | - |

「名称」列的 `field` 缺省是 `key`、「值」列缺省是 `value`；用 `field` 映射到自定义字段（如 `placeholder`）时，行对象要携带该字段，且列校验规则建议显式给出（映射列缺省仍会挂必填）。

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

- 列固定：「名称（`width: 120`）/ 值 / 操作（`width: 100`、`align: center`、`fixed: right`）」，操作列只在**任一列可编辑**（`columns` 里没有全部 `readonly`）时出现。
- **没有自有类名**的节点：`.ant-table` 容器、操作列的三个按钮、标题栏的「新增」按钮 —— 要定制走 `classes.table` 或从根往下写选择器。
- 编辑态每个单元格结构是 `FormItem(noStyle, hasFeedback) > TooltipValidationFormItem > Input / Select`，必填校验由这个 `FormItem` 自己承担。

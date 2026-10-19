# `TooltipValidationFormItem` 校验信息提示

把表单项当前的校验信息收进 `Tooltip`，错误文案不再常驻，长表单不会被撑开行高。

## 何时使用 {#when-to-use}

- 表单项密集、错误文案常驻会把行高撑开时。
- 放在 `FormItem` 里、包住唯一一个输入控件时。
- 只关心"有没有错误、第一条是什么"，不需要错误文案占位时。

## 代码演示 {#examples}

### 表单字段

```vue
<a-form-item
  name="name"
  :rules="[{ required: true, message: '请输入名称' }]"
>
  <l-tooltip-validation-form-item>
    <a-input v-model:value="form.name" />
  </l-tooltip-validation-form-item>
</a-form-item>
```

### 放在列表单元格里

```vue
<a-form-item
  no-style
  has-feedback
  :rules="[{ required: true }]"
  :name="[prefix, index, 'key']"
>
  <l-tooltip-validation-form-item>
    <a-input v-model:value="record.key" />
  </l-tooltip-validation-form-item>
</a-form-item>
```

`no-style` 时表单项本身不占位，错误完全由 `Tooltip` 表达。

## API

### 属性 {#props}

| 属性 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| class / style | 未声明，走 attrs：交给 `Tooltip`。**不要指望它作用到弹层**：`Tooltip` 把弹层的类收在 `rootClass` / `classes.root` 里；要给触发元素加类，直接写在插槽里那个元素上 | - | - | - |
| rootClass | 未声明，走 attrs：作为 `Tooltip` 的 `rootClass` 传入，与 `Tooltip` 自己的主题类合并后落在弹层根 `.ant-tooltip` | string | - | - |
| classes | 未声明，走 attrs：`Tooltip` 的语义类，可用键 `root`（弹层根）/ `container`（内容容器）/ `arrow`（箭头） | - | - | - |
| styles | 未声明，走 attrs：同上的语义样式 | - | - | - |

`title` 由本组件接管（见下方「语义化 DOM」），宿主传的 `title` 会被覆盖。

### 插槽 {#slots}

| 插槽 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| default | 触发元素。**只应有一个元素**：`Tooltip` 要把事件挂到它身上 | `() => any` | - |

## 语义化 DOM {#semantic-dom}

- **没有自有根元素、没有 `prefixCls`、没有样式文件**：渲染结果就是一个 `Tooltip`，`class` / `rootClass` / `classes` / `styles` 全部按 attrs 透传。
- 触发元素是宿主给的那个元素本身（本组件不额外包一层 `span`）。
- `title` 取当前 `FormItem` 的 `errors[0]`：没有错误时不传 `title`，`Tooltip` 不弹出；子元素照常渲染。
- 本组件**只读**校验结果：不调 `validate`、也不监听值变化；校验由 `FormItem` 与内部输入控件之间的原有链路触发。
- 弹层传送到 `body`：宿主写在触发元素祖先上的选择器不影响弹层，弹层内部也拿不到宿主放在本组件上的 `class`。

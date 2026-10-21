# Form 表单容器

跟随全局配置的**表单容器**：`layout` 缺省取 `LProvider` 配置里的 `formLayout`。用法 = `a-form` 的用法，**直接替换 `<a-form>` 即可**。

## 为什么需要它 {#why}

antd 的 `ConfigProvider.form` **不认 `layout`**：读 provider 这份配置的是 antd 自己的 `a-form`，其运行时白名单只有 `scrollToFirstError` / `colon` / `requiredMark` / `tooltip` / `autoComplete` / `autocomplete` / `labelAlign` / `labelWrap`，而 **`layout` 只从 props 取**（`antdv-next/dist/form/Form.js` 的 props 默认 `{layout: 'horizontal'}`）⇒ 往 provider 里塞 `form={{layout}}` 是**空转**，改官方白名单 = fork 依赖。

本组件就是"缺的那半个 provider"：把 `antdvConfig.state.formLayout` 补到 `a-form` 的 props 上。详情侧同理 —— `detailLayout` 走 [`CrudDetailPage`](../crud-page/detail/README.md)。

## 代码演示 {#examples}

```vue
<script setup lang="ts">
import {ref} from 'vue'

const form = ref({name: ''})
const f = ref()

async function onFinish() {
  await f.value.validate()
}
</script>

<template>
  <l-form :model="form" ref="f" @finish="onFinish">
    <a-form-item label="名称" name="name">
      <a-input v-model:value="form.name" />
    </a-form-item>
  </l-form>
</template>
```

## 行为

- **`$attrs` 全量透传**给内层 `a-form`（`model` / `rules` / `@finish` / `id` …），pro 不拦截任何一项。
- `layout`：**显式传 `:layout` 优先**，不传跟随 `LProvider` 的 `antdvConfig.state.formLayout`。
- **`ref` 拿到的是整个 antd form 实例**：`f.value.validate()` / `resetFields()` / `isFieldsTouched()` … 与 `<a-form ref>` 一字不差。
- props 的**类型**取 antd 的 `FormProps`（TSX 里可直接写 `<Form model={…} onFinish={…}>`）；**运行时只声明 `layout`**，其余全走 attrs —— 这是刻意的，不是漏声明。

## ref 代理的三条实现约定（改代码前必读）

ref 是一个指向内层 form 实例的**代理**（细节照抄 antd 自己的 `useForm` 代理），三条都是踩过坑的：

1. **函数必须 `bind(instance)`**：antd 的实例方法内部用 `this`。漏掉这条，`ref.value.validate()` 会以代理为 `this` 调用 ⇒ 一调用就崩、**Promise 永不 resolve** ⇒ 表现为"点了没反应"（2026-09-30 实测：登录页按回车 / 点登录都没反应，就是这条）。
2. **代理的 `has` 必须实现**：`<l-form ref="f">` 的 `f.value` 是 Vue 的 expose 代理，取值**先 `key in target` 再取**；代理 target 是空对象，不实现 `has` 就一律判 `false` ⇒ 所有方法返回 `undefined`（`bind` 修好也轮不到执行）。
3. 跳过 `symbol` / `then` / `__v_*`（Vue 与别的库会探测它们，转发出去容易出怪事）；表单还没挂载时给**空函数**而非 `undefined`，早调不抛。

## API

### 属性 {#props}

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| layout | 表单布局；不传跟随 `LProvider` 的 `antdvConfig.state.formLayout` | `'horizontal' \| 'vertical' \| 'inline'` | - |

其余属性 = `a-form` 的属性（经 attrs 透传，类型上由 antd `FormProps` 提供）。

### 插槽 / 事件 {#slots}

`default` 与全部事件同 `a-form`（透传，本组件不声明、不拦截）。

## 类型 {#types}

本目录没有 `types.ts`：无跨文件类型，`layout` 用 [`AntdvFormLayout`](../config-provider/README.md#types)。

## 语义化 DOM {#semantic-dom}

根就是 antd 的 `a-form`，**本组件无自有类名、无样式系统**（透明转发控件的记录在案例外：没有 `prefixCls` / `hashId`）。`class` / `style` 由 attrs 原样落到 `a-form` 根上。

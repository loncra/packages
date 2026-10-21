# CrudFormPage 表单页壳

表单页（新增 / 编辑）：**渲染 + 数据壳**一体，与 [`CrudHomePage`](../home/README.md) 同构 —— 布局是 `DataLoadingCard` + `Form`，数据链由 [`useCrudFormPage`](#数据链) 持有。

## 何时使用 {#when-to-use}

- 路由 Form 页（`defineFormPage` 产物 + `:id`）。
- 弹层形态：用 [`CrudFormModal`](../form-modal/README.md)，内部就是本壳（`plain` + `buttonAlign: 'end'`），**不为弹层另写一套按钮**。

## 代码演示 {#examples}

```ts
// role.form.page.ts
import {defineFormPage} from '@loncra/antdv-pro'
import {RoleService, type RoleEntity, type RoleSavePayload} from '@loncra/client/auth'
import {roleCore} from './role.page'

export const roleFormPage = defineFormPage<RoleSavePayload, RoleEntity>(
  {...roleCore, service: new RoleService()},
  {
    createEntity: () => ({name: '', remark: ''}) as RoleSavePayload,
    fields: [
      {key: 'name', component: 'input', rules: [{required: true}]},
      {key: 'remark', component: 'textarea', col: {span: 24}},
    ],
  },
)
```

```vue
<!-- Form.vue -->
<template>
  <crud-form-page :page="roleFormPage" :id="id" @success="onSuccess" />
</template>
```

## 数据链 {#数据链}

**加载**：`onMounted → loadSources（按字段 enumRef / dictId 推导 + form.enums 合并）→ preMounted → get(id) → postGetEntity → postMounted`。

- 表单键集由 `createEntity()` 决定：服务端回写**只写这些键**，`id` / `version` / `creationTime` 三个壳自用的键由 pro 兜底复制（缺 `creationTime` 操作记录块不渲染、缺 `id` 编辑态判定失效）。
- 编辑态判定就是 `id` 是否给了 —— 新增页不传 `:id`。

**提交**：`逐字段 beforeSubmit → preSubmit → submitEntity → postSubmit → success`。

- `submitEntity`：声明写了 `form.submit` 就用它（"发送"这类提交自成一件事的页面），否则走 `service.save`；两者都没有**当场抛**。
- `postSubmit` 返回真值 = 宿主接管：壳跳过自己的成功提示，只 `emit('success')`。
- 保存成功后基线跟着走（陈旧检查不会把自己这次保存当成"别人改了"）。

**陈旧检查**：切回页签（卡片壳 `onActivated`）时重拉比对，默认 `'prompt'`（本地没动就静默覆盖、动过才问）；`page.staleCheck` / `CrudConfig.staleCheck` 可调。有结论 `emit('stale', info)` —— "被删 / 冲突"后的收尾（关 tab / 回列表）由宿主接。

**提交成功后壳什么都不做**："回列表 / 关 tab"由宿主接 `@success`。

## API

### 属性 {#props}

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| page | `defineFormPage` 产物 | `CrudFormDefinition` | 必填 |
| id | 编辑态主键；不传 = 新增 | `string \| number` | - |
| buttonAlign | 按钮区对齐（`start` 默认 / `center` / `end`；弹层壳传 `end`） | `'start' \| 'center' \| 'end'` | `start` |
| title | 卡片头（同 `DataLoadingCard`）：**`default: undefined` 不能删**（带 `Boolean` 的 props 不传会被 Vue 转成 `false` ⇒ 卡片头没了） | `VNode \| boolean` | - |
| plain | 内嵌形态（弹层）：不要卡片壳，`Spin` 保留 | boolean | `false` |
| contextExtra | 宿主数据，进 `PageFormContext.extra` | `Record<string, unknown>` | `{}` |
| variant | 宿主形态名 | string | - |

### 事件 {#events}

| 事件 | 说明 |
| --- | --- |
| success | 保存成功（宿主在这里决定后续） |
| resetFields | 表单被重置（页面声明的 `onReset` 也会被调） |
| stale | 陈旧检查有结论 |

### 插槽 {#slots}

| 插槽 | 说明 |
| --- | --- |
| default | 字段行之后（子表这类）；参数 `{entity, extra, buckets, dictionaries}` |
| buttons | 整排按钮交宿主：参数带 `submitButton` / `resetButton` 两颗现成按钮与 `loading`，想留哪颗放回哪颗 |

### 方法 {#methods}

| 成员 | 说明 |
| --- | --- |
| entity | 当前实体（弹层关闭时表单没挂载，读之前先判） |
| buckets / dictionaries | 统一加载好的来源（插槽逃生读它们） |
| resetFields | 重置（antd `resetFields` + 声明 `onReset`；清不到 `id` 这类非表单键） |

## 类型 {#types}

`CrudFormPageProps` / `CrudFormPageExpose` / `CrudFormPageSlots` / `CrudFormPageConstructor` / `FormService` 定义在本目录 `types.ts`，从包根 `@loncra/antdv-pro` 导出。

## 语义化 DOM {#semantic-dom}

根是 [`DataLoadingCard`](../../data-loading-card/README.md) 的卡片，`$attrs` 直通它（贴边写 `:classes="{card: {body: 'p-0!'}}"` 这类）；表单容器默认跟随 ConfigProvider 的 `formLayout`。

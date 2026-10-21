# CrudFormModal 弹层表单壳

把 [`CrudFormPage`](../form/README.md)（表单形态）装进 `a-modal`。**这里没有"新形态"**：`page` 就是 `defineFormPage` 的产物 ⇒ 同一份 `*.form.page.ts` 既能给路由页用、也能给弹层用。

## 何时使用 {#when-to-use}

- 新增 / 编辑弹层（列表页的"新增""编辑"按钮直接开它）。
- 路由 Form 页：用 [`CrudFormPage`](../form/README.md)。

## 代码演示 {#examples}

```vue
<!-- 字典类型的"加子级"弹层：只递"这一次为谁而开" -->
<template>
  <l-crud-form-modal
    v-model:open="modal.open"
    :page="dictionaryTypeFormPage"
    :id="modal.id"
    :context-extra="{parentId: modal.parentId, parentCode: modal.parentCode}"
    :title="modal.title"
    @success="onSaved"
  />
</template>
```

`parentId` 这类"由打开方决定"的值走声明里的 `preMounted`（`PageFormContext.entity` 是 **Ref**）写进实体 —— `createEntity()` 无参、拿不到"这次弹层为谁而开"，这是 pro 的既有口径。

## 行为

- **取数 / 提交 / 校验 / 按钮 / 操作记录全部由 `CrudFormPage` 负责**；本壳只管四件弹层的事：① 开关（`v-model:open`）；② 标题；③ 宽度（默认 520）；④ `:footer="null"` + 遮罩不可点关。
- `×` / `Esc` / 取消按钮 → `emit('cancel')` + `update:open(false)`（与旧壳 `@cancel` 语义一致：先给宿主信号，再回写开关）。
- `open` 为假时表单**不挂载** ⇒ 每次打开都是全新表单，没有上一次的残留。
- 按钮就是 `CrudFormPage` 那一套（「保存 / 重置」），只是位置 `buttonAlign: 'end'` 贴右下。
- 表单壳 expose 出来的成员在这里原样可读（`entity` 等 getter 转发保响应式）；弹层关着时 `entity` 是 `undefined`，读之前先判。

## API

### 属性 {#props}

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| page | `defineFormPage` 产物（与路由页同一份） | `CrudFormDefinition` | 必填 |
| id | 编辑态主键 | `string \| number` | - |
| open | 开关（`v-model:open`）；**`default: undefined` 不能删**（带 `Boolean` 的 props 不传会被转成 `false` ⇒ 弹层一上来关着） | boolean | - |
| title | 弹层标题：`false` = 不出标题 | `string \| VNodeChild` | - |
| width | 弹层宽度（透传 `a-modal`；antd 的默认口径收在壳里，宿主不必记） | `string \| number` | `520` |
| contextExtra / variant | 同 `CrudFormPage` | - | - |

### 事件 {#events}

| 事件 | 说明 |
| --- | --- |
| update:open | 开关回写（`v-model:open`）；`×` / 遮罩 / `Esc` 关闭也走它 |
| success | 保存成功（**宿主在这里决定后续**：关弹层 / 刷列表 / 跳走） |
| cancel | 弹层关闭（宿主清自己的 `mode` / `parent` 这类状态） |
| resetFields | 表单被重置 |
| stale | 陈旧检查有结论（透传；弹层不挂 `keep-alive`，一般不触发） |

### 插槽 / 方法 {#slots}

插槽与 `CrudFormPage` 完全一致（原样透传）；expose 的成员也一致（见 [CrudFormPage 的方法](../form/README.md#methods)）。

## 类型 {#types}

`CrudFormModalProps`（= `CrudFormPageProps` 去掉 `title` 再补弹层三项）/ `CrudFormModalSlots`（= `CrudFormPageSlots`）/ `CrudFormModalExpose`（= `CrudFormPageExpose`）/ `CrudFormModalConstructor` 定义在本目录 `types.ts`，从包根 `@loncra/antdv-pro` 导出。

## 语义化 DOM {#semantic-dom}

根是 `a-modal`，`$attrs` 直通它；表单部分见 [CrudFormPage 的语义化 DOM](../form/README.md#semantic-dom)。

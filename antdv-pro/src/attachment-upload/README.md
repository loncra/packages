# AttachmentUpload 附件上传

管理端的附件上传控件：拖拽 / 卡片 / 自定义三种形态，**值双向绑定**（`v-model:value`），上传动作可声明式自动触发也可命令式调用（`ref.upload()`）。

## 何时使用 {#when-to-use}

- 表单里传附件（配合 `usePageRegistry` 的 `attachmentUpload` 组件注册，`beforeSubmit` 会自动调 `upload()`）。
- 需要在自己的提交流程里控制上传时机：`ref.upload()`（如轮播封面的 `preSubmit`）。
- 只读展示已传附件：传 `preview`（内部渲染 [`AttachmentPreview`](./preview/README.md) 语义）。
- 完全自己接管 `a-upload`：`mode="customize"` 裸壳。

## 代码演示 {#examples}

```vue
<script setup lang="ts">
import {ref} from 'vue'
import {AttachmentUpload, ATTACHMENT_UPLOAD_MODE, type AttachmentUploadExpose} from '@loncra/antdv-pro'

const value = ref()
const uploadRef = ref<AttachmentUploadExpose>()
</script>

<template>
  <!-- 声明式：注册进 CRUD DSL 后 beforeSubmit 自动上传 -->
  <l-attachment-upload v-model:value="value" :max-count="3" multiple />

  <!-- 命令式：自己在提交流程里调 upload() -->
  <l-attachment-upload
    ref="uploadRef"
    v-model:value="value"
    :mode="ATTACHMENT_UPLOAD_MODE.DRAGGER"
    :max-count="1"
    :multiple="false"
  />
</template>
```

目录上传（`directory`）与自定义参数（`upload-options`）见宿主 `skill-package/Form.vue`；CUSTOMIZE 裸壳见宿主 `AccountSetting.vue`。

## 行为

### 值的双向同步（⚠️ 两条"别踩回去"的实现约定）

1. **回声守卫必须比 `toRaw(v)`**：父级常把值放进 reactive 容器（表单实体就是 `ref({...})`），读回来的是**代理**，代理 `!==` 当初 emit 的原始数组 ⇒ 守卫失效 ⇒ `value → normalize → emit → 父级写回 …` **每 tick 空转一轮**（多附件时整页卡死；单选因 normalize 对非 OWR 单值返回 `[]` 意外刹住，所以只在多附件暴露）。2026-09-29 定位。
2. **已经传完的叶子必须交回 `ObjectWriteResult`（= `item.response`），不能交 `UploadFile` 外壳**：内部目录树会把 OWR 包成 `UploadFile` 再写回，触发 `watch(fileList)` 再跑一次——那时交外壳，父级拿到的值里**没有** `bucketName` / `objectName` ⇒ 提交时对象信息整块丢失。取不到 `response`（还没上传）才交回 `item` 本身。

### 上传

- `upload()`：收集叶子 → 已传的直接算结果、待传的并发上传（`promiseLimit` 默认 3）→ 结果按 `value` 的形状（单值 / 数组）归一返回。
- `uploadFile(file)`：上传单个 `UploadFile`（表单联动用）。
- `getFiles()`：拿当前全部叶子（含未上传的）。
- 上传进度会回写目录树（目录节点的百分比 = 叶子加权）。

## API

### 属性 {#props}

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| value | 附件值（`v-model:value`）：`UploadFile` / `ObjectWriteResult` / `ObjectItemInfo` 或其数组 | `AttachmentValue` | - |
| mode | 形态：`picture-card` / `dragger` / `customize` | `AttachmentUploadMode` | `picture-card` |
| previewMode | 内嵌预览形态 | `AttachmentPreviewMode` | 按 mode |
| maxCount | 最大数量；1 = 单值语义 | number | - |
| multiple / accept / disabled / preview | 同 `a-upload` 语义 | - | `multiple: true` |
| bucket | 附件桶 | string | `user.file` |
| postFilename | 上传字段名 | string | `file` |
| promiseLimit | 并发上限 | number | `3` |
| uploadOptions | `{param, headers}`，进上传执行器 | object | - |
| action | CUSTOMIZE 模式的上传地址 | string | - |
| dedupe | 去重开关：开启后**回显值按 uid 去重**、**新选文件与已有项同名同大小则拒入列表**（antd `LIST_IGNORE`） | boolean | `false` |
| showFilename | 卡片形态是否显示文件名 | boolean | `true` |
| canPreview / canDelete / canDownload | 三个动作的权限判定 | `(file) => boolean` | - |
| classes / styles | 语义化 DOM 区域表，见下 | - | - |
| prefixCls / rootClass | 前缀覆盖 / 根类名 | string | - |

### 事件 {#events}

| 事件 | 说明 |
| --- | --- |
| update:value | 值回写（含"传完交回 OWR"的归一） |
| remove | 某项被移除 |
| change | antd Upload 的 change 透传 |

### 插槽 {#slots}

| 插槽 | 说明 |
| --- | --- |
| itemRender / itemIcon / itemTitle / itemDescription | 单项的自定义渲染（透传给预览层） |
| uploadDescription | 触发区的描述文案 |
| default | 仅 CUSTOMIZE 模式：自己放 `a-upload` 内容 |

### 方法 {#methods}

| 方法 | 说明 |
| --- | --- |
| upload | 上传全部待传叶子，返回归一结果 |
| getFiles | 当前全部叶子 |
| uploadFile | 上传单个文件 |

## 类型 {#types}

`AttachmentUploadProps` / `AttachmentUploadEmits` / `AttachmentUploadSlots` / `AttachmentUploadExpose` / `AttachmentFileItem` / `AttachmentValue` / `AttachmentUploadExecutorOptions` 从包根导出；常量 `ATTACHMENT_UPLOAD_MODE` / `ATTACHMENT_PREVIEW_MODE` 同。

## 语义化 DOM {#semantic-dom}

根是稳定 `div`：类名 = `prefixCls`（缺省 `loncra-attachment-upload`）+ `hashId` + `cssVarCls` + `rootClass` + `attrs.class`。区域表（`classes` / `styles`，支持按上下文的函数形态）：

| 键 | 落点 |
| --- | --- |
| container | 最外层容器（两种模式共用） |
| list | 列表容器（列表模式 = `-list`；卡片模式 = `-list-cards`） |
| item | 每个附件项 |
| meta | 附件项里"名称 / 说明"块（styles 无此项） |
| trigger | **触发上传的区域**：picture-card = pro 自造的虚线框（`-trigger`）；dragger = 透传给 antd `UploadDragger` 的 `trigger` |

⚠️ **`trigger` 不再透传给 antd 的 `Upload`**（2026-09-29 起）：语义键的归属就是"宿主看到的那块触发区"，里面那层 `.ant-upload` 要改只能写全局类名。

无落点清单：CUSTOMIZE 模式宿主自己写 `a-upload`，`classes` / `styles` 没有落点；卡片 / 列表内部非语义节点（进度条、时间）不提供键。

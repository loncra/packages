# AttachmentUpload 附件上传

管理端的附件上传控件：拖拽 / 卡片 / 自定义三种形态，**值双向绑定**（`v-model:value`），上传动作可声明式自动触发也可命令式调用（`ref.upload()`）。

## 何时使用 {#when-to-use}

- 表单里传附件（配合 `usePageRegistry` 的 `attachmentUpload` 组件注册，`beforeSubmit` 会自动调 `upload()`）。
- 需要在自己的提交流程里控制上传时机：`ref.upload()`（如轮播封面的 `preSubmit`）。
- 只读展示已传附件：传 `preview`。
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

## 行为 {#behavior}

### 值的双向同步

值经 `useTwoWayModel`（`@loncra/antdv`）做**转换型受控绑定**：宿主值 → `toLocal`（normalize，`dedupe` 开启时再去重）→ 内部 `fileList`；内部 `fileList` → `toEmitted`（denormalize）→ 宿主。两条"别踩回去"的约定：

1. **回声守卫是 `toRaw` 对称比较**（模型内置）：父级常把值放进 reactive 容器（表单实体就是 `ref({...})`），读回来的是**代理**；emit 出去的值可能是裸对象也可能是代理（内部 `fileList` 住在深层 ref 里），所以两侧都要过 `toRaw` 再比。只比一侧会让守卫失效 ⇒ `value → normalize → emit → 父级写回 …` 空转，单值场景还会把值 normalize 成空、表现为"拖了文件但 required 校验不过"。2026-10-22 定位。
2. **已经传完的叶子必须交回 `ObjectWriteResult`（= `item.response`），不能交 `UploadFile` 外壳**：内部目录树会把 OWR 包成 `UploadFile` 再写回，触发一轮 emit——那时交外壳，父级拿到的值里**没有** `bucketName` / `objectName` ⇒ 提交时对象信息整块丢失。取不到 `response`（还没上传）才交回 `item` 本身。

### 值的形状

- 宿主传**数组** ⇒ 数组语义；传**单值**或 `maxCount: 1` ⇒ 单值语义（`detectAttachmentValueMode` 判定）。
- `AttachmentValue` 联合里的 `ObjectItemInfo` **没有独立语义**：`ObjectItemInfo` 自带 `bucketName` / `objectName`，会被 `isObjectWriteResult` 守卫捕获、按 OWR 转换（`userMetadata` 那套原始文件名展示等特性不生效）。要给它独立处理路径，得先写一个能与 `ObjectWriteResult` 区分开的判定。

### 上传

- `upload()`：收集叶子 → 已传的直接算结果、待传的并发上传（`promiseLimit` 默认 3）→ 结果按 `value` 的形状（单值 / 数组）归一返回。
- `uploadFile(file)`：上传单个 `UploadFile`（表单联动用）。
- `getFiles()`：拿当前全部叶子（含未上传的）。
- 上传进度会回写目录树（目录节点的百分比 = 叶子按字节数加权）。
- 上传分片：文件 ≥ `getClient().uploadBlockSize` 走分片上传，否则单请求（`_util/uploadFile.ts`）。

### 目录树

拖入目录（宿主透传 `directory` 给 antd Upload）后按 `webkitRelativePath` 建树。列表模式**递归渲染**：目录行（文件夹图标 + 聚合进度条）+ 每层缩进的子文件行（各自进度条）。`itemRender` 等插槽对目录节点与文件节点都生效。

### 删除

已上传（有 `response`）的项走确认弹窗 + 服务端删除（`AttachmentService.removeAttachment`）；还没上传的直接本地移除。

### 缩略图与文件类型判定

- 文件先按 `detectAttachmentFileKind` 分为四类：`image` / `video` / `directory` / `other`（唯一判定点）。缩略图与点击预览都按 kind 分发。
- 图片：有 `url` 直接用；本地图片转 base64；本地视频抽帧写 `thumbUrl`。已有 `thumbUrl` 早退，不会循环。
- **回显（OWR）视频不设 `thumbUrl`**：视频 URL 放进 `<img>` 只会破图，视频项显示 `PlayCircleOutlined` 兜底图标 + 悬浮层预览（眼睛）按钮，点击打开视频弹窗播放。远程 URL 抽帧需要 `<video>` + canvas + 跨域配合，暂不做。
- **`video` 的判定是扩展名排除**：`video/*` 且扩展名不是 `.ts` / `.tsx` / `.mts` / `.cts` 才算视频。这几个扩展名在浏览器里会被报成 MPEG 传输流的 MIME（实测 `video/vnd.dlna.mpeg-tts`，变体随平台），按 MIME 点名拦不住。对内置判定不满意时用 `previewRenderers` 覆盖对应 kind 的渲染，不必改包。
- **宿主可插拔预览（`previewRenderers`）**：按 kind 覆盖缩略图渲染，内置表缺省——`{image, video, directory, other}`（image/video 有 `thumbUrl` 出图、否则图标；directory = 文件夹图标；other = 通用文件图标）。宿主能预览 office 等格式时传自己的渲染器即可：

```ts
previewRenderers={{
  other: ({file, prefixCls, hashId}) => <OfficeThumb file={file} class={hashId} />
}}
```

优先级：`itemRender` 插槽（整项）> `previewRenderers[kind]` > `itemIcon` 插槽（内置兜底图标）> 内置图标。点击行为不受 `previewRenderers` 影响：image 走图片预览组、video 走视频弹窗，**directory 点击无反应**（维持老行为）。

## API

### 属性 {#props}

| 属性 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| value | 附件值（`v-model:value`）：`UploadFile` / `ObjectWriteResult` 或其数组 | `AttachmentValue` | - | - |
| mode | 形态：`picture-card` / `dragger` / `customize` | `AttachmentUploadMode` | `picture-card` | - |
| previewMode | 内嵌预览形态 | `AttachmentPreviewMode` | 按 mode | - |
| maxCount | 最大数量；1 = 单值语义 | number | - | - |
| multiple | 是否可多选 | boolean | `true` | - |
| accept | 接受的文件类型 | string | - | - |
| disabled | 禁用 | boolean | `false` | - |
| preview | 只读形态开关：隐藏触发区与删除按钮，只展示；下载 / 预览（眼睛）操作仍可用 | boolean | `false` | - |
| bucket | 附件桶 | string | `user.file` | - |
| postFilename | 上传字段名 | string | `file` | - |
| promiseLimit | 并发上限 | number | `3` | - |
| uploadOptions | `{param, headers}`，进上传执行器 | object | - | - |
| action | CUSTOMIZE 模式的上传地址 | string | - | - |
| dedupe | 去重开关：开启后**回显值按 uid 去重**、**新选文件与已有项同名同大小则拒入列表**（antd `LIST_IGNORE`） | boolean | `false` | - |
| showFilename | 卡片形态是否显示文件名 | boolean | `true` | - |
| canPreview | 预览权限判定；默认图片/视频可预览 | `(file) => boolean` | - | - |
| canDelete | 删除权限判定；默认可删 | `(file) => boolean` | - | - |
| canDownload | 下载权限判定；默认有 `response` 可下载 | `(file) => boolean` | - | - |
| previewRenderers | 按 kind 覆盖缩略图渲染，见"缩略图与文件类型判定" | `AttachmentPreviewRenderers` | - | - |
| classes / styles | 语义化 DOM 区域表，见下 | - | - | - |
| prefixCls / rootClass | 前缀覆盖 / 根类名 | string | - | - |

**attrs 透传**：拆出 `class` / `style` 后，其余 attrs 按模式下推——`picture-card` / `dragger` 给内层 antd `Upload` / `UploadDragger`（`directory`、`before-upload`、`data` 等都走这里）；`customize` 给 **pro 内层那个包裹宿主内容的 antd `Upload` 裸壳**（宿主写的 `a-upload` 只是它的插槽内容，attrs 不会落到宿主元素本身）。

### 事件 {#events}

| 事件 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| update:value | 值回写（含"传完交回 OWR"的归一） | `(value: AttachmentValue) => void` | - |
| remove | 某项被移除 | `(file: UploadFile<ObjectWriteResult>) => void` | - |
| change | antd Upload 的 change 透传 | `(info: UploadChangeParam) => void` | - |

### 插槽 {#slots}

| 插槽 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| itemRender | 单项整体自定义渲染 | `(ctx: {file}) => VNodeChild` | - |
| itemIcon / itemTitle / itemDescription | 单项的图标 / 标题 / 描述（透传给预览层） | `(ctx: {file}) => VNodeChild` | - |
| uploadDescription | 触发区的描述文案 | `() => VNodeChild` | - |
| default | 仅 CUSTOMIZE 模式：自己放 `a-upload` 内容 | `() => VNodeChild` | - |

### 方法 {#methods}

| 方法 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| upload | 上传全部待传叶子，返回归一结果 | `() => Promise<ObjectWriteResult \| ObjectWriteResult[] \| undefined>` | - |
| getFiles | 当前全部叶子（含未上传） | `() => AttachmentFileItem[]` | - |
| uploadFile | 上传单个文件 | `(file: UploadFile) => Promise<ObjectWriteResult>` | - |

## 类型 {#types}

从包根导出：`AttachmentUploadProps` {#attachmentuploadprops} / `AttachmentUploadEmits` {#attachmentuploademits} / `AttachmentUploadSlots` {#attachmentuploadslots} / `AttachmentUploadExpose` {#attachmentuploadexpose} / `AttachmentFileItem` {#attachmentfileitem} / `AttachmentValue` {#attachmentvalue} / `AttachmentUploadExecutorOptions` {#attachmentuploadexecutoroptions} / `AttachmentFileKind` {#attachmentfilekind} / `AttachmentPreviewRenderer` {#attachmentpreviewrenderer} / `AttachmentPreviewRendererContext` {#attachmentpreviewrenderercontext} / `AttachmentPreviewRenderers` {#attachmentpreviewrenderers}；常量 `ATTACHMENT_UPLOAD_MODE` / `ATTACHMENT_PREVIEW_MODE` 同。`AttachmentUploadMode` / `AttachmentPreviewMode` 是内部类型，未从包根导出——宿主声明形态直接用两个常量的字面量。

- `AttachmentFileItem` = `UploadFile<ObjectWriteResult> | ObjectWriteResult | ObjectItemInfo`（见"值的形状"：`ObjectItemInfo` 实际不可用）。
- `AttachmentValue` = `AttachmentFileItem | AttachmentFileItem[] | undefined`。
- `AttachmentUploadExecutorOptions` = `{postFilename, promiseLimit, param?, headers?}`，是 `_util/uploadFile.ts` 上传执行器的入参。
- `classes` / `styles` 的类型（`AttachmentUploadClassNamesType` / `AttachmentUploadStylesType`，支持按上下文的函数形态）不单独建节，见"语义化 DOM"。

## 语义化 DOM {#semantic-dom}

| 区域 | 说明 |
| --- | --- |
| root | 稳定根是 `div`，三种形态同一元素：类名 = `prefixCls`（缺省 `loncra-attachment-upload`）+ `hashId` + `cssVarCls` + `rootClass` + `attrs.class`；`style` 落 `attrs.style`；没有 `classes.root`。其余 attrs 下推给内层 antd Upload（见属性表"attrs 透传"） |
| container | 预览层的最外层包裹（根 div 内的 `span`，列表 / 卡片两种模式共用）。注意它**不是**根 div——宿主要改根走 `class` / `style` / `rootClass` |
| list | 列表容器：列表模式 = `-list`（Flex）；卡片模式 = `-list-cards` |
| item | 每个附件项（列表模式是缩略图 `span`，卡片模式同）；目录树里目录行与子文件行都算 item |
| meta | 附件项里"名称 / 说明"块（卡片模式计数块复用此类名）；**styles 无此项** |
| trigger | **触发上传的区域**：picture-card = pro 自造的虚线框（`-trigger`）；dragger = 透传给 antd `UploadDragger` 的 `trigger` |

⚠️ **`trigger` 不透传给 antd 的 `Upload`**：语义键的归属就是"宿主看到的那块触发区"，里面那层 `.ant-upload` 要改只能写全局类名。

无落点清单：CUSTOMIZE 模式宿主自己写 `a-upload`，`classes` / `styles` 没有落点；列表内部非语义节点（进度条、文件大小、目录缩进）不提供键；弹层（图片预览组 / 视频 Modal）Teleport 到 body，自有类只有 `-video`（视频播放器）与 `-preview-hidden`（图片预览组的隐藏容器）。

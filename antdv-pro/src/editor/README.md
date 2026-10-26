# `Editor` 富文本编辑器

在 `antdv-next-tiptap` 外面收一层：统一的 `v-model`、空值归一、表单校验态、跟随 `ConfigProvider` 的语言。图片 / 视频统一上传内置（见「覆盖上传」）。

## 何时使用 {#when-to-use}

- 表单里的富文本字段，需要插入图片 / 视频。
- 不希望每个调用点自己处理"只有空标签的内容算空值"。

## 代码演示 {#examples}

### 表单字段

```vue
<a-form-item name="content" :rules="[{ required: true, message: '请输入内容' }]">
  <l-editor v-model:value="form.content" word-count />
</a-form-item>
```

### 只读形态

```vue
<l-editor :value="record.content" :editable="false" />
```

`:editable="false"` 与 `disabled` 都能关掉编辑；区别是 `disabled` 语义更明确，宿主用哪个都行。

## 行为 {#behavior}

### 空值归一

`outputFormat` 不是 `'json'` 时，对内容做归一：去掉标签后为空的 HTML（含 `&nbsp;`、`{}`、`null` 这类占位）算作空，归一成 `''`；**含媒体元素（`img` / `video` / 占位上传区等）的正文永远判非空**。`isEmptyRichText` 是这套判空的对外出口，宿主需要自己判空时直接用。

归一**只在终值做**（`confirmUploads`，registry 的 `beforeSubmit` 会自动调用）：编辑期间 `update:value` 抛出的是**未归一的原文**。宿主不经 registry 使用时，需在提交前自行调用 `confirmUploads`（或自行归一）。

### 图片 / 视频（统一上传，内置默认）

- **插入 / 粘贴 / 拖拽**：本控件默认注入统一上传——选图后立即以 `blob:` 地址本地预览（正文不膨胀、不上传后端），文件登记进待传清单。
- **提交时**：registry 的 `beforeSubmit` 调用 `confirmUploads`，把正文里**实际还存在**的 `blob:` 地址逐个上传（自动分片 / 单传，`bucket` 默认 `user.file`），原位替换为远端 URL，随后做空值归一；任一上传失败抛错中断提交，失败的待传项保留待重试。
- 粘贴外站图片（非 `blob:`）不上传不替换；同一文件按 `name-size-lastModified` 去重复用；undo 删掉的图在提交时按正文实际存在收集，孤儿文件自动丢弃。
- **粘贴 / 拖拽多图**：只处理第一张。

### 覆盖上传

宿主传 `upload-image` / `upload-video`（B 类注入）即可接管对应类型：`(file, onProgress) => Promise<插入用的地址>`——返回的地址直接进正文，**不经统一上传**（返回远端 URL 则提交时无可上传项）。

## API

### 属性 {#props}

| 属性 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| value | 内容；配合 `v-model:value` | string | `''` | - |
| height | 编辑区高度（px） | number | `300` | - |
| disabled | 禁用编辑 | boolean | `false` | - |
| editable | 是否可编辑；`false` 时同样只读 | boolean | `true` | - |
| outputFormat | 输出格式；`'json'` 时不做空值归一 | `'html' \| 'json'` | `'html'` | - |
| locale | 编辑器语言；不传则读 `ConfigProvider` 的 `locale`（以 `en` 开头用 `en-US`），再退到 `zh-CN` | `'zh-CN' \| 'en-US' \| Record<string, string>` | - | - |
| disabledPlugins | 关闭的插件名 | `PluginName[]` | - | - |
| bucket | 统一上传的存储桶 | string | `'user.file'` | - |
| uploadParam | 统一上传的附加表单参数 | `Record<string, unknown>` | - | - |
| uploadImage | 图片上传覆盖，见"覆盖上传"；不传用内置统一上传 | [UploadFn](#uploadfn) | -（内置统一上传） | - |
| uploadVideo | 视频上传覆盖，见"覆盖上传"；不传用内置统一上传 | [UploadFn](#uploadfn) | -（内置统一上传） | - |
| wordCount | 字数统计；`true` 只显示数量，给数字则显示上限。**不传就没有字数区域**，`word-count` 插槽也不会渲染 | `true \| number` | - | - |
| classes | 语义化 DOM 区域表，见下 | [EditorClasses](#editorclasses) | - | - |
| styles | 语义化 DOM 样式区域表 | [EditorStyles](#editorstyles) | - | - |
| prefixCls | 改根前缀 | string | -（组件内兜底 `loncra-editor`） | - |
| rootClass | 追加到根元素 | string | - | - |

`prefixCls` 不传时组件内部用的是非空兜底（`loncra-editor`），因此 `ConfigProvider` 的全局 `prefixCls` **不会**影响它。

`class` / `style` 未声明，走 attrs，二者落在根 `div` 上；其余 attrs 透传给内部的 `antdv-next-tiptap` 编辑器。

### 事件 {#events}

| 事件 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| update:value | 内容变化（编辑期透传原文，未归一；归一在 `confirmUploads`） | `(value: string) => void` | - |
| change | 内容变化（与 `update:value` 同一份值） | `(value: string) => void` | - |
| blur | 失焦；携带当前内容 | `(value: string) => void` | - |

提交（`confirmUploads`）是**无条件**的：归一后的值与原值相同时也会再发一次，宿主做"值不同才保存"要自己比对。

### 插槽 {#slots}

| 插槽 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| word-count | 自定义字数展示，透传给 `antdv-next-tiptap` | `(ctx: { count: number; limit: true \| number }) => any` | - |

### 方法 {#methods}

| 方法 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| confirmUploads | 上传正文中尚存的 `blob:` 地址并原位替换为远端 URL，随后做空值归一并写回 `update:value`；registry 的 `beforeSubmit` 自动调用，宿主不经 registry 使用时需在提交前自行调用 | `() => Promise<void>` | - |

## 类型 {#types}

从包根导出：`EditorProps` {#editorprops} / `EditorEmits` {#editoremits} / `EditorSlots` {#editorslots} / `EditorExpose` {#editorexpose} / `EditorLocale` {#editorlocale} / `EditorClasses` {#editorclasses} / `EditorStyles` {#editorstyles} / `UploadFn` {#uploadfn} / `OutputFormat` {#outputformat} / `PluginName` {#pluginname}；工具函数 `isEmptyRichText` / `normalizeRichTextValue` 同。

### EditorExpose {#editorexpose}

| 方法 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| confirmUploads | 见[方法](#methods) | `() => Promise<void>` | - |

### EditorClasses {#editorclasses}

| 键 | 类型 | 落点 |
| --- | --- | --- |
| root | string | 根元素 `div`（`-status-error` 状态修饰所在层） |
| editor | string | 内部 `AEditor` 本体（与固定的 hash 链合并） |

### EditorStyles {#editorstyles}

同构：`root` / `editor`（`CSSProperties`）。根样式宿主优先（`styles.root` 在前，attrs 的 `style` 在后）。

### UploadFn {#uploadfn}

> `(file: File, onProgress: (percent: number) => void) => Promise<string>`

- `file`：选中的文件。
- `onProgress`：进度回调，传 0–100。
- 返回：插入正文用的地址。

### EditorLocale {#editorlocale}

> `'zh-CN' | 'en-US' | Record<string, string>`；传 `Record` 表示用自定义文案包，键与内置包一致。

### OutputFormat {#outputformat}

> `'html' | 'json'`；`'json'` 时内容以 tiptap 的 JSON 字符串提交，且不做空值归一。

### PluginName {#pluginname}

> 可关闭的插件名：`'undoRedo' | 'heading' | 'bold' | 'italic' | 'underline' | 'strike' | 'code' | 'codeBlock' | 'blockquote' | 'bulletList' | 'orderedList' | 'taskList' | 'list' | 'textAlign' | 'horizontalRule' | 'clearFormat' | 'color' | 'highlight' | 'link' | 'image' | 'imageUpload' | 'video' | 'videoUpload' | 'table' | 'fontFamily' | 'fontSize' | 'print' | 'fullscreen'`。

## 语义化 DOM {#semantic-dom}

| 区域 | 说明 |
| --- | --- |
| root | 根元素 `div`（本组件自己的）：`loncra-editor` + `hashId` + `cssVarCls` + `classes.root` + `rootClass` + 宿主 `class`；表单校验状态为 error 时再追加 `loncra-editor-status-error` |
| editor | 内部 `AEditor`（`antdv-next-tiptap`）：`classes.editor` / `styles.editor` 挂其本体（AEditor 无语义 DOM，值退化为 `string`）；其余 attrs 透传给 `AEditor` |

- 编辑区高度落在内部 `.editor-content` 上（行内 `style` 的 `height`，跟随 `height` 属性）。
- `-status-error` 只改边框色：选中 `.editor`、`.editor .editor-toolbar`、`.editor .editor-word-count`（这三个是编辑器自带的类名，**没有**自有类名可挂）。
- 错误态规则带 `!important`，宿主想换错误色需要同等提权。
- 编辑器本体与它的样式文件是**异步加载**的：首次渲染会有一帧只有空壳。
- 本组件把值变化回灌给 `FormItem` 的校验链路，宿主在代码里直接改 `v-model` 也会触发校验。
- 字数统计的文案与位置由 `antdv-next-tiptap` 决定；本组件只提供 `word-count` 插槽透传。

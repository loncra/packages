# `Editor` 富文本编辑器

在 `antdv-next-tiptap` 外面收一层：统一的 `v-model`、空值归一、表单校验态，以及跟随 `ConfigProvider` 的语言。

## 何时使用 {#when-to-use}

- 表单里的富文本字段，需要图片 / 视频上传或字数限制。
- 不希望每个调用点自己处理"只有空标签的内容算空值"。

## 代码演示 {#examples}

### 表单字段

```vue
<a-form-item name="content" :rules="[{ required: true, message: '请输入内容' }]">
  <l-editor v-model:value="form.content" :upload-image="uploadImage" word-count />
</a-form-item>
```

### 只读形态

```vue
<l-editor :value="record.content" :editable="false" />
```

`:editable="false"` 与 `disabled` 都能关掉编辑；区别是 `disabled` 语义更明确，宿主用哪个都行。

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
| uploadImage | 图片上传 | [UploadFn](#uploadfn) | - | - |
| uploadVideo | 视频上传 | [UploadFn](#uploadfn) | - | - |
| wordCount | 字数统计；`true` 只显示数量，给数字则显示上限。**不传就没有字数区域**，`word-count` 插槽也不会渲染 | `true \| number` | - | - |
| prefixCls | 改根前缀 | string | -（组件内兜底 `loncra-editor`） | - |
| rootClass | 追加到根元素 | string | - | - |

`prefixCls` 不传时组件内部用的是非空兜底（`loncra-editor`），因此 `ConfigProvider` 的全局 `prefixCls` **不会**影响它。

`class` / `style` 未声明，走 attrs，二者落在根 `div` 上；其余 attrs 透传给内部的 `antdv-next-tiptap` 编辑器。

### 事件 {#events}

| 事件 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| update:value | 内容变化（已归一） | `(value: string) => void` | - |
| change | 内容变化（与 `update:value` 同一份归一结果） | `(value: string) => void` | - |
| blur | 失焦；携带归一后的内容 | `(value: string) => void` | - |

编辑器内部每次内容变化会同时抛 `update:modelValue` 与 `change`；本组件只接前一条，所以每次编辑只发一次 `update:value` + 一次 `change`。`blur` 也会先走一次提交。提交是**无条件**的：归一后的值与原值相同时也会再发一次，宿主做"值不同才保存"要自己比对。

### 插槽 {#slots}

| 插槽 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| word-count | 自定义字数展示，透传给 `antdv-next-tiptap` | `(ctx: { count: number; limit: true \| number }) => any` | - |

## 类型 {#types}

### UploadFn {#uploadfn}

> `(file: File, onProgress: (percent: number) => void) => Promise<string>`

- `file`：选中的文件。
- `onProgress`：进度回调，传 0–100。
- 返回：上传完成后的可访问地址。

### EditorLocale {#editorlocale}

> `'zh-CN' | 'en-US' | Record<string, string>`；传 `Record` 表示用自定义文案包，键与内置包一致。

### OutputFormat {#outputformat}

> `'html' | 'json'`；`'json'` 时内容以 tiptap 的 JSON 字符串提交，且不做空值归一。

### PluginName {#pluginname}

> 可关闭的插件名：`'undoRedo' | 'heading' | 'bold' | 'italic' | 'underline' | 'strike' | 'code' | 'codeBlock' | 'blockquote' | 'bulletList' | 'orderedList' | 'taskList' | 'list' | 'textAlign' | 'horizontalRule' | 'clearFormat' | 'color' | 'highlight' | 'link' | 'image' | 'imageUpload' | 'video' | 'videoUpload' | 'table' | 'fontFamily' | 'fontSize' | 'print' | 'fullscreen'`。

## 语义化 DOM {#semantic-dom}

| 区域 | 说明 |
| --- | --- |
| root | 根元素 `div`（本组件自己的）：`loncra-editor` + `hashId` + `cssVarCls` + `rootClass` + 宿主 `class`；表单校验状态为 error 时再追加 `loncra-editor-status-error` |
| editor | 内部 `AEditor`（`antdv-next-tiptap`）：**没有**语义化 `classes` / `styles` 入口，要定制只能从 `.loncra-editor` 往下写选择器；其余 attrs 透传给 `AEditor` |

- 编辑区高度落在内部 `.editor-content` 上（行内 `style` 的 `height`，跟随 `height` 属性）。
- `-status-error` 只改边框色：选中 `.editor`、`.editor .editor-toolbar`、`.editor .editor-word-count`（这三个是编辑器自带的类名，**没有**自有类名可挂）。
- 错误态那几条规则带 `!important`：`antdv-next-tiptap` 的样式未分层，层序管不到它；宿主想换错误色需要同等提权。
- 编辑器本体与它的样式文件是**异步加载**的：首次渲染会有一帧只有空壳。
- 空值归一：`outputFormat` 不是 `'json'` 时，去掉标签后为空的 HTML（含 `&nbsp;`、`{}`、`null` 这类占位）会提交成 `''`。
- 本组件把值变化回灌给 `FormItem` 的校验链路，宿主在代码里直接改 `v-model` 也会触发校验。
- 字数统计的文案与位置由 `antdv-next-tiptap` 决定；本组件只提供 `word-count` 插槽透传。

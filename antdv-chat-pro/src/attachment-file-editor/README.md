# `AttachmentFileEditor` 附件文件编辑器

在 `FileView` 上接 MinIO 附件：上传、重命名、删除、下载，以及文本页的修改和保存。

## 何时使用 {#when-to-use}

- 技能包等已经把文件放在附件桶里，需要和原来的文件编辑器一样管理这些文件。
- 只读查看时传入 `readonly`。此时没有上传、重命名、删除、保存、下载，文本页走 `FileView` 的只读预览。

## 代码演示 {#examples}

```vue
<AttachmentFileEditor bucket="system.file" path="ai/skill/1/" name="demo" />
```

## API

### 属性 {#props}

| 属性 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| bucket | 附件桶 | `string` | 必填 | - |
| path | 根路径 | `string` | 必填 | - |
| readonly | 只读。不渲染写操作，也不替换文本页 | `boolean` | `false` | - |
| name | 传给 `FileView` 的标题 | `string` | - | - |
| height / maxHeight | 传给 `FileView` | `string \| number` | - | - |
| getIcon | 原样传给 `FileView`，参数是 `FileViewNode` | `(node: FileViewNode) => VNodeChild` | - | - |
| classes / styles / rootClass | 传给 `FileView` | - | - | - |
| prefixCls | 本控件隐藏上传触发器的前缀 | `string` | `loncra-attachment-file-editor` | - |

`class` / `style` 落在内部的 `FileView` 根上。

## 行为 {#behavior}

- 列目录使用 `AttachmentService.findAttachment`，打开文件返回 `{type: 'url'}`。
- 重命名状态在 `FileEditorNode.editing` / `editName` 上，不写进 `FileViewNode`。
- 非只读时，文本页换成可编辑内容，保存走 `uploadFile`。图片、视频、音频仍是只读预览。
- 关闭未保存的文本页时弹出确认。

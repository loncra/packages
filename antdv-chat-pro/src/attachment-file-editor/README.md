# `AttachmentFileEditor` 附件文件编辑器

在 `FileView` 上接 MinIO 附件：上传、重命名、删除、下载，以及文本页的修改和保存。

## 何时使用 {#when-to-use}

- 技能包等已经把文件放在附件桶里，需要和原来的文件编辑器一样管理这些文件。
- 只读查看时传入 `readonly`。此时没有上传、重命名、删除和保存，文本页走 `FileView` 的只读预览。下载和定位仍在。

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
| height / maxHeight | 写在本控件根上，内部预览铺满 | `string \| number` | - | - |
| getIcon | 原样传给 `FileView`，参数是 `FileViewNode` | `(node: FileViewNode) => VNodeChild` | - | - |
| classes / styles | 见「语义化 DOM」。`root` 落在本控件根上，其余区域传给内部 `FileView` | - | - | - |
| rootClass | 并入本控件根的类名 | `string` | - | - |
| prefixCls | 本控件根和隐藏上传触发器的前缀 | `string` | `loncra-attachment-file-editor` | - |

宿主的 `class` / `style` 以及其余 attrs 落在本控件根上。`height` / `maxHeight` 写在这个根上，内部 `FileView` 用 `100%` 铺满。

## 行为 {#behavior}

- 列目录使用 `AttachmentService.findAttachment`，打开文件返回 `{type: 'url'}`。
- 重命名状态在 `FileEditorNode.editing` / `editName` 上，不写进 `FileViewNode`。
- 非只读时，文本页换成可编辑内容，保存走 `uploadFile`。图片、视频、音频仍是只读预览。
- 关闭未保存的文本页时弹出确认。

## 语义化 DOM {#semantic-dom}

| 区域 | 说明 |
| --- | --- |
| root | 根 div。类名顺序：`prefixCls`、`hashId`、`cssVarCls`、`classes.root`、`rootClass`、宿主 `class`。`style` 为高度、`styles.root`、宿主 `style` |
| splitter / panel / panelMain | 传给内部 `FileView` 的同名区域 |

无落点：内部 `FileView` 的根没有单独的 key。隐藏的上传触发器不是宿主入口。

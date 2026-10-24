# `FileEditor` 文件编辑器

左右分栏的文件编辑器：左侧文件树（目录 / 文件增删改、上传），右侧多 tab 编辑与预览（文本 / 图片 / 视频 / 音频）。当前 Skill 模块的文件管理在用。

## 何时使用 {#when-to-use}

- 需要"文件树浏览 + 上传下载 + 重命名删除 + 文本编辑 + 媒体预览"一体化的场景。
- 一般不直接渲染：由 Skill 的文件管理面板使用；直接使用时提供 `bucket` / `path` 即可。

## 代码演示 {#examples}

```vue
<FileEditor bucket="files" :path="/docs" :readonly="false" />
```

## 行为 {#behavior}

- **架构**：`Splitter` 左右分栏——左 `FileConversation`（文件树），右 `FileTabs`（多 tab）；tab 内容统一经 `FilePaneHost` 按 kind 分发渲染。布局职责见「语义化 DOM」。
- **渲染分发**：`filePaneKinds.resolveFilePaneKind` 按 mime / 扩展名判 `image / video / audio / text`；`text/` 与已知文本类 `application/*`（json / xml / js / yaml / sql…）进文本编辑；**未知 `application/*` 与其它二进制一律进 `unsupported` 兜底**（防止二进制被当文本打开后误保存损毁文件）；无 `Content-Type` 时保持宽容按文本打开。文本超过 `TEXT_MAX_BYTES` 也是 `unsupported`。
- **上传**：两个隐藏 `Upload` 触发器（文件 / 目录），上传统一走 `@loncra/antdv-pro` 的 `uploadFile` 执行器（分片 / 单传自动），完成后按目标位置增量刷新树。
- **重命名 / 删除**：重命名走 `moveAttachment`（仅改最后一段），删除后树用 `filterTreeDeep` 收缩并联动关闭相关 tab。
- **图标**：默认按文件形态给 antd 图标；宿主可用 `get-icon` 按 `item` 自定义（返回 VNode）——本包不认识宿主的图标字体。
- **tab 图标**：在 tab label 里画（要套 `Badge` 的"未保存"圆点）——不能交给 `items[].icon`：底座 `@v-c/tabs` 的 `TabNode` 会把那份再画一遍导致双图标。
- **内联样式例外**：根上的 `sizeStyle`（按 `height` / `maxHeight` 逐实例计算）与宿主 `style` 是 pro 里唯一保留的内联样式（逐实例尺寸没法进 genStyleHooks，2026-09-23 审计确认）。
- **名称校验 / 显示**：重命名用 `validateFileOrFolderName`（locale 文案）；显示名统一走 `resolveDisplayName`（与 antdv-pro 附件同一来源）。
- **文件定位**：tabs 工具栏的定位按钮——先展开选中文件的祖先目录（`openKeys`），再把左树的滚动容器滚到该文件行（**顶对齐**，完整可见则不动）。寻址用 `ConversationList` 自渲染 label 上的 `data-conversation-key`（不依赖 Menu 内部属性），`nextTick` 后执行。

## API

### 属性 {#props}

| 属性 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| bucket | 附件桶 | string | 必填 | - |
| path | 根路径 | string | 必填 | - |
| readonly | 只读（禁编辑 / 禁上传 / 禁删除） | boolean | `false` | - |
| name | 面板标题（左上角） | string | - | - |
| height / maxHeight | 根容器高度 | `string \| number` | - | - |
| getIcon | 自定义文件图标 | `(item: ObjectItemInfo) => VNodeChild` | - | - |
| classes | 语义化 DOM 区域表，见下 | [FileEditorClasses](#fileeditorclasses) | - | - |
| styles | 语义化 DOM 样式区域表 | [FileEditorStyles](#fileeditorstyles) | - | - |
| prefixCls / rootClass | 前缀覆盖 / 根类名 | string | - | - |

`class` / `style` 走 attrs 落在根 div（与 `styles.root` 合并，宿主优先）；其余 attrs 透传根。组件无对外事件——所有交互都在控件内闭环，宿主定制点见 `get-icon` 与区域表。

## 类型 {#types}

从包根导出：`FileEditorProps` {#fileeditorprops} / `FileEditorClasses` {#fileeditorclasses} / `FileEditorStyles` {#fileeditorstyles}。

### FileEditorClasses {#fileeditorclasses}

| 键 | 类型 | 落点 |
| --- | --- | --- |
| root | string | 根 div |
| splitter | string | 左右分栏 `Splitter` |
| panel / panelMain | string | 左（文件树）/ 右（tabs）两个 `SplitterPanel` |

### FileEditorStyles {#fileeditorstyles}

同构：`root` / `splitter` / `panel` / `panelMain`（`CSSProperties`）；根上宿主 `style` 优先于 `styles.root`。

## 语义化 DOM {#semantic-dom}

| 区域 | 说明 |
| --- | --- |
| root | 根 div：`loncra-file-editor` + `hashId` + `cssVarCls` + `classes.root` + `rootClass` + 宿主 `class`；两个隐藏 Upload 触发器也在这里 |
| splitter | `Splitter`（`-splitter`）：`classes.splitter` / `styles.splitter` |
| panel / panelMain | 左右 `SplitterPanel`：`classes.panel` / `classes.panelMain`（+ styles 同名键） |
| conversation | 左侧 `FileConversation`（`loncra-file-conversation`，见其前缀体系） |
| tabs | 右侧 `FileTabs`（`loncra-file-tabs`，见其前缀体系） |

无落点清单：文件树行内节点（复选 / 图标 / 操作菜单）、tab 页签、各 pane 内部由 `FileConversation` / `FileTabs` / 各 Pane 自行暴露；本控件不重复开口。
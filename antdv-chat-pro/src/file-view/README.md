# `FileView` 文件预览

左右分栏的只读文件预览：左侧目录树，右侧多页签。目录和文件内容由调用方的数据口提供，控件本身不访问附件服务。

## 何时使用 {#when-to-use}

- 需要同一套目录树、刷新、预览和定位，而文件来自不同存储时。
- 上传、重命名、删除、保存由外层控件通过插槽补上。附件场景用 `AttachmentFileEditor`。

## 代码演示 {#examples}

```vue
<FileView :source="source" name="文档" />
```

```ts
const source: FileViewSource = {
  async list(parent) {
    return parent ? parent.children ?? [] : roots
  },
  async open(node) {
    return {type: 'url', url: node.id}
  },
}
```

## API

### 属性 {#props}

| 属性 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| source | 列目录与打开文件。`open` 返回 `url` 或 `blob` | `FileViewSource` | 必填 | - |
| name | 左上角标题 | `string` | - | - |
| height / maxHeight | 根容器高度 | `string \| number` | - | - |
| getIcon | 目录树和页签共用的文件图标 | `(node: FileViewNode) => VNodeChild` | 文件夹 / 文件图标 | - |
| confirmClose | 关闭页签前的确认。返回 `false` 则留下该页 | `(node: FileViewNode) => Promise<boolean>` | - | - |
| toolbarActions | 接在刷新后面的工具栏动作，和刷新一起放进同一个 `ActionButton` | `ResolvedAction[]` | - | - |
| menuItems | 行上「…」菜单的追加项。目录本身已有刷新 | `(node: FileViewNode) => MenuItemType[]` | - | - |
| classes / styles | 语义化区域 | 见下 | - | - |
| prefixCls / rootClass | 前缀 / 根类名 | `string` | - | - |

没有 `readonly`。文本页始终只读。`source` 对象身份变化时会重新加载根目录。

### 插槽 {#slots}

| 插槽 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| title | 替换行标题。返回空则显示 `name` | `(props: {node}) => VNode` | - |
| tabExtra | 定位按钮之前的内容 | `(props: {node}) => VNode` | - |
| pane | 替换当前页。返回空则按类型做只读预览 | `(props: {node}) => VNode` | - |

### 方法 {#methods}

| 方法 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| reveal | 展开已加载的祖先并滚到该行 | `(id: string) => void` | - |
| reload | `null` 重载根并清空页签；目录节点只重载其子项 | `(node: FileViewNode \| null) => Promise<void>` | - |
| closeTabs | 关掉匹配的页签 | `(match: (node: FileViewNode) => boolean) => void` | - |

## 类型 {#types}

### FileViewOpenResult {#fileviewopenresult}

| 属性 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| type | `url` 或 `blob` | `'url' \| 'blob'` | - | - |
| url | `type` 为 `url` 时的地址 | `string` | - | - |
| blob | `type` 为 `blob` 时的内容 | `Blob` | - | - |

图片、视频、音频把地址当作 `src`。`blob` 会做成对象地址，页关闭或重新加载时由预览壳撤销。文本对地址发请求，或调用 `blob.text()`。

## 语义化 DOM {#semantic-dom}

| 区域 | 说明 |
| --- | --- |
| root | 根 div：`loncra-file-view` + `hashId` + `cssVarCls` + `classes.root` + `rootClass` + 宿主 `class` / `style` |
| splitter | 左右分栏 |
| panel / panelMain | 左树 / 右页签 |

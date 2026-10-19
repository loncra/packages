# `BasicImage` 图片

展示一张图片，加载失败时回退到包内自带的占位图；预览能力仍由 `antdv-next` 的 `Image` 提供。

## 何时使用 {#when-to-use}

- 列表、卡片、详情里显示缩略图，且希望"没有图"时也有稳定外观。
- 需要点击查看大图，但不想每个调用点自己处理 `fallback`。

## 代码演示 {#examples}

### 缩略图

```vue
<l-basic-image src="https://example.com/cover.png" alt="封面" class="size-24 rounded" />
```

### 关掉预览

```vue
<l-basic-image :src="record.cover" :preview="false" />
```

`class` 落在本组件的外层 `div`（用来给宿主写尺寸 / 圆角），不落在 `img` 上。

## API

### 属性 {#props}

| 属性 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| preview | 是否开启点击预览 | boolean | `true` | - |
| fallback | 加载失败时用的图；不传就用包内自带的占位图 | string | 包内 `ImageNotFound.svg` | - |
| prefixCls | 改根前缀 | string | -（组件内兜底 `loncra-basic-image`） | - |
| rootClass | 追加到根元素 | string | - | - |
| classes | 原样交给 `Image` 的语义类：`root` / `image` / `cover`，预览层另有 `popup.root` / `popup.mask` / `popup.body` / `popup.footer` / `popup.actions` / `popup.close` | `ImageProps['classes']` | - | - |
| styles | 同上，语义样式 | `ImageProps['styles']` | - | - |

`prefixCls` 不传时组件内部用的是非空兜底（`loncra-basic-image`），因此 `ConfigProvider` 的全局 `prefixCls` **不会**影响它；要跟随全局就显式传 `prefixCls`。

`class` / `style` 未声明，走 attrs；其余 attrs（`src` / `alt` / `width` / `height` / `onError` …）透传给内部 `Image`。

### 插槽 {#slots}

| 插槽 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| cover | 预览遮罩内容；**只在 `preview` 为真时**才透给 `Image` | `() => any` | - |
| fallback | 自定义失败态，透给 `Image` | `() => any` | - |
| placeholder | 加载中的占位，透给 `Image` | `() => any` | - |

`Image` 还支持 `imageRender` / `actionsRender` 两个插槽，本组件**没有**透传；要定制只能等这两个能力补进来，或绕过本控件直接用 `Image`。`preview` 声明成 `Boolean`：TS 里传 `Image` 的预览配置对象会报类型错，但运行时 Vue 不会丢值，仍会原样交给 `Image`（它能接对象）。

## 语义化 DOM {#semantic-dom}

- 根元素是一个 `div`：`loncra-basic-image` + `hashId` + `cssVarCls` + `rootClass` + 宿主 `class`，`style` 也落在这里。
- 根上固定 `display: block`、`width: 100%`、`height: 100%`、`overflow: hidden`。
- 根内的 `.ant-image`、`.ant-image-img` 一律 `width: 100%`、`height: 100%`、`object-fit: cover`、`object-position: center`；`img` 本身**不在**规则里，是 `.ant-image-img` 恰好挂在 antd 渲染的那个 `img` 上才生效。宿主经插槽塞进来的裸 `img` 不受这条规则约束。
- 内部**没有自有类名**的节点：`.ant-image`、`img`、`.ant-image-img` 以及预览层（`.ant-image-preview-*`），都只有 antd 的类名。
- 预览层传送到 `body`：根上的 `class` 与选择器都够不到它，要定制预览外观用 `classes.popup.*` / `styles.popup.*`。

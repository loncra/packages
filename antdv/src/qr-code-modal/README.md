# `QrCodeModal` 二维码弹窗

把一段地址渲染成二维码，并配一行只读地址与复制按钮。

## 何时使用 {#when-to-use}

- 把链接分享给手机端扫码打开。
- 需要二维码与"复制链接"在同一屏内。

## 代码演示 {#examples}

```vue
<l-qr-code-modal
  v-model:open="open"
  :url="shareUrl"
  :classes="{ modal: { container: 'w-[420px]' } }"
/>
```

## API

### 属性 {#props}

| 属性 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| url | 要编码的地址；同时也是复制按钮写入剪贴板的内容 | string | -（必填） | - |
| open | 是否显示 | boolean | `false` | - |
| class / style | 未声明，走 attrs：透传给 `Modal`，`class` 落在对话框本体 `.ant-modal` | - | - | - |
| rootClass | 未声明，走 attrs：作为 `Modal` 的 `rootClass` 传入，落在传送包裹层 `.ant-modal-root` | string | - | - |
| classes | 区域表，见 [语义化 DOM](#semantic-dom)：`modal` / `content` / `qrcode` / `urlInput` / `copyButton` | `QrCodeModalClasses` | - | - |
| styles | 同上区域的样式表；`content` 是 `CSSProperties`，其余区域是该 antd 组件的原生 `styles` | `QrCodeModalStyles` | - | - |

**`classes` / `styles` 是区域表，不是 `Modal` 的键直接平铺**：弹窗自身的语义键写在 `classes.modal` 下（`classes.modal.container`），其余四个区域各管一个节点。

### 事件 {#events}

| 事件 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| update:open | 用户关闭时触发（右上角关闭、点遮罩或按 Esc） | `(open: boolean) => void` | - |

### 插槽 {#slots}

| 插槽 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| copyIcon | 复制按钮的图标，入参是当前是否已复制 | `(ctx: { copied: boolean }) => any` | - |

## 语义化 DOM {#semantic-dom}

| 区域 | 说明 |
| --- | --- |
| root | **没有自有根元素、没有 `prefixCls`、没有样式文件**：渲染结果就是一个 `Modal`；`class` 落对话框本体 `.ant-modal`，`rootClass` 落传送包裹层 `.ant-modal-root` |
| modal | `Modal` 的语义键全部可用（`root` / `wrapper` / `container` / `header` / `title` / `body` / `footer` / `close` / `mask`），值原样透传，不改名 |
| content | 内容层的 `Flex`（纵向、水平居中、`gap: middle`）：本组件自己的节点，值退化为 `string` / `CSSProperties` |
| qrcode | 内部 `QRCode`：语义键 `root` / `cover` 原样透传 |
| urlInput | 只读地址输入框 `Input` 的语义键原样透传 |
| copyButton | 复制按钮 `Button` 的语义键原样透传 |

- `title` 固定取本包 locale 的「分享」，`footer` 为 `null`；内容是一个纵向排列、水平居中、`gap` 为 middle 的 `Flex`：`QRCode` + 一行「禁用状态的 `Input`（显示 url） + 复制按钮」。
- 二维码尺寸是主题 token 的 `sizeLG * 10`，**没有暴露尺寸属性**。
- **无落点**：包住地址行与复制按钮的 `SpaceCompact` 没有语义键（antd 那一层也没有），要控这一行的样式用 `classes.content` 或分别写 `urlInput` / `copyButton`。
- `attrs` 在显式属性**之前**展开，所以 `title`、`footer`、`onCancel` 会被本组件覆盖，宿主传这三个不生效；`onOk` 不会被覆盖，但 `footer` 是 `null`、没有确认按钮可触发它。
- 复制成功后按钮文字色变 `cyan`、图标换成对勾（`copyIcon` 插槽可替换图标），关闭弹窗时重置。
- 弹层传送到 `body`：`class` 落在 `.ant-modal`（它本身就在传送的子树里），因此可以用它往下写 `.ant-modal-container` / header / body；但它作用不到 `.ant-modal-root`、`.ant-modal-wrap`、遮罩这些**祖先层**，那几层要用 `rootClass` 或 `classes.modal.*`。
- 复制走 `navigator.clipboard.writeText`：非安全上下文（http 且非 localhost）会失败，且本组件**没有 try/catch**，表现为未捕获异常、界面无提示；需要兜底就在宿主侧自己包一层。

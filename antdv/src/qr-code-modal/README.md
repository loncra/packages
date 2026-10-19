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
  :classes="{ container: 'w-[420px]' }"
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
| classes / styles | 未声明，走 attrs：按 `Modal` 的语义键分发（`root` / `header` / `body` / `footer` / `container` / `title` / `wrapper` / `mask` / `close`） | - | - | - |

### 事件 {#events}

| 事件 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| update:open | 用户关闭时触发（右上角关闭、点遮罩或按 Esc） | `(open: boolean) => void` | - |

### 插槽 {#slots}

| 插槽 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| copyIcon | 复制按钮的图标，入参是当前是否已复制 | `(ctx: { copied: boolean }) => any` | - |

## 语义化 DOM {#semantic-dom}

- **没有自有根元素、没有 `prefixCls`、没有样式文件**：渲染结果是一个 `Modal`。
- `title` 固定取本包 locale 的「分享」，`footer` 为 `null`；内容是一个纵向排列、水平居中、`gap` 为 middle 的 `Flex`：`QRCode` + 一行「禁用状态的 `Input`（显示 url） + 复制按钮」。
- 二维码尺寸是主题 token 的 `sizeLG * 10`，**没有暴露尺寸属性**。
- `attrs` 在显式属性**之前**展开，所以 `title`、`footer`、`onCancel` 会被本组件覆盖，宿主传这三个不生效；`onOk` 不会被覆盖，但 `footer` 是 `null`、没有确认按钮可触发它。
- 复制成功后按钮文字色变 `cyan`、图标换成对勾（`copyIcon` 插槽可替换图标），关闭弹窗时重置。
- `classes` / `styles` 的键就是 `Modal` 的语义键，本组件不额外增加类名：`root` → `.ant-modal-root`、`wrapper` → `.ant-modal-wrap`、`container` → `.ant-modal-container`、`header` / `title` / `body` / `footer` / `close` / `mask` 各自对应同名节点。
- 弹层传送到 `body`：`class` 落在 `.ant-modal`（它本身就在传送的子树里），因此可以用它往下写 `.ant-modal-container` / header / body；但它作用不到 `.ant-modal-root`、`.ant-modal-wrap`、遮罩这些**祖先层**，那几层要用 `rootClass` 或 `classes.*`。
- 复制走 `navigator.clipboard.writeText`：非安全上下文（http 且非 localhost）会失败，且本组件**没有 try/catch**，表现为未捕获异常、界面无提示；需要兜底就在宿主侧自己包一层。

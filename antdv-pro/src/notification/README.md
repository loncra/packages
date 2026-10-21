# useAppNotification 通知

按**分组去重**的通知 hook：同一个组里同一个 key 的通知，再次触发时先销毁旧的再弹新的 —— 适合"聊天消息 / 任务进度"这类同一来源反复弹的场景。

## 何时使用 {#when-to-use}

- 需要"同组同 key 不重复弹"的通知（宿主已在 `MyChatMessage` / `useChatNotification` 里用）。
- 只需要普通通知、没有分组去重诉求：直接用 antd 的 `App.useApp().notification`（本 hook 就是包着它 + 加了分组与样式）。

## 代码演示 {#examples}

```ts
import {useAppNotification} from '@loncra/antdv-pro'

const {info, destroy, createNotificationDescription} = useAppNotification()

// 同组（'chat:1'）里 key 相同的旧通知会被先销毁再弹新的
await info(
  {
    message: '新消息',
    description: createNotificationDescription(text),
  },
  `chat:${conversationId}`,
  messageId,
)

// 整组清理由调用方按 key 逐个 destroy
destroy(messageId)
```

## 行为

- **依赖宿主的 `<a-app>`**：内部取 `App.useApp().notification`，没有这个上下文用不了（`CrudFormPage` 等同款前提）。
- **key 分组缓存是模块级的**：跨调用方共享（页面 A 弹过的 key，页面 B 的同组通知也会去重）—— 这是设计而非疏漏。
- `info` 是异步的：同 key 命中时会先 `destroy` + `await nextTick()` 再弹，避免 antd 同帧复用 key 不刷新。
- 调用方传的 `classes` **只支持对象形态**（函数形态会被忽略）；`root` / `icon` / `title` 三个区域会被本 hook 的前缀类合并（调用方的类拼在后面，可覆盖外观）。

## API {#api}

| 成员 | 说明 | 类型 |
| --- | --- | --- |
| info | 弹一条通知（同组同 key 先销毁旧的） | `(props: ArgsProps, group?: string, key?: string) => Promise<void>` |
| destroy | 按 key 销毁，并从所有分组缓存里移除 | `(key: string) => void` |
| getNotificationKey | 读某组的 key 集合（判断"这个通知在不在"） | `(group: string) => Set<string> \| undefined` |
| createNotificationDescription | 两行省略的描述段落（空文本返回空串） | `(text: string) => VNode \| ''` |

`group` 缺省 `'default'`，`key` 缺省 `crypto.randomUUID()`（每次都算新通知）。

## 类型 {#types}

无独立导出类型；`props` 用 antd 的 `ArgsProps`。

## 语义化 DOM {#semantic-dom}

通知本体由 antd 挂在 `body` 下（`a-app` 的容器）。pro 只挂三个区域类：`${prefixCls}`（root，带 `hashId` + `cssVarCls`）、`${prefixCls}-description`、`${prefixCls}-icon`、`${prefixCls}-title`，样式见本目录 `style/`；前缀缺省 `loncra-app-notification`（本包两处 `getPrefixCls` 例外之一）。

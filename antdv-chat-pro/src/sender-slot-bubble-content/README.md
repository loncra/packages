# `SenderSlotBubbleContent` 词槽气泡内容

把词槽化的 `TextBlock[]` 渲染成气泡内容：text 块直接输出，custom 块交给宿主的 `renderBlock` 插槽。`ImBubbleContent` 与 `AgentUserContent` 内部在用。

## 何时使用

- 宿主自建气泡内容，手里是 `@loncra/chat-core` 的 `TextBlock[]`（发送器词槽序列化后的消息内容）。
- 只负责"文本 + 自定义块"的内容层，不承担气泡外壳与操作区。

## 代码演示

```tsx
import {SenderSlotBubbleContent} from '@loncra/antdv-chat-pro'
import type {TextBlock} from '@loncra/chat-core'

<SenderSlotBubbleContent
  content={blocks as TextBlock<string, unknown>[]}
  v-slots={{
    renderBlock: ({block}: {block: TextBlock<string, unknown>}) => {
      if (block.type !== 'custom') return null
      return <Tag>{(block as InstructionBlock).value?.value}</Tag>
    },
  }}
/>
```

## API

### 属性 {#props}

| 属性 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| content | 词槽化的消息内容 | `readonly TextBlock<string, unknown>[]` | 必填 | - |
| rootClass | 根类名，并入根节点 `class` | `string` | - | - |

### 插槽 {#slots}

| 插槽 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| renderBlock | custom 块的渲染出口；未提供时 custom 块渲染为空 | `({block: TextBlock<string, unknown>, index: number}) => VNodeChild` | - |

## 语义化 DOM {#semantic-dom}

| 区域 | 说明 |
| --- | --- |
| root | 根 `span`；`prefixCls` / `hashId` / `cssVarCls` / `rootClass` / `class` / `style` 及 rest attrs 都落这里；`white-space: pre-wrap` 与 `overflow-wrap: break-word` 声明在根上并向内继承 |

无 `classes` / `styles`（纯展示控件，内部无 antd 组件）；text 块是根下的裸 `span`，不提供区域 key。

其他边界：

- 仅 `type === 'text'` 且 `value` 为 string 的块走内置渲染，其余全部交给 `renderBlock`。
- `key` 用块下标；内容块列表是静态渲染，不做复用。
- 无事件、无方法、无请求。

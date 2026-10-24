# `DraftSender` 带草稿的发送器

`InstructionSender` 的草稿包装底座：输入变化防抖写入草稿库，页面隐藏/关闭/组件卸载时立即写入，会话切换时还原词槽。`ImSender` 与 `AgentSender` 都由它包装，宿主一般不直接使用。

## 何时使用

- 自建发送器且需要草稿能力（切会话不丢输入）：提供 `DraftBinding` 描述"这份草稿是谁、怎么读写"。
- 不需要草稿时直接用 `InstructionSender`。

## 代码演示

```tsx
import {ref} from 'vue'
import {DraftSender, type DraftBinding} from '@loncra/antdv-chat-pro'

const binding: DraftBinding<Live> = {
  key: () => currentSessionId.value,
  save: (live) => db.put(currentSessionId.value, live),
  load: () => db.get(currentSessionId.value),
  clear: () => db.delete(currentSessionId.value),
}

<DraftSender
  binding={binding}
  readLive={() => ({text, slots})}
  slotsOf={(live) => live.slots}
  onRestore={(result) => applyDraft(result)}
  onFilterDataSource={onFilterDataSource}
  senderInsertInstruction={senderInsertInstruction}
  createInstructionSlot={createInstructionSlot}
/>
```

## API

### 属性 {#props}

草稿相关的属性只此一套，其余属性、插槽、事件监听全部透传给 `InstructionSender`（见下方边界）。

| 属性 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| binding | 草稿绑定：这份草稿是谁（`key`）、怎么读写（`save` / `load` / `clear`） | `DraftBinding<any>` | 必填 | - |
| readLive | 读取当前输入的活数据，写入草稿库的内容 | `() => unknown` | 必填 | - |
| slotsOf | 从活数据里取出词槽，供还原判定 | `(live: unknown) => SlotConfigType[]` | 必填 | - |
| onRestore | 还原完成回调；`found: false` 表示无草稿 | `(result: DraftRestoreResult<unknown, SlotConfigType[]>) => void` | 必填 | - |
| saveSource | 词槽以外也要触发防抖写入的数据（IM 的引用条），返回值深比较 | `() => unknown` | - | - |
| slotConfig | 初始词槽；prop 变化会整体替换本地副本并触发一次写入 | `SlotConfigType[]` | - | - |
| placeholder | 占位文案，透传 `InstructionSender` | `string` | - | - |
| sending | 发送中，透传 `InstructionSender` | `boolean` | - | - |
| disabled | 禁用，透传 `InstructionSender` | `boolean` | - | - |
| instructionContextVisibleMargin | 透传 `InstructionSender` | `number` | - | - |
| instructionMap | 透传 `InstructionSender` | `Record<string, InstructionItem[]>` | - | - |

### 事件 {#events}

均转发 `InstructionSender` 同名事件；`change` 与 `pasteFile` 同时触发草稿防抖写入。

| 事件 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| change | 输入变化 | `(value: string, event?: Event, slotConfig?: SlotConfigType[]) => void` | - |
| pasteFile | 粘贴文件 | `(fileList: FileList) => void` | - |
| submit | 提交 | `(value: string, slotConfig?: SlotConfigType[]) => void` | - |
| cancel | 取消 | `() => void` | - |

### 方法 {#methods}

| 方法 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| flush | 立即写一次草稿 | `() => Promise<void>` | - |
| clearStored | 清空当前 key 的已存草稿 | `() => Promise<void>` | - |
| clear | 清空输入框（委托 `InstructionSender.clear`） | `() => void` | - |
| getSlotConfigValue | 读当前词槽 | `() => SlotConfigType[]` | - |
| getSender | 取 `InstructionSenderHandle` | `() => InstructionSenderHandle \| undefined` | - |

## 类型

### DraftBinding {#draftbinding}

| 参数 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| key | 草稿标识，通常是会话 id；为 `undefined` 时本组件不读不写。key 的字符串内容发送器不解释 | `() => string \| undefined` | - | - |
| save | 写入草稿库 | `(live: TLive) => Promise<void>` | - | - |
| load | 读取草稿库，`null` 视为无草稿 | `() => Promise<TLive \| null>` | - | - |
| clear | 清除草稿库中该 key 的记录 | `() => Promise<void>` | - | - |

其他边界：

- 写入时机：输入/粘贴/`saveSource` 变化后 400ms 防抖写入；`visibilitychange`（页面隐藏）、`beforeunload`、组件卸载、宿主调 `flush` 时立即写入。
- 还原时机：`binding.key()` 变化（含首次）时读草稿还原；还原期间（hydrate）不写，避免刚还原就被空稿覆盖。
- 还原只回写词槽：仅当内存中是占位稿（`isPlaceholderDraft` 判定，经 `@loncra/chat-core` 的 `decideDraftRestore`）才把草稿词槽写回输入框。
- `save` 失败静默：草稿库不可用或单文件超限时不阻断输入与切会话。
- 本组件无自有样式：不建 `prefixCls` / `style`；`class` / `style` 及其余 attrs 整体透传，`class` 落在 `InstructionSender` 根；无语义化 DOM 区域。
- 属性 `binding` 的泛型在 props 层为 `any`（函数参数逆变所限），`TLive` 的类型约束由使用方在 `DraftBinding<TLive>` 上自行收紧。

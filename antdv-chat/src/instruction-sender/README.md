# `InstructionSender` 可带指令的发送器

在 `@antdv-next/x` 的 `Sender` 之上扩展"指令补全"：输入 `prefix`（如 `/`）触发候选面板，键盘选中后由宿主把指令插进编辑器。业务匹配与插入方式全部由宿主注入，包不猜业务。

## 何时使用 {#when-to-use}

- 聊天 / Agent 输入框需要"`/` 唤起指令面板、上下键选择、回车插入指令芯片"的交互。
- 指令候选的数据源、过滤逻辑、插入后的芯片形态都由宿主定义时。

## 代码演示 {#examples}

```vue
<script setup lang="ts">
import {InstructionSender} from '@loncra/antdv-chat'

function onFilterDataSource(keyword, dataSource) {
  return dataSource.filter((item) => item.value.includes(keyword))
}
function createInstructionSlot(option, measure) {
  return {id: option.id}
}
function senderInsertInstruction(sender, block, measure) {
  sender.insert([block], 'cursor', `/${measure.keyword}`)
}
</script>

<template>
  <InstructionSender
    :instruction-map="{'/': instructions}"
    :on-filter-data-source="onFilterDataSource"
    :create-instruction-slot="createInstructionSlot"
    :sender-insert-instruction="senderInsertInstruction"
    placeholder="输入 / 唤起指令"
    @submit="onSubmit"
  />
</template>
```

## 行为 {#behavior}

- **指令触发**：光标前的文本里出现 `instructionMap` 的某个键（prefix），且 prefix 前是行首 / 空白 / 零宽空格，即打开候选面板；候选由宿主的 `onFilterDataSource` 过滤。
- **三个必填回调（B 类注入）**：`onFilterDataSource`（按关键字筛候选）、`createInstructionSlot`（选中后造一个"指令芯片"塞进 `slotConfig`，形状 / 渲染 / metadata 全归宿主）、`senderInsertInstruction`（选中后怎么插进编辑器）。
- **键盘**：面板打开时 ↑ / ↓ 移动高亮、Enter 选中、Escape 关闭（均 `preventDefault`，不透传给底座）；面板关闭时 Backspace 有"光标贴芯片整颗删"逻辑——见下。
- **芯片删除**：光标紧贴指令芯片（含插入时垫的那一个空格）按 Backspace，会把选区扩到整颗芯片交给 Sender 一次删掉，避免删一半留半颗残芯片。
- **视口锚点**：面板是 Teleport 到 body 的 Popover，用一个 `position: fixed` 的 `-anchor` span 跟随光标；窗口滚动 / 缩放、发送器进出视口（IntersectionObserver + ResizeObserver）时自动跟随或关闭（可配 `instructionContextVisibleMargin`，默认 8px）。中文输入法 composing 期间不触发补全。
- **上传粘贴**：`pasteFile` 事件原样向外抛 `FileList`，宿主自行处理。

## API

### 属性 {#props}

| 属性 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| slotConfig | 发送器槽位配置（禁用时强制清空） | `SlotConfigType[]` | - | - |
| placeholder | 占位文案 | string | `''` | - |
| sending | 发送中：输入区只读、按钮切 Loading | boolean | `false` | - |
| disabled | 禁用 | boolean | `false` | - |
| instructionContextVisibleMargin | 发送器 / 光标离开视口多少像素就收面板 | number | `8` | - |
| instructionMap | prefix → 候选列表 | `Record<string, InstructionItem[]>` | `{}` | - |
| onFilterDataSource | **必填**，按关键字筛候选 | [见类型](#useinstructionsenderparams) | - | - |
| senderInsertInstruction | **必填**，选中后插进编辑器 | [见类型](#useinstructionsenderparams) | - | - |
| createInstructionSlot | **必填**，造指令芯片 | [见类型](#useinstructionsenderparams) | - | - |
| inputClass | 追加到输入区（底座 `classes.input` 链路） | string | -（无默认类） | - |
| classes | 语义化 DOM 区域表，见下 | [InstructionSenderClasses](#instructionsenderclasses) | - | - |
| styles | 语义化 DOM 样式区域表 | [InstructionSenderStyles](#instructionsenderstyles) | - | - |
| prefixCls / rootClass | 前缀覆盖 / 根类名 | string | - | - |

`class` / `style` 走 attrs 落在 Sender 根；其余 attrs 透传给底座 `Sender`。

### 事件 {#events}

| 事件 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| submit | 底座提交（Enter / 点发送） | `(value: string, slotConfig?: SlotConfigType[]) => void` | - |
| cancel | 底座取消 | `() => void` | - |
| change | 内容变化（指令面板同步完成后发出） | `(value: string, event?: Event, slotConfig?: SlotConfigType[]) => void` | - |
| pasteFile | 粘贴文件 | `(fileList: FileList) => void` | - |

### 插槽 {#slots}

| 插槽 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| header | 发送器头部 | `() => any` | - |
| leftExtra / rightExtra | footer 左右扩展区 | `() => any` | - |
| defaultButton | 自定义默认按钮区（拿到 `components.ClearButton / LoadingButton / SendButton`） | `(props: {components: ActionsComponents}) => any` | - |
| instructionItemRender | 自定义单个候选项 | `(props: {index, item, prefix}) => any` | - |
| instructionListRender | 自定义整个候选面板（接管时键盘交互仍由组件处理） | `(props: {items, prefix, activeIndex, pick}) => any` | - |

### 方法 {#methods}

| 方法 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| clear | 清空内容并聚焦到末尾 | `() => void` | - |
| getSlotConfigValue | 取当前槽位配置 | `() => SlotConfigType[]` | - |
| getSender | 取底座发送器句柄 | `() => InstructionSenderHandle \| undefined` | - |
| senderRef | 底座句柄的响应式引用 | `Ref<InstructionSenderHandle \| undefined>` | - |

## 类型 {#types}

从包根导出：`InstructionSenderProps` {#instructionsenderprops} / `InstructionSenderEmits` {#instructionsenderemits} / `InstructionSenderSlots` {#instructionsenderslots} / `InstructionSenderExpose` {#instructionsenderexpose} / `InstructionSenderClasses` {#instructionsenderclasses} / `InstructionSenderStyles` {#instructionsenderstyles} / `InstructionItem` {#instructionitem} / `InstructionMeasure` {#instructionmeasure} / `InstructionPopoverState` {#instructionpopoverstate} / `InstructionSenderHandle` {#instructionsenderhandle} / `UseInstructionSenderParams` {#useinstructionsenderparams}；composable `useInstructionSender` 与 `InstructionSenderApi` {#instructionsenderapi} 同。

`useInstructionSender` 是指令面板状态机的对外出口（面板开关 / 候选 / 键盘处理），宿主自绘发送器但复用指令交互时用；配合 `InstructionSender` 使用时无需直接接触。

### InstructionSenderClasses {#instructionsenderclasses}

| 键 | 类型 | 落点 |
| --- | --- | --- |
| sender | `SenderProps['classes']`（七键语义表） | 原样透传给底座 `Sender`，`input` / `footer` 与组件固定注入合并 |
| popover | `PopoverProps['classes']` 的对象形态 | 指令面板 Popover（`root` / `content` 与组件固定注入合并） |
| panel | string | 候选面板容器（`-panel`） |
| item | string | 单个候选项（`-item`） |
| anchor | string | 光标锚点 span（`-anchor`） |

### InstructionSenderStyles {#instructionsenderstyles}

同构：`sender`（`SenderProps['styles']` 七键） / `popover`（`PopoverProps['styles']`） / `panel` / `item` / `anchor`（`CSSProperties`）。`anchor` 的动态定位值（跟随光标）在宿主样式之后写入，宿主样式只做外观补充。

## 语义化 DOM {#semantic-dom}

| 区域 | 说明 |
| --- | --- |
| root | 底座 `Sender` 根：`loncra-instruction-sender` + `hashId` + `cssVarCls` + `rootClass` + 宿主 `class`；`style` 落宿主 `style`；其余 attrs 透传 `Sender` |
| sender | 底座 `Sender` 的语义表入口（`classes.sender` / `styles.sender`，七键原样透传，`input` / `footer` 与固定注入合并） |
| popover | 指令面板 Popover：Teleport 到 body；组件固定注入 `hashedClass`（`class` / `rootClass` / `classes.root` / `classes.content` 四个入口都挂——**底座 `class` 进不了 `.ant-popover`，实际命中以运行时为准**，四个入口是历史兼容），宿主经 `classes.popover` / `styles.popover` 合并 |
| panel | 候选面板容器（`-panel`，最大高宽 `controlHeightLG × 6`，滚动） |
| item | 单个候选项（`-item`，高亮态 `-item-active`） |
| anchor | 光标锚点（`-anchor`，`position: fixed`，1px 宽） |

无落点清单：指令数据结构（`InstructionItem.metadata`）、composition 状态、编辑器滚动监听不提供宿主定制口。

- `-input` 区域的外层锚是自有类（顶层键 + hash）；底座 Sender 的内部子节点（slot 占位）必须引用它的真实类名——经 `token.antCls` 动态插值（`> ${antCls}-sender-slot…`），宿主改 `ConfigProvider` 的 prefixCls 时选择器跟随变化，不写死。

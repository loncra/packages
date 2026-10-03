import {Fragment, h, type VNode, type VNodeChild} from 'vue'
import {Tag} from 'antdv-next'
import type {InstructionChipData} from './types'

/**
 * 指令芯片的**唯一一处渲染**（宿主原话："芯片形状只有这一处定义"）。
 *
 * 两个调用点共用它，保证编辑器与气泡长得一致：
 * - **编辑器里的芯片**：`useImSender.createInstructionSlot` 的 `customRender`；
 * - **气泡里的芯片**：`ChatView.renderBlock` 的 `slotKind === 'instruction'` 分支。
 *
 * ⚠️ **移植口径（2026-10-03 用户拍定，别改回去）**：
 * 1. **芯片结构由模块自己渲染**（`antdv-next`，不依赖宿主组件）；
 * 2. **图标归宿主**（它的 icon-font / `instructionIconMap` 是宿主资产）⇒ 宿主用
 *    `ImSlots.instructionChip` 覆盖，一旦返回内容这里**整块交给它**（连 `Tag` 都不渲染）；
 * 3. `Tag` 的 `variant: 'outlined'` 照宿主 `chatUtils.ts:283` 的原文。
 */
/**
 * 渲染指令芯片；`override` 就是 `ImSlots.instructionChip`（宿主给了就**整块**用它）。
 *
 * 模块的默认 = `Tag(variant:'outlined')` + 文案，**不带图标** ——
 * 图标（宿主的 icon-font，如 `loncra-at-sign`）是**宿主的资产** ⇒ 由宿主用 `instructionChip`
 * 覆盖（2026-10-03 用户拍定："在宿主实现这个 icon，走 `instructionChip` 插槽"）。
 * 包内也**没有**可用的 at/mention 类图标（实测 `@antdv-next/icons` 无
 * `AtOutlined`/`MentionOutlined`）⇒ 默认**不猜图标**。
 */
/**
 * 把任何 `VNodeChild` 收口成**一个合法 VNode**。
 *
 * ⚠️ **必须有这一层**：x 的 `customRender` 只做 `render(child, dom)`（拿到的值会被当 vnode 直接读属性，
 * 例如 `isAsyncWrapper` 读 `vnode.type.__asyncLoader`）—— 给它**数组 / 字符串 / undefined** 会当场炸：
 * 报 `Invalid VNode type: undefined`，随后 PM 的 `CustomNodeViewDesc` 被写坏，连锁出
 * `Position 1 out of range` / `__asyncLoader` 崩溃（2026-10-03 实测，用户贴的整串报错）。
 * 宿主的插槽是模板编出来的，**可能是数组**（dev 下模板注释/多子节点都是数组）⇒ 这里统一收口。
 */
function toSingleVNode(value: VNodeChild): VNode {
  /**
   * ⚠️ **一律包一层 `span`**（哪怕宿主给的是单个 VNode）：x 是在自己的 `render(child, dom)` 里渲染它的，
   * 直接把宿主 render 出来的 VNode 塞进去，实测会炸 `Invalid VNode type: undefined` 并把节点视图写坏
   * （2026-10-03 用户贴的一整串报错）。包一层元素后，宿主的 VNode 走**正常子节点渲染路径**（Vue 容错），
   * 且这层是 inline 元素、不影响芯片外观。
   */
  const children = Array.isArray(value) ? (value as never) : [value as never]
  return h('span', null, children as never) as unknown as VNode
}

/** 渲染指令芯片；`override` 就是 `ImSlots.instructionChip`（宿主给了就**整块**用它） */
export function renderInstructionChip(
  data: InstructionChipData,
  override?: (props: {slot: InstructionChipData}) => VNodeChild,
): VNode {
  const fromHost = override?.({slot: data})
  if (fromHost) {
    return toSingleVNode(fromHost)
  }
  return h(
    Tag,
    {key: data.key, variant: 'outlined'},
    {
      default: () => data.value.value,
    },
  ) as unknown as VNode
}

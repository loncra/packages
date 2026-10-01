import {computed, defineComponent, type PropType} from 'vue'
import {classNames} from '@loncra/antdv'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import type {ChatBlockBase, TextBlock} from '@loncra/chat-core'
import useStyle from './style'

/**
 * `renderBlock` 插槽拿到的 `block`：规范的**块信封**（`type` 有类型）+ **域字段任意**。
 *
 * 为什么放宽：包**不认识域块**（`files` / `instruction` / `call` / `reference` / `undo` … 是域的形状），
 * 域在**自己的** `renderBlock` 里按 `slotKind` 收窄（与今天宿主 SFC 的用法完全一致）。
 * ⚠️ S3/S4 域迁入实现包后，可按域收紧成各自的块联合（那时这里应该消失）。
 */
export type SlotBubbleBlock = ChatBlockBase & {slotKind?: string} & Record<string, unknown>

/**
 * ⚠️ **只判 `type`**，与宿主原 SFC 的 `v-if="block.type === 'text'"` 完全一致。
 * 里面的 `as TextBlock` 是**纯类型层**的（规范的块信封把 `type` 声明成 `string`，`===` 不足以收窄）；
 * **不要**在这里再加 `typeof value === 'string'` 之类的运行时判断 —— `TextBlock.value: string` 已由类型保证，
 * 多判一层只会让"没有 value 的 text 块"掉进 `renderBlock` 插槽（原版渲染空 `span`）⇒ 变成行为差异。
 */

/**
 * 槽气泡内容：把内容块渲染成"**文字直接出，其余交给 `renderBlock` 插槽**"。
 *
 * 从宿主 `components/basic/chat/SenderSlotBubbleContent.vue` 迁入（2026-10-01，S2a-4）——**SFC → TSX**，
 * 行为逐条照抄（**无根节点**：直接出一个 fragment；文本块才套 `span`，其余原样交给插槽）。
 *
 * 命名修正：原组件名 `LSenderSoldBubbleContent`（拼写少了 t）⇒ 这里用正确的
 * `LSenderSlotBubbleContent` / `SenderSlotBubbleContent`（设计稿里的目标名也是这个拼写）。
 */
export const SenderSlotBubbleContent = defineComponent({
  name: 'LSenderSlotBubbleContent',
  props: {
    content: {type: Array as PropType<ChatBlockBase[]>, default: () => []},
    prefixCls: String,
  },
  setup(props, {slots}) {
    const config = useConfig()
    const prefixCls = computed(() =>
      config.value.getPrefixCls(
        'sender-slot-bubble-content',
        props.prefixCls ?? 'loncra-sender-slot-bubble-content',
      ),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)

    return () =>
      props.content.map((block, index) =>
        block.type === 'text' ? (
          <span
            key={index}
            class={classNames(prefixCls.value, hashId.value, cssVarCls.value, `${prefixCls.value}-text`)}
          >
            {(block as TextBlock).value}
          </span>
        ) : (
          slots.renderBlock?.({block, index}) ?? null
        ),
      )
  },
})

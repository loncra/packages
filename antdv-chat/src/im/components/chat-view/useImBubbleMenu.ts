import {h, ref, type Ref} from 'vue'
import {App, Space, StatisticTimer} from 'antdv-next'
import type {MenuItemType} from 'antdv-next'
import {CommentOutlined, UndoOutlined} from '@antdv-next/icons'
import {isEnumValue, YES_OR_NO_TYPE, type RestResult} from '@loncra/client/commons'
import {ChatMessageService, type UserChatMessageResponseBody} from '@loncra/client/message'
import {CHAT_ROLE, type ChatBubbleItem} from '@loncra/chat-core'
import {useLocale} from '../../../_util/useLocale'
import type {ImRuntime} from '../../useImChatContext'

export interface UseImBubbleMenuOptions {
  runtime: ImRuntime
  /** 引用条状态（模块自己持这份；点"引用"往里加一条） */
  refMessages: Ref<UserChatMessageResponseBody[]>
  /** 菜单里倒计时那行的 class（由 `ChatView` 从自己的样式表给：`subClass('menu-countdown')`） */
  countdownClass: string
}

/**
 * 气泡右键菜单（**引用 / 撤回 + 倒计时**）。
 *
 * 迁自宿主 `composables/message-server/chat/useChatBubbleList.ts:100-180`（`createMessageMenu` /
 * `onMessageMenuClick` / `onUndoMessage` / `doUndoMessage`）与 `ChatView.vue:257-263`（引用入列），
 * 2026-10-03（3-C3）。"撤回后重新编辑"的入口在**撤回块**里（`ChatView.renderBlock`），落点
 * `useImSender.reedit`。
 *
 * ⚠️ 与宿主的差异（都是"宿主依赖换包内件"，行为不变）：
 * 1. `$dayjs().isBefore(undoableTime)` ⇒ **`Date.now() < undoableTime`**（模块不引 dayjs；比时间戳等价）；
 * 2. 图标走 `ImSlots.icon`（宿主是 icon-font；宿主不给就用包内 antd 图标）；
 * 3. `modal` / `message` 用包内 `App.useApp()`（宿主是 `antdv-next/dist/app/useApp` 深路径）。
 */
export function useImBubbleMenu(options: UseImBubbleMenuOptions) {
  const {runtime, refMessages, countdownClass} = options
  const {slots} = runtime
  const locale = useLocale('ChatView')
  const {message, modal} = App.useApp()

  /** 撤回：先确认，再 `ChatMessageService.undoMessage([id])`（宿主 `useChatBubbleList.ts:107-126`） */
  function undoMessage(data: UserChatMessageResponseBody): void {
    modal.confirm({
      title: locale.value.undoConfirmTitle,
      content: locale.value.undoConfirmContent,
      onOk: async () => {
        try {
          const result: RestResult<void> = await ChatMessageService.undoMessage([Number(data.id)])
          message.success(result.message)
        } catch (error) {
          message.error(error instanceof Error ? error.message : String(error))
          // 抛出去 ⇒ 确认框不关（宿主同款：失败的 promise 让 modal 停在那里让用户重试）
          throw error
        }
      },
    })
  }

  /** 引用：塞进发送器引用区（宿主 `ChatView.vue:257-263`：已引用过就不重复加） */
  function referenceMessage(data: UserChatMessageResponseBody): void {
    if (refMessages.value.some((item) => item.id === data.id)) {
      return
    }
    refMessages.value.push(data)
  }

  /**
   * 菜单项（宿主三个条件逐条对应）：
   * ① 消息**没被撤回**（`undo === NO`）才出菜单；
   * ② "引用"所有气泡都有；
   * ③ "撤回"只在**自己发的**且在**可撤回时间窗内**（`Date.now() < undoableTime`）才出，带倒计时。
   */
  function createMessageMenu(item: ChatBubbleItem, role?: string): MenuItemType[] {
    const data = item.data as UserChatMessageResponseBody | undefined
    const items: MenuItemType[] = []
    if (!data || !isEnumValue(data.undo, YES_OR_NO_TYPE.NO)) {
      return items
    }
    items.push({
      key: 'reference',
      label: locale.value.reference,
      icon: slots.icon?.({type: 'reference'}) ?? h(CommentOutlined),
    })
    if (role === CHAT_ROLE.USER && Date.now() < Number(data.undoableTime ?? 0)) {
      /**
       * ⚠️ `disabled` 是**建菜单那一刻的快照**（宿主同款）—— 菜单每次右键都会重建，
       * 而倒计时归零时菜单通常已经关了 ⇒ 这个 `onFinish` 基本只影响"菜单一直开着"的极端情形。
       */
      const disabled = ref(false)
      items.push({
        key: 'undo',
        label: h(
          Space,
          {},
          {
            default: () => [
              locale.value.undoAction,
              h(StatisticTimer, {
                classes: {content: countdownClass},
                onFinish: () => {
                  disabled.value = true
                },
                type: 'countdown',
                value: data.undoableTime,
                format: locale.value.undoCountdown,
              }),
            ],
          },
        ),
        icon: slots.icon?.({type: 'undo'}) ?? h(UndoOutlined),
        danger: true,
        disabled: disabled.value,
      })
    }
    return items
  }

  function onMessageMenuClick(event: {key: string | number}, item: ChatBubbleItem): void {
    const data = item.data as UserChatMessageResponseBody | undefined
    if (!data) {
      return
    }
    if (event.key === 'reference') {
      referenceMessage(data)
    } else if (event.key === 'undo') {
      undoMessage(data)
    }
  }

  return {createMessageMenu, onMessageMenuClick, referenceMessage}
}

export type ImBubbleMenuApi = ReturnType<typeof useImBubbleMenu>

import useApp from 'antdv-next/dist/app/useApp'
import {ChatMessageService} from '@loncra/client/message'
import {useLocale} from '../../_util/useLocale'

export function useImMessageActions() {
  const {modal, message} = useApp()
  const locale = useLocale('ImBubble')

  function confirmUndo(messageId: number): void {
    modal.confirm({
      title: locale.value.undoConfirmTitle,
      content: locale.value.undoConfirmContent,
      onOk: async () => {
        try {
          const result = await ChatMessageService.undoMessage([messageId])
          message.success(result.message)
        } catch (error) {
          message.error(error instanceof Error ? error.message : String(error))
          throw error
        }
      },
    })
  }

  return {confirmUndo}
}

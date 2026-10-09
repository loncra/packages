import {ChatMessageService} from '@loncra/client/message'

export async function undoImMessage(
  id: number,
  message: {success: (text?: string) => void; error: (text?: string) => void},
): Promise<void> {
  try {
    const result = await ChatMessageService.undoMessage([id])
    message.success(result.message)
  } catch (error) {
    message.error(error instanceof Error ? error.message : String(error))
    throw error
  }
}

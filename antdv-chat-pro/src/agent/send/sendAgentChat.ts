import type {RestResult} from '@loncra/client/commons'
import {
  AgentService,
  type AgentChatBasicResponseBody,
  type AgentChatRequestBody,
  type AgentChatResponseBody,
} from '@loncra/client/ai'

export function sendAgentChat(
  body: AgentChatRequestBody,
): Promise<RestResult<AgentChatResponseBody>> {
  return AgentService.chat(body)
}

export function interruptAgent(
  assistantMessageId: number,
): Promise<RestResult<AgentChatBasicResponseBody>> {
  return AgentService.interrupt(assistantMessageId)
}

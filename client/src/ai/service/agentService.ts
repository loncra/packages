import {
    type FilterRequest,
    formUrlEncoded,
    type PageRequest,
    type PageResult,
    type RestResult,
    SYSTEM_MODULE_NAME,
} from '../../commons'
import {http, modulePrefix} from '../../http'
import type {
    AgentChatBasicResponseBody,
    AgentChatRequestBody,
    AgentChatResponseBody,
    AgentConversationEntity,
    AgentMessageEntity,
    AgentResumeRequestBody,
} from '../domain/agent.ts'
import {AI_SERVER_EXECUTION_CHANNEL, type ExecutionChannel} from '../enumerate.ts'

export class AgentService {
  static get BASE_URL(): string {
    return modulePrefix(SYSTEM_MODULE_NAME.AI_SERVER)
  }

  static get CONVERSATION_URL(): string {
    return AgentService.BASE_URL + '/agent/conversation'
  }

  static get MESSAGE_URL(): string {
    return AgentService.BASE_URL + '/agent/message'
  }

  static get CHAT_URL(): string {
    return AgentService.BASE_URL + '/agent'
  }

  static get STREAM_URL(): string {
    return AgentService.CHAT_URL + '/stream'
  }

  static buildStreamUrl(
    assistantMessageId: string,
    loadHistory: boolean,
    channel: ExecutionChannel = AI_SERVER_EXECUTION_CHANNEL.CLOUD,
  ): string {
    return `${AgentService.STREAM_URL}/${assistantMessageId}?loadHistory=${loadHistory}&channel=${channel}`
  }

  static get HISTORY_URL(): string {
    return AgentService.MESSAGE_URL + '/history'
  }

  static get MESSAGE_POSITIONING_PAGE_NUMBER_URL(): string {
    return AgentService.MESSAGE_URL + '/positioning/page/number'
  }

  static findConversation(
    request: FilterRequest = {},
    channel: ExecutionChannel = AI_SERVER_EXECUTION_CHANNEL.CLOUD,
  ): Promise<RestResult<AgentConversationEntity[]>> {
    return http().request({
      url: AgentService.CONVERSATION_URL,
      method: 'POST',
      data: formUrlEncoded({...request, channel} as Record<string, unknown>),
      bodyType: 'form',
    })
  }

  static deleteConversation(ids: string[], channel: ExecutionChannel = AI_SERVER_EXECUTION_CHANNEL.CLOUD): Promise<RestResult<void>> {
    return http().request({
      url: AgentService.CONVERSATION_URL,
      method: 'DELETE',
      params: formUrlEncoded({ids, channel}),
    })
  }

  static saveConversation(
    entity: AgentConversationEntity,
    channel: ExecutionChannel = AI_SERVER_EXECUTION_CHANNEL.CLOUD,
  ): Promise<RestResult<string>> {
    return http().request({
      url: AgentService.CONVERSATION_URL + '/' + channel,
      method: 'PUT',
      data: entity,
      bodyType: 'json',
    })
  }

  static histories(
    request: PageRequest,
    conversationId: string,
    channel: ExecutionChannel = AI_SERVER_EXECUTION_CHANNEL.CLOUD,
  ): Promise<RestResult<PageResult<AgentMessageEntity>>> {
    return http().request({
      url: AgentService.HISTORY_URL + '/' + conversationId,
      method: 'POST',
      data: formUrlEncoded({...request, channel} as Record<string, unknown>),
      bodyType: 'form',
    })
  }

  static deleteMessage(ids: number[]): Promise<RestResult<void>> {
    return http().request({
      url: AgentService.MESSAGE_URL,
      method: 'DELETE',
      params: formUrlEncoded({ids}),
    })
  }

  static positioningMessagePageNumber(
    conversationId: string,
    messageId: string,
    size: number,
    channel: ExecutionChannel = AI_SERVER_EXECUTION_CHANNEL.CLOUD,
  ): Promise<RestResult<number>> {
    return http().request({
      url:
        AgentService.MESSAGE_POSITIONING_PAGE_NUMBER_URL +
        '/' +
        conversationId +
        '/' +
        messageId +
        '/' +
        size +
        '?channel=' +
        channel,
      method: 'GET',
    })
  }

  static chat(body: AgentChatRequestBody): Promise<RestResult<AgentChatResponseBody>> {
    return http().request({
      url: AgentService.CHAT_URL,
      method: 'POST',
      data: {...body, channel: body.channel ?? AI_SERVER_EXECUTION_CHANNEL.CLOUD},
      bodyType: 'json',
    })
  }

  static resume(body: AgentResumeRequestBody): Promise<RestResult<AgentChatBasicResponseBody>> {
    return http().request({
      url: AgentService.CHAT_URL,
      method: 'PUT',
      data: {...body, channel: body.channel ?? AI_SERVER_EXECUTION_CHANNEL.CLOUD},
      bodyType: 'json',
    })
  }

  static interrupt(assistantMessageId: string, channel: ExecutionChannel = AI_SERVER_EXECUTION_CHANNEL.CLOUD): Promise<RestResult<AgentChatBasicResponseBody>> {
    return http().request({
      url: AgentService.CHAT_URL + '/' + assistantMessageId,
      method: 'DELETE',
      params: formUrlEncoded({channel}),
    })
  }
}

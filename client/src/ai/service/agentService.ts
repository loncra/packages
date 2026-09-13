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

  static get HISTORY_URL(): string {
    return AgentService.MESSAGE_URL + '/history'
  }

  static get MESSAGE_POSITIONING_PAGE_NUMBER_URL(): string {
    return AgentService.MESSAGE_URL + '/positioning/page/number'
  }

  static findConversation(
    request: FilterRequest = {},
  ): Promise<RestResult<AgentConversationEntity[]>> {
    return http().request({
      url: AgentService.CONVERSATION_URL,
      method: 'POST',
      data: formUrlEncoded(request as Record<string, unknown>),
      bodyType: 'form',
    })
  }

  static deleteConversation(ids: number[]): Promise<RestResult<void>> {
    return http().request({
      url: AgentService.CONVERSATION_URL,
      method: 'DELETE',
      params: formUrlEncoded({ids}),
    })
  }

  static saveConversation(entity: AgentConversationEntity): Promise<RestResult<number>> {
    return http().request({
      url: AgentService.CONVERSATION_URL,
      method: 'PUT',
      data: entity,
      bodyType: 'json',
    })
  }

  static histories(
    request: PageRequest,
    conversationId: number,
  ): Promise<RestResult<PageResult<AgentMessageEntity>>> {
    return http().request({
      url: AgentService.HISTORY_URL + '/' + conversationId,
      method: 'POST',
      data: formUrlEncoded(request as Record<string, unknown>),
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
    conversationId: number,
    messageId: number,
    size: number,
  ): Promise<RestResult<number>> {
    return http().request({
      url:
        AgentService.MESSAGE_POSITIONING_PAGE_NUMBER_URL +
        '/' +
        conversationId +
        '/' +
        messageId +
        '/' +
        size,
      method: 'GET',
    })
  }

  static chat(body: AgentChatRequestBody): Promise<RestResult<AgentChatResponseBody>> {
    return http().request({
      url: AgentService.CHAT_URL,
      method: 'POST',
      data: body,
      bodyType: 'json',
    })
  }

  static resume(body: AgentResumeRequestBody): Promise<RestResult<AgentChatBasicResponseBody>> {
    return http().request({
      url: AgentService.CHAT_URL,
      method: 'PUT',
      data: body,
      bodyType: 'json',
    })
  }

  static interrupt(assistantMessageId: number): Promise<RestResult<AgentChatBasicResponseBody>> {
    return http().request({
      url: AgentService.CHAT_URL + '/' + assistantMessageId,
      method: 'DELETE',
    })
  }
}

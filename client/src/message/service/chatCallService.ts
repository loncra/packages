import {formUrlEncoded, type RestResult, SYSTEM_MODULE_NAME} from '../../commons'
import {http, modulePrefix} from '../../http'
import type {
  ChatCallType,
  UserChatCallEntity,
  UserChatCallParticipantEntity,
  UserChatCallResponseBody,
} from '../domain/userChat.ts'

export class ChatCallService {
  static get BASE_URL(): string {
    return modulePrefix(SYSTEM_MODULE_NAME.MESSAGE_SERVER)
  }

  static get SERVICE_URL(): string {
    return ChatCallService.BASE_URL + '/user/chat/call'
  }

  static get ACCEPT_URL(): string {
    return ChatCallService.SERVICE_URL + '/accept'
  }

  static get REJECTED_URL(): string {
    return ChatCallService.SERVICE_URL + '/rejected'
  }

  static create(
    userChatRoomId: number,
    type: ChatCallType,
    callingPrincipals: string[],
  ): Promise<RestResult<UserChatCallResponseBody>> {
    return http().request({
      url: ChatCallService.SERVICE_URL + '/' + type + '/' + userChatRoomId,
      method: 'POST',
      data: formUrlEncoded({callingPrincipals}),
      bodyType: 'form',
    })
  }

  static completed(userChatCallId: number): Promise<RestResult<void>> {
    return http().request({
      url: ChatCallService.SERVICE_URL,
      method: 'DELETE',
      params: formUrlEncoded({userChatCallId}),
    })
  }

  static accept(userChatCallId: number): Promise<RestResult<UserChatCallParticipantEntity>> {
    return http().request({
      url: ChatCallService.ACCEPT_URL + '/' + userChatCallId,
      method: 'PUT',
    })
  }

  static rejected(userChatCallId: number): Promise<RestResult<void>> {
    return http().request({
      url: ChatCallService.REJECTED_URL + '/' + userChatCallId,
      method: 'PUT',
    })
  }

  static getUserChatCall(
    userChatCallId: number,
    responseBody = false,
  ): Promise<RestResult<UserChatCallEntity | UserChatCallResponseBody>> {
    return http().request({
      url: ChatCallService.SERVICE_URL + '/' + userChatCallId,
      method: 'GET',
      params: formUrlEncoded({responseBody}),
    })
  }
}

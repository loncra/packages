import {inject, type InjectionKey, provide, reactive} from 'vue'
import useApp from 'antdv-next/dist/app/useApp'
import {isBusinessSuccess, isEnumValue, timeToMs} from '@loncra/client/commons'
import {
  ChatCallService,
  MESSAGE_SERVER_MESSAGE_GROUP,
  MESSAGE_SERVER_USER_CHAT_CALL_PARTICIPANT_STATUS,
  MESSAGE_SERVER_USER_CHAT_CALL_STATUS,
  MESSAGE_SERVER_USER_CHAT_PARTICIPANT_TYPE,
  type UserChatCallEntity,
  type UserChatCallParticipantEntity,
  type UserChatCallResponseBody,
} from '@loncra/client/message'
import type {ImChatCallHost} from '../host.ts'
import {createImCallMedia, type ImCallMedia, type ImCallMediaState} from './media.ts'

const IM_CHAT_CALL_KEY: InjectionKey<ImChatCallSession> = Symbol('imChatCall')

export interface ImCallWindowState {
  open: boolean
  title: string
  loading: boolean
  width?: number
  height?: number
  fullscreen: boolean
  minimized: boolean
  closeDeadline?: number
  call?: UserChatCallResponseBody
  mediaState: ImCallMediaState
}

export interface ImChatCallSession {
  host: ImChatCallHost
  state: ImCallWindowState
  media?: ImCallMedia
  open: (title: string, call: UserChatCallResponseBody) => Promise<void>
  accept: (callId: number) => Promise<void>
  reject: (callId: number) => Promise<void>
  hangUp: () => Promise<void>
  setMinimized: (minimized: boolean) => Promise<void>
  setFullscreen: (active: boolean) => void
  setFrame: (width: number, height: number) => void
  onCallUpdate: (entity: UserChatCallEntity) => void
  onCallCompleted: (entity: UserChatCallEntity) => void
  onParticipantUpdate: (participant: UserChatCallParticipantEntity) => void
  onCallConfirm: (participant: UserChatCallParticipantEntity) => Promise<void>
}

function emptyMediaState(camera: boolean): ImCallMediaState {
  return {
    localMicrophone: true,
    localCamera: camera,
    remoteMicrophone: true,
    remoteCamera: true,
  }
}

async function exitDocumentFullscreen() {
  if (typeof document !== 'undefined' && document.fullscreenElement) {
    await document.exitFullscreen()
  }
}

export function provideImChatCall(host: ImChatCallHost): ImChatCallSession {
  const {message, notification} = useApp()
  let unsubscribe = () => {}

  const state = reactive<ImCallWindowState>({
    open: false,
    title: '',
    loading: false,
    fullscreen: false,
    minimized: false,
    mediaState: emptyMediaState(true),
  })

  const session = {} as ImChatCallSession
  session.host = host
  session.state = state

  function dismiss(callId: number) {
    notification.destroy(`${MESSAGE_SERVER_MESSAGE_GROUP.USER_CHAT_CALL}_${callId}`)
  }

  function resetWindow() {
    unsubscribe()
    unsubscribe = () => {}
    state.open = false
    state.title = ''
    state.loading = false
    state.width = undefined
    state.height = undefined
    state.fullscreen = false
    state.minimized = false
    state.closeDeadline = undefined
    state.call = undefined
    state.mediaState = emptyMediaState(true)
    session.media = undefined
  }

  session.open = async (title, call) => {
    await session.media?.close()
    unsubscribe()
    state.call = call
    state.title = title
    state.open = true
    state.loading = false
    state.fullscreen = false
    state.minimized = false
    state.closeDeadline = undefined
    state.width = undefined
    state.height = undefined
    state.mediaState = emptyMediaState(true)
    const media = createImCallMedia(call, host.selfName)
    session.media = media
    unsubscribe = media.subscribe((next) => {
      state.mediaState = next
    })
  }

  session.hangUp = async () => {
    if (!state.call && !state.open) {
      return
    }
    state.loading = true
    try {
      if (state.call && !isEnumValue(state.call.status, MESSAGE_SERVER_USER_CHAT_CALL_STATUS.COMPLETED)) {
        await ChatCallService.completed(Number(state.call.id))
      }
      await exitDocumentFullscreen()
      await session.media?.close()
      resetWindow()
    } finally {
      state.loading = false
    }
  }

  session.accept = async (callId) => {
    try {
      dismiss(callId)
      const result = await ChatCallService.getUserChatCall(callId, true)
      if (!result.data) {
        return
      }
      await session.open(' ', result.data as UserChatCallResponseBody)
      const accepted = await ChatCallService.accept(callId)
      if (!accepted.data) {
        await session.hangUp()
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : String(error))
    }
  }

  session.reject = async (callId) => {
    try {
      const result = await ChatCallService.rejected(callId)
      if (isBusinessSuccess(result)) {
        dismiss(callId)
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : String(error))
    }
  }

  session.setMinimized = async (minimized) => {
    if (minimized) {
      await exitDocumentFullscreen()
      state.fullscreen = false
    }
    state.minimized = minimized
  }

  session.setFullscreen = (active) => {
    state.fullscreen = active
  }

  session.setFrame = (width, height) => {
    if (state.fullscreen || state.minimized) {
      return
    }
    state.width = width
    state.height = height
  }

  session.onCallUpdate = (entity) => {
    if (!state.call || entity.id !== state.call.id) {
      return
    }
    state.call = {...state.call, ...entity}
  }

  session.onCallCompleted = (entity) => {
    session.onCallUpdate(entity)
    dismiss(Number(entity.id))
    if (state.open) {
      state.closeDeadline = Date.now() + timeToMs(host.closeTimeValue.value)
    }
  }

  session.onParticipantUpdate = (participant) => {
    if (!state.call) {
      return
    }
    const index = state.call.participants.findIndex((item) => item.id === participant.id)
    if (index < 0) {
      return
    }
    const current = state.call.participants[index]
    if (!current) {
      return
    }
    state.call.participants[index] = {...current, ...participant}
  }

  session.onCallConfirm = async (participant) => {
    if (!state.call || !session.media) {
      return
    }
    session.onParticipantUpdate(participant)
    if (!isEnumValue(participant.status, MESSAGE_SERVER_USER_CHAT_CALL_PARTICIPANT_STATUS.ACTIVE)) {
      return
    }
    if (participant.principal !== host.selfName) {
      const caller = state.call.participants.find((item) =>
        isEnumValue(item.type, MESSAGE_SERVER_USER_CHAT_PARTICIPANT_TYPE.CALLER),
      )
      if (caller && isEnumValue(caller.status, MESSAGE_SERVER_USER_CHAT_CALL_PARTICIPANT_STATUS.INITIATING)) {
        await ChatCallService.accept(Number(state.call.id))
        return
      }
    }
    await session.media.confirmParticipant(state.call, participant)
  }

  provide(IM_CHAT_CALL_KEY, session)
  return session
}

export function useImChatCall(): ImChatCallSession {
  const session = inject(IM_CHAT_CALL_KEY, null)
  if (!session) {
    throw new Error('useImChatCall() 必须在 provideImChatCall() 的组件子树内调用')
  }
  return session
}

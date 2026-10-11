import type {UserChatCallParticipantEntity, UserChatCallResponseBody} from '@loncra/client/message'

export interface ImCallMediaMetrics {
  width: number
  height: number
  aspect: number
}

export interface ImCallMediaState {
  localMicrophone: boolean
  localCamera: boolean
  remoteMicrophone: boolean
  remoteCamera: boolean
  localMetrics?: ImCallMediaMetrics
  remoteMetrics?: ImCallMediaMetrics
}

export type ImCallMediaRole = 'local' | 'remote'

export interface ImCallMedia {
  previewLocal(call: UserChatCallResponseBody): Promise<void>
  confirmParticipant(call: UserChatCallResponseBody, participant: UserChatCallParticipantEntity): Promise<void>
  attach(role: ImCallMediaRole, element: HTMLVideoElement): Promise<void>
  setMicrophoneEnabled(enabled: boolean): Promise<void>
  setCameraEnabled(enabled: boolean): Promise<void>
  subscribe(handler: (state: ImCallMediaState) => void): () => void
  close(): Promise<void>
}

export type ImCallMediaCreate = (call: UserChatCallResponseBody, selfName: string) => ImCallMedia

let factory: ImCallMediaCreate | undefined

export function registerImCallMedia(create: ImCallMediaCreate) {
  factory = create
}

export function createImCallMedia(call: UserChatCallResponseBody, selfName: string): ImCallMedia {
  if (!factory) {
    throw new Error('尚未注册通话媒体适配')
  }
  return factory(call, selfName)
}

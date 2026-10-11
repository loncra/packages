import {isEnumValue} from '@loncra/client/commons'
import {
  MESSAGE_SERVER_CHAT_CALL_SCENE,
  MESSAGE_SERVER_CHAT_CALL_TYPE,
  MESSAGE_SERVER_USER_CHAT_CALL_PARTICIPANT_STATUS,
  type UserChatCallResponseBody,
} from '@loncra/client/message'
import {
  type AudioCaptureOptions,
  ConnectionState,
  createLocalAudioTrack,
  createLocalVideoTrack,
  type LocalAudioTrack,
  type LocalVideoTrack,
  type RemoteTrack,
  Room,
  RoomEvent,
  Track,
  type VideoCaptureOptions,
} from 'livekit-client'
import type {ImCallMedia, ImCallMediaCreate, ImCallMediaRole, ImCallMediaState} from '../media.ts'

const PRIVATE_CAPTURE = {
  video: {
    width: {ideal: 1280, max: 1280},
    height: {ideal: 720, max: 720},
    frameRate: {ideal: 30, max: 30},
    facingMode: 'user',
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
}

const GROUP_CAPTURE = {
  video: {
    width: {ideal: 640, max: 1280},
    height: {ideal: 480, max: 720},
    frameRate: {ideal: 24, max: 30},
    facingMode: 'user',
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
}

function captureOf(call: UserChatCallResponseBody) {
  return isEnumValue(call.scene, MESSAGE_SERVER_CHAT_CALL_SCENE.PRIVATE) ? PRIVATE_CAPTURE : GROUP_CAPTURE
}

function metricsOf(width: number, height: number) {
  if (!width || !height) {
    return undefined
  }
  return {width, height, aspect: width / height}
}

export const createLiveKitCallMedia: ImCallMediaCreate = (call, selfName) => {
  const handlers = new Set<(state: ImCallMediaState) => void>()
  const elements: Partial<Record<ImCallMediaRole, HTMLVideoElement>> = {}
  const metricBound = new WeakSet<HTMLVideoElement>()
  let room: Room | undefined
  let audioTrack: LocalAudioTrack | undefined
  let videoTrack: LocalVideoTrack | undefined
  let remoteVideoTrack: RemoteTrack | undefined
  let previewed = false
  let remoteBound = false
  let published = false
  let closed = false
  const view: ImCallMediaState = {
    localMicrophone: true,
    localCamera: isEnumValue(call.type, MESSAGE_SERVER_CHAT_CALL_TYPE.VIDEO),
    remoteMicrophone: true,
    remoteCamera: true,
  }

  let publishedView: ImCallMediaState | undefined

  function sameMetrics(left: ImCallMediaState['localMetrics'], right: ImCallMediaState['localMetrics']) {
    return left?.width === right?.width && left?.height === right?.height && left?.aspect === right?.aspect
  }

  function emit() {
    if (
      publishedView
      && publishedView.localMicrophone === view.localMicrophone
      && publishedView.localCamera === view.localCamera
      && publishedView.remoteMicrophone === view.remoteMicrophone
      && publishedView.remoteCamera === view.remoteCamera
      && sameMetrics(publishedView.localMetrics, view.localMetrics)
      && sameMetrics(publishedView.remoteMetrics, view.remoteMetrics)
    ) {
      return
    }
    const next: ImCallMediaState = {
      ...view,
      localMetrics: view.localMetrics ? {...view.localMetrics} : undefined,
      remoteMetrics: view.remoteMetrics ? {...view.remoteMetrics} : undefined,
    }
    publishedView = next
    handlers.forEach((handler) => handler(next))
  }

  function bindMetrics(element: HTMLVideoElement, role: ImCallMediaRole) {
    if (metricBound.has(element)) {
      return
    }
    metricBound.add(element)
    const read = () => {
      const metrics = metricsOf(element.videoWidth, element.videoHeight)
      if (!metrics) {
        return
      }
      if (role === 'local') {
        view.localMetrics = metrics
      } else {
        view.remoteMetrics = metrics
      }
      emit()
    }
    element.addEventListener('loadedmetadata', read)
    read()
  }

  function applyTrackMetrics(track: LocalVideoTrack) {
    const settings = track.mediaStreamTrack?.getSettings()
    const metrics = metricsOf(settings?.width ?? 0, settings?.height ?? 0)
    if (!metrics) {
      return
    }
    view.localMetrics = metrics
    emit()
  }

  async function attachCurrent(role: ImCallMediaRole) {
    const element = elements[role]
    if (!element) {
      return
    }
    if (role === 'local' && videoTrack) {
      videoTrack.attach(element)
      bindMetrics(element, 'local')
      applyTrackMetrics(videoTrack)
      return
    }
    if (role === 'remote' && remoteVideoTrack) {
      remoteVideoTrack.attach(element)
      bindMetrics(element, 'remote')
    }
  }

  function ensureRoom() {
    if (!room) {
      room = new Room({adaptiveStream: true, dynacast: true})
    }
    return room
  }

  function bindRemote(current: Room) {
    if (remoteBound) {
      return
    }
    remoteBound = true
    const sync = (participant: {isLocal: boolean; isMicrophoneEnabled: boolean; isCameraEnabled: boolean}) => {
      if (participant.isLocal) {
        return
      }
      view.remoteMicrophone = participant.isMicrophoneEnabled
      view.remoteCamera = participant.isCameraEnabled
      emit()
    }
    current.on(RoomEvent.TrackMuted, (_publication, participant) => sync(participant))
    current.on(RoomEvent.TrackUnmuted, (_publication, participant) => sync(participant))
    current.on(RoomEvent.TrackPublished, (_publication, participant) => sync(participant))
    current.on(RoomEvent.TrackUnpublished, (_publication, participant) => sync(participant))
    current.on(RoomEvent.ParticipantConnected, (participant) => sync(participant))
  }

  async function publishBoth(current: Room) {
    if (published) {
      return
    }
    published = true
    current.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
      if (participant.isLocal) {
        return
      }
      if (track.kind === Track.Kind.Video) {
        remoteVideoTrack = track
        void attachCurrent('remote')
      } else if (track.kind === Track.Kind.Audio) {
        track.attach()
      }
      view.remoteMicrophone = participant.isMicrophoneEnabled
      view.remoteCamera = participant.isCameraEnabled
      emit()
    })

    if (videoTrack) {
      await current.localParticipant.publishTrack(videoTrack, {source: Track.Source.Camera})
    } else {
      await current.localParticipant.setCameraEnabled(false)
    }
    if (audioTrack) {
      await current.localParticipant.publishTrack(audioTrack, {source: Track.Source.Microphone})
    } else {
      await current.localParticipant.setMicrophoneEnabled(true)
    }
    const remote = Array.from(current.remoteParticipants.values())[0]
    if (remote) {
      view.remoteMicrophone = remote.isMicrophoneEnabled
      view.remoteCamera = remote.isCameraEnabled
      emit()
    }
  }

  const media: ImCallMedia = {
    async previewLocal(current) {
      if (closed || previewed) {
        return
      }
      previewed = true
      const videoCall = isEnumValue(current.type, MESSAGE_SERVER_CHAT_CALL_TYPE.VIDEO)
      view.localCamera = videoCall
      const capture = captureOf(current)
      audioTrack = await createLocalAudioTrack(capture.audio as AudioCaptureOptions)
      if (!videoCall) {
        emit()
        return
      }
      videoTrack = await createLocalVideoTrack(capture.video as VideoCaptureOptions)
      await attachCurrent('local')
      emit()
    },
    async confirmParticipant(current, participant) {
      if (closed || !isEnumValue(participant.status, MESSAGE_SERVER_USER_CHAT_CALL_PARTICIPANT_STATUS.ACTIVE)) {
        return
      }
      if (participant.principal === selfName) {
        const liveKit = participant.metadata?.liveKit
        if (!liveKit?.id || liveKit.value == null) {
          return
        }
        const currentRoom = ensureRoom()
        await currentRoom.connect(String(liveKit.id), String(liveKit.value))
        bindRemote(currentRoom)
      }
      const everyoneActive = (current.participants ?? []).every((item) =>
        isEnumValue(item.status, MESSAGE_SERVER_USER_CHAT_CALL_PARTICIPANT_STATUS.ACTIVE),
      )
      if (!everyoneActive || !room || room.state !== ConnectionState.Connected) {
        return
      }
      await publishBoth(room)
    },
    async attach(role, element) {
      elements[role] = element
      await attachCurrent(role)
    },
    async setMicrophoneEnabled(enabled) {
      view.localMicrophone = enabled
      if (audioTrack) {
        enabled ? await audioTrack.unmute() : await audioTrack.mute()
      } else if (room) {
        await room.localParticipant.setMicrophoneEnabled(enabled)
      }
      emit()
    },
    async setCameraEnabled(enabled) {
      view.localCamera = enabled
      if (enabled && !videoTrack) {
        videoTrack = await createLocalVideoTrack(captureOf(call).video as VideoCaptureOptions)
        await attachCurrent('local')
        if (room?.state === ConnectionState.Connected) {
          await room.localParticipant.publishTrack(videoTrack, {source: Track.Source.Camera})
        }
        emit()
        return
      }
      if (videoTrack) {
        enabled ? await videoTrack.unmute() : await videoTrack.mute()
        if (enabled) {
          await attachCurrent('local')
        }
      } else if (room) {
        await room.localParticipant.setCameraEnabled(enabled)
      }
      emit()
    },
    subscribe(handler) {
      handlers.add(handler)
      handler({...view})
      return () => handlers.delete(handler)
    },
    async close() {
      closed = true
      handlers.clear()
      audioTrack?.stop()
      videoTrack?.stop()
      audioTrack = undefined
      videoTrack = undefined
      remoteVideoTrack = undefined
      if (room) {
        room.removeAllListeners()
        await room.disconnect()
        room = undefined
      }
    },
  }

  return media
}

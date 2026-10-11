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
  let captureSettled = false
  let remoteBound = false
  let publishReady = false
  let published = false
  let closed = false
  const consumedRemote = new WeakSet<RemoteTrack>()
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

  function takeRemoteTrack(track: RemoteTrack, participant: {isLocal: boolean; isMicrophoneEnabled: boolean; isCameraEnabled: boolean}) {
    if (participant.isLocal || closed) {
      return
    }
    if (!consumedRemote.has(track)) {
      consumedRemote.add(track)
      if (track.kind === Track.Kind.Audio) {
        track.attach()
      }
    }
    if (track.kind === Track.Kind.Video) {
      remoteVideoTrack = track
      void attachCurrent('remote')
    }
    view.remoteMicrophone = participant.isMicrophoneEnabled
    view.remoteCamera = participant.isCameraEnabled
    emit()
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
    current.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
      takeRemoteTrack(track, participant)
    })
    current.on(RoomEvent.TrackMuted, (_publication, participant) => sync(participant))
    current.on(RoomEvent.TrackUnmuted, (_publication, participant) => sync(participant))
    current.on(RoomEvent.TrackPublished, (_publication, participant) => sync(participant))
    current.on(RoomEvent.TrackUnpublished, (_publication, participant) => sync(participant))
    current.on(RoomEvent.ParticipantConnected, (participant) => sync(participant))
  }

  function adoptExistingRemoteTracks(current: Room) {
    current.remoteParticipants.forEach((participant) => {
      participant.trackPublications.forEach((publication) => {
        if (publication.track) {
          takeRemoteTrack(publication.track, participant)
        }
      })
    })
  }

  // 采集没结束就先不发。结束之后缺哪一路，就明确关掉哪一路，对方不会一直当成开着。
  async function publishBoth(current: Room) {
    if (published || closed || !captureSettled) {
      return
    }
    published = true
    if (videoTrack) {
      await current.localParticipant.publishTrack(videoTrack, {source: Track.Source.Camera})
    } else {
      view.localCamera = false
      await current.localParticipant.setCameraEnabled(false)
    }
    if (audioTrack) {
      await current.localParticipant.publishTrack(audioTrack, {source: Track.Source.Microphone})
    } else {
      view.localMicrophone = false
      await current.localParticipant.setMicrophoneEnabled(false)
    }
    emit()
    adoptExistingRemoteTracks(current)
  }

  const media: ImCallMedia = {
    // 麦克风和摄像头共用一次授权。无痕模式第一次会停在授权框，进房可以先发生。
    // 授权成功就发布；拒绝或没有设备则关掉对应开关，通话继续。两路互不影响。
    async previewLocal(current) {
      if (closed || previewed) {
        return
      }
      previewed = true
      const videoCall = isEnumValue(current.type, MESSAGE_SERVER_CHAT_CALL_TYPE.VIDEO)
      view.localCamera = videoCall
      const capture = captureOf(current)
      try {
        audioTrack = await createLocalAudioTrack(capture.audio as AudioCaptureOptions)
      } catch {
        view.localMicrophone = false
      }
      if (videoCall) {
        try {
          videoTrack = await createLocalVideoTrack(capture.video as VideoCaptureOptions)
          await attachCurrent('local')
        } catch {
          view.localCamera = false
        }
      }
      captureSettled = true
      emit()
      if (publishReady && room?.state === ConnectionState.Connected) {
        await publishBoth(room)
      }
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
        // 先监听再连接。对方要是已经发布，connect 期间就会订阅，漏掉这次就没有画面和声音。
        bindRemote(currentRoom)
        await currentRoom.connect(String(liveKit.id), String(liveKit.value))
        adoptExistingRemoteTracks(currentRoom)
      }
      const everyoneActive = (current.participants ?? []).every((item) =>
        isEnumValue(item.status, MESSAGE_SERVER_USER_CHAT_CALL_PARTICIPANT_STATUS.ACTIVE),
      )
      if (!everyoneActive || !room || room.state !== ConnectionState.Connected) {
        return
      }
      publishReady = true
      await publishBoth(room)
    },
    async attach(role, element) {
      elements[role] = element
      await attachCurrent(role)
    },
    // 拒绝之后再点开，会重新向浏览器要授权。再次拒绝就把开关拨回去。
    async setMicrophoneEnabled(enabled) {
      if (!enabled) {
        view.localMicrophone = false
        if (audioTrack) {
          await audioTrack.mute()
        } else if (room?.state === ConnectionState.Connected) {
          await room.localParticipant.setMicrophoneEnabled(false)
        }
        emit()
        return
      }
      try {
        if (!audioTrack) {
          audioTrack = await createLocalAudioTrack(captureOf(call).audio as AudioCaptureOptions)
        }
        await audioTrack.unmute()
        if (room?.state === ConnectionState.Connected && !room.localParticipant.getTrackPublication(Track.Source.Microphone)) {
          await room.localParticipant.publishTrack(audioTrack, {source: Track.Source.Microphone})
        }
        view.localMicrophone = true
      } catch {
        view.localMicrophone = false
      }
      emit()
    },
    async setCameraEnabled(enabled) {
      if (!enabled) {
        view.localCamera = false
        if (videoTrack) {
          await videoTrack.mute()
        } else if (room?.state === ConnectionState.Connected) {
          await room.localParticipant.setCameraEnabled(false)
        }
        emit()
        return
      }
      try {
        if (!videoTrack) {
          videoTrack = await createLocalVideoTrack(captureOf(call).video as VideoCaptureOptions)
        }
        await videoTrack.unmute()
        await attachCurrent('local')
        if (room?.state === ConnectionState.Connected && !room.localParticipant.getTrackPublication(Track.Source.Camera)) {
          await room.localParticipant.publishTrack(videoTrack, {source: Track.Source.Camera})
        }
        view.localCamera = true
      } catch {
        view.localCamera = false
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

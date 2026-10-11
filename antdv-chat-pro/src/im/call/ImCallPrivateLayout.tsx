import {computed, defineComponent, nextTick, onMounted, onUnmounted, ref, watch, type CSSProperties} from 'vue'
import {Badge, Button, Flex, Statistic} from 'antdv-next'
import {BlockOutlined, SplitCellsOutlined} from '@antdv-next/icons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import useApp from 'antdv-next/dist/app/useApp'
import {UserAvatar} from '@loncra/antdv-pro'
import {classNames, fillLocale} from '@loncra/antdv'
import {getEnumName, isEnumValue, type NameValueEnumMetadata} from '@loncra/client/commons'
import {
  MESSAGE_SERVER_CHAT_CALL_TYPE,
  MESSAGE_SERVER_USER_CHAT_CALL_PARTICIPANT_STATUS,
  MESSAGE_SERVER_USER_CHAT_CALL_STATUS,
  USER_CHAT_CALL_PARTICIPANT_ERROR_STATUS_VALUE,
  USER_CHAT_CALL_PARTICIPANT_PROCESSING_STATUS_VALUE,
  type UserChatCallParticipantEntity,
} from '@loncra/client/message'
import {useLocale} from '../../_util/useLocale.ts'
import {useImChatCall} from './useImChatCall.ts'
import {
  CALL_MINI_SIZE,
  CALL_SPLIT,
  type CallSplit,
  computePrivateCallLayout,
  DEFAULT_VIDEO_METRICS,
  layoutConstraints,
} from './layout.ts'
import useStyle, {IM_CALL_PREFIX} from './style/index.ts'

type Role = 'local' | 'remote'
type BadgeStatus = 'success' | 'processing' | 'default' | 'error' | 'warning'

function statusValue(status: NameValueEnumMetadata<number> | number): number {
  return typeof status === 'number' ? status : status.value
}

function participantBadge(status: NameValueEnumMetadata<number> | number): BadgeStatus {
  const value = statusValue(status)
  if (USER_CHAT_CALL_PARTICIPANT_ERROR_STATUS_VALUE.includes(value)) {
    return 'error'
  }
  if (USER_CHAT_CALL_PARTICIPANT_PROCESSING_STATUS_VALUE.includes(value)) {
    return 'processing'
  }
  if (value === MESSAGE_SERVER_USER_CHAT_CALL_PARTICIPANT_STATUS.ACTIVE) {
    return 'success'
  }
  if (value === MESSAGE_SERVER_USER_CHAT_CALL_PARTICIPANT_STATUS.NO_ANSWER) {
    return 'default'
  }
  return 'warning'
}

const ImCallPrivateLayout = defineComponent({
  name: 'LImCallPrivateLayout',
  setup() {
    const session = useImChatCall()
    const locale = useLocale('ImCall')
    const {message} = useApp()
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('im-call', IM_CALL_PREFIX))
    const [hashId, cssVarCls] = useStyle(prefixCls)
    const localRef = ref<HTMLVideoElement>()
    const remoteRef = ref<HTMLVideoElement>()
    const split = ref<CallSplit>(CALL_SPLIT.DEFAULT)
    const targetFull = ref(true)
    const snapshot = ref<{split: CallSplit; targetFull: boolean} | null>(null)
    const tick = ref(0)

    const rootClass = computed(() => classNames(prefixCls.value, hashId.value, cssVarCls.value))
    const minimized = computed(() => session.state.minimized)
    const fullscreen = computed(() => session.state.fullscreen)
    const leftRight = computed(() => split.value === CALL_SPLIT.LEFT_RIGHT)
    const metrics = computed(() => ({
      local: session.state.mediaState.localMetrics ?? DEFAULT_VIDEO_METRICS,
      remote: session.state.mediaState.remoteMetrics ?? session.state.mediaState.localMetrics ?? DEFAULT_VIDEO_METRICS,
    }))
    const spec = computed(() => {
      void tick.value
      return computePrivateCallLayout(
        split.value,
        metrics.value,
        layoutConstraints(fullscreen.value),
        targetFull.value,
      )
    })

    const remote = computed(() =>
      session.state.call?.participants.find((item) => item.principal !== session.host.selfName),
    )
    const localDetails = computed(() =>
      session.state.call?.participants.find((item) => item.principal === session.host.selfName)?.metadata?.details,
    )
    const remoteActive = computed(() =>
      remote.value ? isEnumValue(remote.value.status, MESSAGE_SERVER_USER_CHAT_CALL_PARTICIPANT_STATUS.ACTIVE) : false,
    )

    function showVideo(role: Role) {
      if (role === 'local') {
        return session.state.mediaState.localCamera
      }
      return remoteActive.value && session.state.mediaState.remoteCamera
    }

    function pipRole(role: Role) {
      if (leftRight.value) {
        return false
      }
      return role === 'local' ? targetFull.value : !targetFull.value
    }

    function shellClass(role: Role) {
      const prefix = prefixCls.value
      if (minimized.value) {
        return `${prefix}-fill`
      }
      if (fullscreen.value && leftRight.value) {
        return `${prefix}-split`
      }
      if (fullscreen.value && pipRole(role)) {
        return `${prefix}-pip`
      }
      if (fullscreen.value) {
        return `${prefix}-fill`
      }
      if (leftRight.value) {
        return `${prefix}-shrink`
      }
      if (pipRole(role)) {
        return `${prefix}-pip`
      }
      return `${prefix}-fill`
    }

    function shellStyle(role: Role) {
      if (minimized.value) {
        return role === 'local' ? {display: 'none'} : {width: '100%', height: '100%'}
      }
      if (fullscreen.value) {
        if (leftRight.value) {
          return {flex: '1 1 0', width: '0', height: '100%'}
        }
        if (pipRole(role)) {
          return role === 'local' ? spec.value.local : spec.value.remote
        }
        return {width: '100%', height: '100%'}
      }
      if (leftRight.value) {
        const panel = role === 'local' ? spec.value.local : spec.value.remote
        return {width: panel.width, height: '100%'}
      }
      if (pipRole(role)) {
        return role === 'local' ? spec.value.local : spec.value.remote
      }
      return {width: '100%', height: `${spec.value.modalHeight}px`}
    }

    function videoClass(role: Role) {
      const prefix = prefixCls.value
      const cover = minimized.value || (fullscreen.value && !pipRole(role) && !leftRight.value) || (fullscreen.value && leftRight.value)
      return classNames(`${prefix}-video`, cover ? `${prefix}-video-cover` : `${prefix}-video-contain`)
    }

    async function attachAll() {
      await nextTick()
      if (localRef.value) {
        await session.media?.attach('local', localRef.value)
      }
      if (remoteRef.value) {
        await session.media?.attach('remote', remoteRef.value)
      }
    }

    function swapWindow() {
      if (leftRight.value) {
        return
      }
      targetFull.value = !targetFull.value
    }

    function onRemoteClick() {
      if (minimized.value || targetFull.value) {
        return
      }
      swapWindow()
    }

    function onLocalClick() {
      if (minimized.value || !targetFull.value) {
        return
      }
      swapWindow()
    }

    function renderFace(role: Role, participant?: UserChatCallParticipantEntity) {
      const prefix = prefixCls.value
      const details = role === 'local' ? localDetails.value : participant?.metadata?.details
      return (
        <div
          class={classNames(shellClass(role), `${prefix}-placeholder`)}
          style={shellStyle(role) as CSSProperties}
          onClick={role === 'local' ? onLocalClick : onRemoteClick}
        >
          <Flex vertical justify="center" align="center" gap="small">
            {details ? <UserAvatar user={details} {...({size: 64} as Record<string, unknown>)} /> : null}
            {participant
              ? <Badge status={participantBadge(participant.status)} text={getEnumName(participant.status)} />
              : null}
            {participant?.reconnectTime
              ? (
                <Statistic.Timer
                  class={`${prefix}-timer`}
                  value={participant.reconnectTime}
                  type="countdown"
                  format={locale.value.reconnectTimeCountdown}
                  onFinish={() => void session.hangUp()}
                />
              )
              : null}
          </Flex>
        </div>
      )
    }

    function renderVideo(role: Role) {
      return (
        <video
          ref={role === 'local' ? localRef : remoteRef}
          class={classNames(shellClass(role), videoClass(role))}
          style={shellStyle(role) as CSSProperties}
          autoplay
          playsinline
          muted
          onClick={role === 'local' ? onLocalClick : onRemoteClick}
        />
      )
    }

    function renderPanel(role: Role, participant?: UserChatCallParticipantEntity) {
      if (role === 'local' && minimized.value) {
        return null
      }
      if (!showVideo(role)) {
        return renderFace(role, participant)
      }
      return renderVideo(role)
    }

    watch(spec, (next) => {
      if (session.state.width === next.modalWidth && session.state.height === next.modalHeight) {
        return
      }
      session.setFrame(next.modalWidth, next.modalHeight)
    }, {flush: 'post'})

    watch(localRef, (element) => {
      if (element) {
        void session.media?.attach('local', element)
      }
    })

    watch(remoteRef, (element) => {
      if (element) {
        void session.media?.attach('remote', element)
      }
    })

    watch(() => session.state.minimized, async (next) => {
      if (next) {
        snapshot.value = {split: split.value, targetFull: targetFull.value}
        targetFull.value = true
      } else if (snapshot.value) {
        split.value = snapshot.value.split
        targetFull.value = snapshot.value.targetFull
        snapshot.value = null
      }
      await attachAll()
    })

    function onResize() {
      tick.value += 1
    }

    onMounted(() => {
      window.addEventListener('resize', onResize)
      const call = session.state.call
      if (!call) {
        return
      }
      const peer = remote.value
      if (peer) {
        const name = session.host.principalName(peer.metadata?.details) || locale.value.unnamed
        const template = isEnumValue(call.type, MESSAGE_SERVER_CHAT_CALL_TYPE.VIDEO)
          ? locale.value.videoTitle
          : locale.value.voiceTitle
        session.state.title = fillLocale(template, {user: name})
      } else {
        session.state.title = locale.value.unnamed
      }
      void session.media?.previewLocal(call).then(() => {
        session.setFrame(spec.value.modalWidth, spec.value.modalHeight)
        const mediaState = session.state.mediaState
        const videoCall = isEnumValue(call.type, MESSAGE_SERVER_CHAT_CALL_TYPE.VIDEO)
        const denied = videoCall
          ? !mediaState.localMicrophone || !mediaState.localCamera
          : !mediaState.localMicrophone
        if (denied) {
          message.error(locale.value.captureDenied)
        }
      })
    })

    onUnmounted(() => {
      window.removeEventListener('resize', onResize)
    })

    return () => {
      const prefix = prefixCls.value
      const completed = isEnumValue(session.state.call?.status, MESSAGE_SERVER_USER_CHAT_CALL_STATUS.COMPLETED)
      const stageClass = classNames(
        `${prefix}-stage`,
        minimized.value ? `${prefix}-stage-mini` : fullscreen.value ? `${prefix}-stage-full` : `${prefix}-stage-window`,
        rootClass.value,
      )
      const contentStyle = minimized.value
        ? {width: '100%', height: `${CALL_MINI_SIZE.HEIGHT}px`}
        : fullscreen.value
          ? {width: '100%', height: '100%'}
          : {width: '100%', height: `${spec.value.modalHeight}px`}
      const panels = (
        <>
          {renderPanel('local')}
          {remote.value ? renderPanel('remote', remote.value) : null}
        </>
      )
      return (
        <div class={stageClass}>
          {leftRight.value && !minimized.value
            ? <Flex class={`${prefix}-row`} style={contentStyle} align="stretch">{panels}</Flex>
            : <div class={stageClass} style={contentStyle}>{panels}</div>}
          {!minimized.value && !completed
            ? (
              <Button
                class={`${prefix}-split-toggle`}
                variant="outlined"
                onClick={(event: MouseEvent) => {
                  event.stopPropagation()
                  split.value = leftRight.value ? CALL_SPLIT.DEFAULT : CALL_SPLIT.LEFT_RIGHT
                }}
                v-slots={{
                  icon: () => leftRight.value ? <BlockOutlined /> : <SplitCellsOutlined />,
                }}
              />
            )
            : null}
        </div>
      )
    }
  },
})

export default ImCallPrivateLayout

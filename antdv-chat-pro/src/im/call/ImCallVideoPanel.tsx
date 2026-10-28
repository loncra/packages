import {computed, defineComponent, type PropType, ref, watch} from 'vue'
import {Badge, Flex, Statistic} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {UserAvatar} from '@loncra/antdv-pro'
import {classNames} from '@loncra/antdv'
import {getEnumName, isEnumValue} from '@loncra/client/commons'
import {
    MESSAGE_SERVER_USER_CHAT_CALL_PARTICIPANT_STATUS,
    type UserChatCallParticipantEntity,
} from '@loncra/client/message'
import {useLocale} from '../../_util/useLocale.ts'
import {callParticipantBadgeStatus} from './callBadge.ts'
import {useImChatCall} from './useImChatCall.ts'
import {
    callShellClass,
    callShellVariant,
    callShellStyle,
    videoCover,
    type CallLayoutSpec,
    type CallRole,
} from './layout.ts'

const ImCallVideoPanel = defineComponent({
  name: 'LImCallVideoPanel',
  props: {
    role: {type: String as PropType<CallRole>, required: true},
    participant: {type: Object as PropType<UserChatCallParticipantEntity>, default: undefined},
    minimized: {type: Boolean, default: false},
    fullscreen: {type: Boolean, default: false},
    leftRight: {type: Boolean, default: false},
    targetFull: {type: Boolean, default: true},
    spec: {type: Object as PropType<CallLayoutSpec>, required: true},
    prefixCls: String,
    hashId: String,
    cssVarCls: String,
  },
  emits: {
    swap: () => true,
  },
  setup(props, {emit}) {
    const session = useImChatCall()
    const locale = useLocale('ImCall')
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('im-call', props.prefixCls))
    const videoRef = ref<HTMLVideoElement>()

    const remoteActive = computed(() =>
      props.participant
        ? isEnumValue(props.participant.status, MESSAGE_SERVER_USER_CHAT_CALL_PARTICIPANT_STATUS.ACTIVE)
        : false,
    )

    const shellState = computed(() => ({
      minimized: props.minimized,
      fullscreen: props.fullscreen,
      leftRight: props.leftRight,
      targetFull: props.targetFull,
      spec: props.spec,
    }))

    function showVideo(): boolean {
      if (props.role === 'local') {
        return session.state.mediaState.localCamera
      }
      return remoteActive.value && session.state.mediaState.remoteCamera
    }

    function shellClass(): string {
      return classNames(
        callShellClass(prefixCls.value, callShellVariant(props.role, shellState.value)),
        props.hashId,
        props.cssVarCls,
      )
    }

    function shellStyle() {
      return callShellStyle(props.role, shellState.value)
    }

    function videoClass(): string {
      const cover = videoCover(props.role, shellState.value)
      return classNames(
        `${prefixCls.value}-video`,
        cover ? `${prefixCls.value}-video-cover` : `${prefixCls.value}-video-contain`,
        props.hashId,
        props.cssVarCls,
      )
    }

    function onClick(): void {
      if (props.minimized) {
        return
      }
      const full = props.role === 'local' ? props.targetFull : !props.targetFull
      if (!full) {
        return
      }
      emit('swap')
    }

    watch(videoRef, (element) => {
      if (element) {
        void session.media?.attach(props.role, element)
      }
    })

    return () => {
      const prefix = prefixCls.value
      const details = props.role === 'local'
        ? session.state.call?.participants.find((item) => item.principal === session.host.self.systemName)?.metadata?.details
        : props.participant?.metadata?.details
      if (props.role === 'local' && props.minimized) {
        return null
      }
      const media = showVideo()
      const face = (
        <Flex vertical justify="center" align="center" gap="small">
          {details ? <UserAvatar user={details} {...({size: 64} as Record<string, unknown>)} /> : null}
          {props.participant
            ? <Badge status={callParticipantBadgeStatus(props.participant.status)} text={getEnumName(props.participant.status)} />
            : null}
          {props.participant?.reconnectTime
            ? (
              <Statistic.Timer
                class={`${prefix}-timer`}
                value={props.participant.reconnectTime}
                type="countdown"
                format={locale.value.reconnectTimeCountdown}
                onFinish={() => void session.hangUp()}
              />
            )
            : null}
        </Flex>
      )
      if (!media) {
        return (
          <div class={classNames(shellClass(), `${prefix}-placeholder`)} style={shellStyle()} onClick={onClick}>
            {face}
          </div>
        )
      }
      return (
        <video
          ref={videoRef}
          class={classNames(shellClass(), videoClass())}
          style={shellStyle()}
          autoplay
          playsinline
          muted
          onClick={onClick}
        />
      )
    }
  },
})

export default ImCallVideoPanel

import {computed, defineComponent, nextTick, onMounted, onUnmounted, ref, watch} from 'vue'
import {Button, Flex} from 'antdv-next'
import {BlockOutlined, SplitCellsOutlined} from '@antdv-next/icons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import useApp from 'antdv-next/dist/app/useApp'
import {classNames, fillLocale} from '@loncra/antdv'
import {isEnumValue} from '@loncra/client/commons'
import {AuthServerService} from '@loncra/client/auth'
import {
    MESSAGE_SERVER_CHAT_CALL_TYPE,
    MESSAGE_SERVER_USER_CHAT_CALL_STATUS,
} from '@loncra/client/message'
import {useLocale} from '../../_util/useLocale.ts'
import {useImChatCall} from './useImChatCall.ts'
import {
    CALL_SPLIT,
    type CallSplit,
    computePrivateCallLayout,
    DEFAULT_VIDEO_METRICS,
    layoutConstraints,
} from './layout.ts'
import ImCallVideoPanel from './ImCallVideoPanel.tsx'
import useStyle, {IM_CALL_PREFIX} from './style/index.ts'

const ImCallPrivateLayout = defineComponent({
  name: 'LImCallPrivateLayout',
  setup() {
    const session = useImChatCall()
    const locale = useLocale('ImCall')
    const {message} = useApp()
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('im-call', IM_CALL_PREFIX))
    const [hashId, cssVarCls] = useStyle(prefixCls)
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
      session.state.call?.participants.find((item) => item.principal !== session.host.self.systemName),
    )

    function swapWindow() {
      if (leftRight.value) {
        return
      }
      targetFull.value = !targetFull.value
    }

    watch(spec, (next) => {
      if (session.state.width === next.modalWidth && session.state.height === next.modalHeight) {
        return
      }
      session.setFrame(next.modalWidth, next.modalHeight)
    }, {flush: 'post'})

    watch(() => session.state.minimized, async (next) => {
      if (next) {
        snapshot.value = {split: split.value, targetFull: targetFull.value}
        targetFull.value = true
      } else if (snapshot.value) {
        split.value = snapshot.value.split
        targetFull.value = snapshot.value.targetFull
        snapshot.value = null
      }
      await nextTick()
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
        const name = AuthServerService.getPrincipalNameByUserDetails(peer.metadata?.details) || locale.value.unnamed
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
      const panels = (
        <>
          <ImCallVideoPanel
            role="local"
            minimized={minimized.value}
            fullscreen={fullscreen.value}
            leftRight={leftRight.value}
            targetFull={targetFull.value}
            spec={spec.value}
            prefixCls={prefixCls.value}
            hashId={hashId.value}
            cssVarCls={cssVarCls.value}
            onSwap={swapWindow}
          />
          {remote.value
            ? (
              <ImCallVideoPanel
                role="remote"
                participant={remote.value}
                minimized={minimized.value}
                fullscreen={fullscreen.value}
                leftRight={leftRight.value}
                targetFull={targetFull.value}
                spec={spec.value}
                prefixCls={prefixCls.value}
                hashId={hashId.value}
                cssVarCls={cssVarCls.value}
                onSwap={swapWindow}
              />
            )
            : null}
        </>
      )
      return (
        <div class={stageClass}>
          {leftRight.value
            ? <Flex class={`${prefix}-row`} align="stretch">{panels}</Flex>
            : <div class={`${prefix}-stack`}>{panels}</div>}
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

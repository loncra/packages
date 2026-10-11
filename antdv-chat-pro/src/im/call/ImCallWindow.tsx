import {computed, defineComponent, onMounted, onUnmounted, ref} from 'vue'
import {Button, Flex, Modal, Space, SpaceCompact, Statistic, Typography} from 'antdv-next'
import {
  AudioMutedOutlined,
  AudioOutlined,
  BlockOutlined,
  CloseOutlined,
  CompressOutlined,
  ExpandOutlined,
  EyeInvisibleOutlined,
  PoweroffOutlined,
  VideoCameraOutlined,
} from '@antdv-next/icons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '@loncra/antdv'
import {getEnumName, isEnumValue} from '@loncra/client/commons'
import {
  MESSAGE_SERVER_CHAT_CALL_SCENE,
  MESSAGE_SERVER_CHAT_CALL_TYPE,
  MESSAGE_SERVER_USER_CHAT_CALL_STATUS,
} from '@loncra/client/message'
import {useLocale} from '../../_util/useLocale.ts'
import {CALL_MINI_SIZE} from './layout.ts'
import ImCallPrivateLayout from './ImCallPrivateLayout.tsx'
import {useImChatCall} from './useImChatCall.ts'
import useStyle, {IM_CALL_PREFIX} from './style/index.ts'

const DURATION_FORMAT = 'HH:mm:ss'

const ImCallWindow = defineComponent({
  name: 'LImCallWindow',
  setup() {
    const session = useImChatCall()
    const locale = useLocale('ImCall')
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('im-call', IM_CALL_PREFIX))
    const [hashId, cssVarCls] = useStyle(prefixCls)
    const viewportRef = ref<HTMLDivElement>()

    function viewportFullscreen() {
      return document.fullscreenElement === viewportRef.value
    }

    async function toggleFullscreen() {
      const element = viewportRef.value
      if (!element) {
        return
      }
      try {
        if (!viewportFullscreen()) {
          await element.requestFullscreen()
        } else {
          await document.exitFullscreen()
        }
      } catch (error) {
        console.error(error)
      }
    }

    function onFullscreenChange() {
      session.setFullscreen(viewportFullscreen())
    }

    onMounted(() => document.addEventListener('fullscreenchange', onFullscreenChange))
    onUnmounted(() => document.removeEventListener('fullscreenchange', onFullscreenChange))

    return () => {
      const call = session.state.call
      if (!call || !session.state.open) {
        return null
      }
      const prefix = prefixCls.value
      const minimized = session.state.minimized
      const expanded = !minimized
      const completed = isEnumValue(call.status, MESSAGE_SERVER_USER_CHAT_CALL_STATUS.COMPLETED)
      const TypeIcon = isEnumValue(call.type, MESSAGE_SERVER_CHAT_CALL_TYPE.VIDEO)
        ? VideoCameraOutlined
        : AudioOutlined
      const width = minimized ? CALL_MINI_SIZE.WIDTH : session.state.width
      const viewportStyle = session.state.fullscreen
        ? undefined
        : minimized
          ? {height: `${CALL_MINI_SIZE.HEIGHT}px`}
          : session.state.height
            ? {height: `${session.state.height}px`}
            : undefined
      return (
        <Modal
          open
          closable={false}
          destroyOnHidden={false}
          centered={expanded}
          keyboard={false}
          mask={expanded}
          maskClosable={false}
          width={width}
          footer={null}
          wrapClassName={classNames(prefix, hashId.value, cssVarCls.value, minimized && `${prefix}-minimized`)}
          onCancel={() => void session.hangUp()}
          v-slots={{
            title: expanded
              ? () => (
                <Flex justify="space-between" align="center">
                  <Space>
                    <TypeIcon />
                    <Typography.Text>{session.state.title}</Typography.Text>
                  </Space>
                  <span class={`${prefix}-status`}>
                    ({getEnumName(call.status)})
                    {isEnumValue(call.status, MESSAGE_SERVER_USER_CHAT_CALL_STATUS.ACTIVE)
                      ? (
                        <Statistic.Timer
                          value={call.startTime}
                          format={DURATION_FORMAT}
                          type="countup"
                        />
                      )
                      : null}
                  </span>
                  <SpaceCompact class={`${prefix}-actions`}>
                    <Button size="small" onClick={() => void toggleFullscreen()} v-slots={{
                      icon: () => session.state.fullscreen ? <CompressOutlined /> : <ExpandOutlined />,
                    }} />
                    <Button size="small" onClick={() => void session.setMinimized(true)} v-slots={{
                      icon: () => <BlockOutlined />,
                    }} />
                    <Button
                      size="small"
                      danger
                      type="primary"
                      loading={session.state.loading}
                      onClick={() => void session.hangUp()}
                      v-slots={{icon: () => <CloseOutlined />}}
                    />
                  </SpaceCompact>
                </Flex>
              )
              : undefined,
          }}
        >
          <div
            ref={viewportRef}
            class={classNames(
              `${prefix}-viewport`,
              minimized ? `${prefix}-viewport-mini` : `${prefix}-viewport-expanded`,
              (session.state.fullscreen || (!session.state.height && expanded)) && `${prefix}-viewport-fill`,
            )}
            style={viewportStyle}
            onClick={() => {
              if (minimized) {
                void session.setMinimized(false)
              }
            }}
          >
            {isEnumValue(call.scene, MESSAGE_SERVER_CHAT_CALL_SCENE.PRIVATE) ? <ImCallPrivateLayout /> : null}
            {!completed && expanded
              ? (
                <div
                  class={`${prefix}-toolbar`}
                  onClick={(event: MouseEvent) => event.stopPropagation()}
                >
                  <SpaceCompact>
                    <Button
                      class={`${prefix}-tool`}
                      variant="outlined"
                      onClick={() => void session.media?.setMicrophoneEnabled(!session.state.mediaState.localMicrophone)}
                      v-slots={{
                        icon: () => session.state.mediaState.localMicrophone ? <AudioOutlined /> : <AudioMutedOutlined />,
                      }}
                    />
                    <Button
                      class={`${prefix}-tool`}
                      variant="outlined"
                      onClick={() => void session.media?.setCameraEnabled(!session.state.mediaState.localCamera)}
                      v-slots={{
                        icon: () => session.state.mediaState.localCamera ? <VideoCameraOutlined /> : <EyeInvisibleOutlined />,
                      }}
                    />
                  </SpaceCompact>
                  <Button
                    class={`${prefix}-hangup`}
                    shape="circle"
                    type="primary"
                    danger
                    loading={session.state.loading}
                    onClick={() => void session.hangUp()}
                    v-slots={{icon: () => <PoweroffOutlined />}}
                  />
                </div>
              )
              : null}
            {session.state.closeDeadline && expanded
              ? (
                <Flex class={`${prefix}-countdown`} justify="center" align="center" gap="small">
                  <Statistic.Timer
                    class={`${prefix}-timer`}
                    value={session.state.closeDeadline}
                    type="countdown"
                    format={locale.value.closeCountdown}
                    onFinish={() => void session.hangUp()}
                  />
                </Flex>
              )
              : null}
          </div>
        </Modal>
      )
    }
  },
})

export default ImCallWindow

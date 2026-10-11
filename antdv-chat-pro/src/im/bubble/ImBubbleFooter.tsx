import {computed, defineComponent, onMounted, onUnmounted, type PropType, ref} from 'vue'
import {Button, Space, Tooltip} from 'antdv-next'
import {MessageOutlined, UndoOutlined} from '@antdv-next/icons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import useApp from 'antdv-next/dist/app/useApp'
import {classNames, fillLocale} from '@loncra/antdv'
import {isEnumValue, type NameValueEnumMetadata, YES_OR_NO_TYPE} from '@loncra/client/commons'
import {ChatMessageService} from '@loncra/client/message'
import {useLocale} from '../../_util/useLocale.ts'
import useStyle, {IM_BUBBLE_PREFIX} from './style/index.ts'

const ImBubbleFooter = defineComponent({
  name: 'LImBubbleFooter',
  props: {
    undo: {
      type: [Number, Object] as PropType<number | NameValueEnumMetadata<number>>,
      default: undefined,
    },
    role: {type: String, required: true},
    undoableTime: {type: Number, default: undefined},
    messageId: {type: Number, required: true},
    onReference: {type: Function as PropType<() => void>, required: true},
  },
  setup(props, {slots}) {
    const locale = useLocale('ImBubble')
    const {modal, message} = useApp()
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('im-bubble', IM_BUBBLE_PREFIX))
    const [hashId, cssVarCls] = useStyle(prefixCls)
    const left = ref(0)

    const showReference = computed(() => isEnumValue(props.undo, YES_OR_NO_TYPE.NO))
    const showUndo = computed(() =>
      showReference.value
      && props.role === 'user'
      && props.undoableTime != null
      && left.value > 0,
    )

    function refreshLeft() {
      const until = props.undoableTime
      left.value = until == null ? 0 : Math.max(0, until - Date.now())
    }

    onMounted(() => {
      refreshLeft()
      const timer = window.setInterval(refreshLeft, 200)
      onUnmounted(() => window.clearInterval(timer))
    })

    async function undo() {
      try {
        const result = await ChatMessageService.undoMessage([props.messageId])
        message.success(result.message)
      } catch (error) {
        message.error(error instanceof Error ? error.message : String(error))
        throw error
      }
    }

    function confirmUndo() {
      modal.confirm({
        title: locale.value.undoConfirmTitle,
        content: locale.value.undoConfirmContent,
        onOk: () => undo(),
      })
    }

    return () => {
      const leading = slots.default?.()
      if (!showReference.value && !leading) {
        return null
      }
      return (
        <span class={classNames(prefixCls.value, hashId.value, cssVarCls.value)}>
          <Space class={`${prefixCls.value}-footer`}>
            {leading}
            {showReference.value
              ? (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => props.onReference()}
                  v-slots={{icon: () => <MessageOutlined />}}
                >
                  {locale.value.reference}
                </Button>
              )
              : null}
            {showUndo.value
              ? (
                <Tooltip title={fillLocale(locale.value.undoCountdown, {seconds: Math.ceil(left.value / 1000)})}>
                  <Button
                    size="small"
                    danger
                    variant="outlined"
                    onClick={confirmUndo}
                    v-slots={{icon: () => <UndoOutlined />}}
                  >
                    {locale.value.undo}
                  </Button>
                </Tooltip>
              )
              : null}
          </Space>
        </span>
      )
    }
  },
})

export default ImBubbleFooter

import type {PropType, SlotsType} from 'vue'
import {computed, defineComponent, ref, watch} from 'vue'
import {Button, Statistic} from 'antdv-next'
import {SendOutlined} from '@antdv-next/icons'
import {classNames} from '@loncra/antdv'
import type {CaptchaTokenType} from '@loncra/client/commons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {useCaptchaSend} from './useCaptchaSend.ts'
import type {BehaviorVerifier, CaptchaSendButtonClasses, CaptchaSendButtonStyles, CaptchaSendResult} from './types.ts'
import useStyle, {CAPTCHA_SEND_BUTTON_PREFIX} from './style/index.ts'

const CaptchaSendButton = defineComponent({
  name: 'LCaptchaSendButton',
  inheritAttrs: false,
  props: {
    captchaType: {type: String as PropType<CaptchaTokenType>, required: true},
    append: {type: Object as PropType<Record<string, unknown>>, default: undefined},
    beforeSend: {type: Function as PropType<() => Promise<boolean> | boolean>, default: undefined},
    verifier: {type: Object as PropType<BehaviorVerifier>, default: undefined},
    disabled: {type: Boolean, default: false},
    countdownFormat: {type: String, required: true},
    classes: {type: Object as PropType<CaptchaSendButtonClasses>, default: undefined},
    styles: {type: Object as PropType<CaptchaSendButtonStyles>, default: undefined},
    prefixCls: String,
    rootClass: String,
  },
  emits: {
    sent: (_result: CaptchaSendResult) => true,
    canceled: () => true,
    failed: (_error: unknown) => true,
  },
  slots: Object as SlotsType<{
    default?: () => unknown
    icon?: () => unknown
  }>,
  setup(props, {emit, slots, expose, attrs}) {
    const {send} = useCaptchaSend({verifier: props.verifier})
    const sending = ref(false)
    const cooling = ref(false)
    const lastResult = ref<CaptchaSendResult>()
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('captcha-send-button', props.prefixCls ?? CAPTCHA_SEND_BUTTON_PREFIX))
    const [hashId, cssVarCls] = useStyle(prefixCls)

    watch(() => props.captchaType, () => {
      cooling.value = false
      lastResult.value = undefined
    })

    async function onClick() {
      if (sending.value || cooling.value || props.disabled) {
        return
      }
      if (props.beforeSend && !(await props.beforeSend())) {
        return
      }
      sending.value = true
      try {
        const result = await send(props.captchaType, props.append)
        if (!result) {
          emit('canceled')
          return
        }
        lastResult.value = result
        cooling.value = true
        emit('sent', result)
      } catch (error) {
        emit('failed', error)
      } finally {
        sending.value = false
      }
    }

    expose({trigger: onClick})

    return () => {
      const {class: attrClass, style: attrStyle, ...rest} = attrs
      const coolingWithResult = cooling.value && lastResult.value
      return (
        <Button
          {...rest}
          disabled={cooling.value || sending.value || props.disabled}
          loading={sending.value}
          class={classNames(prefixCls.value, hashId.value, cssVarCls.value, props.rootClass, attrClass as string)}
          style={attrStyle}
          onClick={onClick}
        >
          {!coolingWithResult && !sending.value ? (slots.icon?.() ?? <SendOutlined />) : null}
          {coolingWithResult
            ? (
              <span class={`${prefixCls.value}-countdown`}>
                <Statistic.Timer
                  classes={{content: props.classes?.timer}}
                  styles={{content: props.styles?.timer}}
                  value={lastResult.value!.generateResult.expired as unknown as number}
                  type="countdown"
                  format={props.countdownFormat}
                  onFinish={() => {
                    cooling.value = false
                  }}
                />
              </span>
            )
            : slots.default?.()}
        </Button>
      )
    }
  },
})

export default CaptchaSendButton

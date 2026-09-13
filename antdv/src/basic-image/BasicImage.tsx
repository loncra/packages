import {computed, defineComponent} from 'vue'
import {Image, type ImageProps} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '../_util/classNames'
import useStyle from './style'
import defaultFallback from './ImageNotFound.svg'

export interface BasicImageProps {
  preview?: boolean
  fallback?: string
  prefixCls?: string
  class?: unknown
  rootClass?: string
  style?: unknown
  classes?: ImageProps['classes']
  styles?: ImageProps['styles']
}

export interface BasicImageSlots {
  cover?: () => unknown
  fallback?: () => unknown
  placeholder?: () => unknown
}

const BasicImage = defineComponent({
  name: 'LBasicImage',
  inheritAttrs: false,
  props: {
    preview: {
      type: Boolean,
      default: true,
    },
    fallback: String,
    prefixCls: String,
    rootClass: String,
    classes: Object,
    styles: Object,
  },
  setup(props, { slots, attrs }) {
    const config = useConfig()
    const prefixCls = computed(() =>
      config.value.getPrefixCls('basic-image', props.prefixCls ?? 'loncra-basic-image'),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)

    return () => {
      const { class: attrClass, style: attrStyle, ...rest } = attrs
      return (
        <div
          class={classNames(prefixCls.value, hashId.value, cssVarCls.value, props.rootClass, attrClass)}
          style={attrStyle as string | Record<string, string> | undefined}
        >
          <Image
            {...rest}
            preview={props.preview}
            fallback={props.fallback ?? defaultFallback}
            classes={props.classes}
            styles={props.styles}
            v-slots={{
              cover: props.preview && slots.cover ? () => slots.cover!() : undefined,
              fallback: slots.fallback,
              placeholder: slots.placeholder,
            }}
          />
        </div>
      )
    }
  },
})

export default BasicImage

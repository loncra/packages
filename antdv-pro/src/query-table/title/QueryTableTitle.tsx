import {defineComponent, type PropType, type VNodeChild} from 'vue'
import {classNames} from '@loncra/antdv'

const QueryTableTitle = defineComponent({
  name: 'LQueryTableTitle',
  inheritAttrs: false,
  props: {
    prefixCls: {type: String, required: true},
    hashId: String,
    cssVarCls: String,
    title: {type: [String, Number, Array, Object] as PropType<VNodeChild>, default: undefined},
    extra: {type: [String, Number, Array, Object] as PropType<VNodeChild>, default: undefined},
  },
  setup(props, {attrs}) {
    return () => {
      const {class: attrClass, style: attrStyle, ...rest} = attrs
      return (
        <div
          {...rest}
          class={classNames(
            props.prefixCls,
            props.hashId,
            props.cssVarCls,
            `${props.prefixCls}-table-title`,
            attrClass,
          )}
          style={attrStyle}
        >
          <div>{props.title}</div>
          {props.extra ? <div>{props.extra}</div> : null}
        </div>
      )
    }
  },
})

export default QueryTableTitle

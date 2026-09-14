import {defineComponent} from 'vue'
import {classNames} from '@loncra/antdv'

const ImagePane = defineComponent({
  name: 'LFileImagePane',
  inheritAttrs: false,
  props: {
    src: {
      type: String,
      required: true,
    },
    alt: {
      type: String,
      required: true,
    },
    prefixCls: {
      type: String,
      required: true,
    },
    hashId: String,
    cssVarCls: String,
  },
  setup(props) {
    return () => (
      <div class={classNames(props.hashId, props.cssVarCls, `${props.prefixCls}-media`)}>
        <img
          src={props.src}
          alt={props.alt}
          class={classNames(props.hashId, `${props.prefixCls}-media-img`)}
        />
      </div>
    )
  },
})

export default ImagePane

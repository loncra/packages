import {defineComponent} from 'vue'
import {classNames} from '@loncra/antdv'

const AudioPane = defineComponent({
  name: 'LFileAudioPane',
  inheritAttrs: false,
  props: {
    src: {
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
        <audio
          src={props.src}
          controls
          class={classNames(props.hashId, `${props.prefixCls}-media-audio`)}
        />
      </div>
    )
  },
})

export default AudioPane

import {defineComponent} from 'vue'
import {classNames} from '@loncra/antdv'
import CodeEditor from '../CodeEditor'

const TextPane = defineComponent({
  name: 'LFileTextPane',
  inheritAttrs: false,
  props: {
    ext: {
      type: String,
      required: true,
    },
    readonly: {
      type: Boolean,
      required: true,
    },
    modelValue: {
      type: String,
      default: '',
    },
    prefixCls: {
      type: String,
      required: true,
    },
    hashId: String,
    cssVarCls: String,
  },
  emits: {
    'update:modelValue': (_value: string) => true,
  },
  setup(props, {emit}) {
    return () => (
      <CodeEditor
        class={classNames(props.hashId, `${props.prefixCls}-pane`)}
        ext={props.ext}
        readonly={props.readonly}
        modelValue={props.modelValue}
        prefixCls={props.prefixCls}
        hashId={props.hashId}
        cssVarCls={props.cssVarCls}
        onUpdate:modelValue={(value) => emit('update:modelValue', value)}
      />
    )
  },
})

export default TextPane

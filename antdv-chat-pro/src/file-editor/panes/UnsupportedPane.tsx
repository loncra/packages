import {defineComponent, type PropType} from 'vue'
import {Empty, Flex} from 'antdv-next'
import {classNames} from '@loncra/antdv'
import {useLocale} from '../../_util/useLocale'

const UnsupportedPane = defineComponent({
  name: 'LFileUnsupportedPane',
  inheritAttrs: false,
  props: {
    reason: {
      type: String as PropType<'unsupported' | 'tooLarge'>,
      default: 'unsupported',
    },
    prefixCls: {
      type: String,
      required: true,
    },
    hashId: String,
    cssVarCls: String,
  },
  setup(props) {
    const locale = useLocale('FileEditor')
    return () => (
      <Flex
        class={classNames(props.hashId, props.cssVarCls, `${props.prefixCls}-pane`)}
        align="center"
        justify="center"
      >
        <Empty
          description={
            props.reason === 'tooLarge' ? locale.value.tooLarge : locale.value.unsupported
          }
        />
      </Flex>
    )
  },
})

export default UnsupportedPane

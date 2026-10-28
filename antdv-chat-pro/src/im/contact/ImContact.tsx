import {computed, defineComponent, type CSSProperties, type PropType} from 'vue'
import {Empty, Flex} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import SystemUserPanel, {type SystemUserContactItem} from '../../system-user-panel'
import {classNames} from '@loncra/antdv'
import type {PlatformUser} from '@loncra/client/auth'
import useStyle from './style'

const ImContact = defineComponent({
  name: 'LImContact',
  inheritAttrs: false,
  props: {
    dataSource: {type: Array as PropType<SystemUserContactItem[]>, default: () => []},
    prefixCls: String,
    rootClass: String,
  },
  emits: {
    selected: (_user: PlatformUser) => true,
  },
  setup(props, {emit, attrs}) {
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('im-contact', props.prefixCls ?? 'loncra-im-contact'))
    const [hashId, cssVarCls] = useStyle(prefixCls)

    function onSelected(data: PlatformUser) {
      emit('selected', data)
    }

    return () => {
      const {class: attrClass, style: attrStyle, ...rest} = attrs
      return (
        <Flex
          {...rest}
          vertical
          class={classNames(prefixCls.value, hashId.value, cssVarCls.value, props.rootClass, attrClass as string)}
          style={attrStyle as CSSProperties}
        >
          {props.dataSource.length > 0
            ? (
              <SystemUserPanel
                selected={false}
                hideSelectPanel
                dataSource={props.dataSource}
                onSelected={onSelected}
              />
            )
            : (
              <Flex class={`${prefixCls.value}-empty`} justify="center" align="center">
                <Empty />
              </Flex>
            )}
        </Flex>
      )
    }
  },
})

export default ImContact

import {computed, defineComponent, type PropType} from 'vue'
import {Empty, Flex} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import SystemUserPanel, {type SystemUserContactItem} from '../../system-user-panel'
import {classNames} from '@loncra/antdv'
import type {PlatformUser} from '@loncra/client/auth'
import {ChatMessageService, type UserChatConversationResponseBody} from '@loncra/client/message'
import useStyle from './style'

const ImContact = defineComponent({
  name: 'LImContact',
  props: {
    dataSource: {type: Array as PropType<SystemUserContactItem[]>, default: () => []},
    loading: {type: Boolean, default: false},
  },
  emits: {
    selected: (_body: UserChatConversationResponseBody) => true,
    'update:loading': (_value: boolean) => true,
    'update:dataSource': (_value: SystemUserContactItem[]) => true,
  },
  setup(props, {emit}) {
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('im-contact', 'loncra-im-contact'))
    const [hashId, cssVarCls] = useStyle(prefixCls)

    async function onSelected(data: PlatformUser) {
      emit('update:loading', true)
      try {
        const result = await ChatMessageService.createConversation(
          {id: undefined, version: undefined},
          [data.systemName],
        )
        if (result.data) {
          emit('selected', result.data)
        }
      } finally {
        emit('update:loading', false)
      }
    }

    return () => {
      const items = props.dataSource ?? []
      return (
        <Flex vertical class={classNames(prefixCls.value, hashId.value, cssVarCls.value)}>
          {items.length > 0
            ? (
              <SystemUserPanel
                selected={false}
                hideSelectPanel
                dataSource={items}
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

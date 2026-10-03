import {computed, defineComponent, type PropType, ref} from 'vue'
import {Empty, Flex} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '@loncra/antdv'
import type {SystemUserContactItem} from '@loncra/antdv-pro'
import {SystemUserPanel} from '@loncra/antdv-pro'
import type {UserChatConversationResponseBody} from '@loncra/client/message'
import {ChatMessageService} from '@loncra/client/message'
import type {PlatformUser} from '@loncra/client/auth'
import useStyle from './style'

/**
 * 联系人面板（迁自宿主 `components/message-server/chat/ChatContact.vue`，2026-10-03 Step 3）。
 *
 * ⚠️ **联系人数据由宿主给**（`ImProps.contacts` —— 登录者类型不同、该查谁不同，见 `im/types.ts`）；
 * 模块只做"**渲染 + 选择**"：选中后**自己建会话**（`ChatMessageService.createConversation`），
 * 再把新会话抛给上层（由 `l-im` 决定"入列表 + 激活"）。
 *
 * ⚠️ 与宿主的差异（都不是行为变化）：① 宿主用 `v-model:data-source`（面板可回写）—— 这里只读传入；
 * ② 宿主的 `loading` 是给外层 `a-spin` 用的，模块里由 `l-im` 统一表现（建会话这一下的忙态留在组件内）；
 * ③ **样式走 `./style`（cssinjs）**，组件里只透传宿主的 `class` / `style`（包内禁 Tailwind、禁字面量 style）。
 */
export const Contact = defineComponent({
  name: 'LImContact',
  inheritAttrs: false,
  props: {
    contacts: {type: Array as PropType<SystemUserContactItem[]>, default: () => []},
    /** 选中某个联系人、并**已建好会话**（宿主/`l-im` 决定后续） */
    onSelected: {
      type: Function as PropType<(conversation: UserChatConversationResponseBody) => void>,
      required: true,
    },
    prefixCls: String,
  },
  setup(props, {attrs}) {
    const config = useConfig()
    const prefixCls = computed(() =>
      config.value.getPrefixCls('im-contact', props.prefixCls ?? 'loncra-im-contact'),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)

    const creating = ref(false)

    async function onSelect(user: PlatformUser): Promise<void> {
      creating.value = true
      try {
        const result = await ChatMessageService.createConversation(
          {id: undefined, version: undefined},
          [user.systemName],
        )
        if (result.data) {
          props.onSelected(result.data)
        }
      } finally {
        creating.value = false
      }
    }

    return () => {
      const {class: attrClass, style: attrStyle, ...rest} = attrs
      return (
        <Flex
          {...rest}
          vertical
          class={classNames(prefixCls.value, hashId.value, cssVarCls.value, attrClass)}
          style={attrStyle as never}
        >
          {props.contacts.length > 0 ? (
            <SystemUserPanel
              selected={false}
              hideSelectPanel
              dataSource={props.contacts}
              onSelected={onSelect}
            />
          ) : (
            <Flex
              vertical
              justify="center"
              align="center"
              class={`${prefixCls.value}-empty`}
            >
              <Empty />
            </Flex>
          )}
        </Flex>
      )
    }
  },
})

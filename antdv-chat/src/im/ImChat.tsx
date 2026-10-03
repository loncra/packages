import {computed, defineComponent, onMounted, type PropType, ref, watch} from 'vue'
import {Segmented, Splitter, SplitterPanel} from 'antdv-next'
import {MessageOutlined, TeamOutlined} from '@antdv-next/icons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '@loncra/antdv'
import type {ImEvent, ImHostPort} from '@loncra/chat-core'
import type {UserChatConversationResponseBody} from '@loncra/client/message'
import type {SystemUserContactItem} from '@loncra/antdv-pro'
import {ChatView} from './components/chat-view/ChatView'
import {Contact} from './components/contact/Contact'
import {ConversationList} from './components/conversation-list/ConversationList'
import {provideImChat} from './useImChatContext'
import {useImConversations} from './useImConversations'
import {useImMessageList} from './useImMessageList'
import {useImSocket} from './useImSocket'
import type {ImSlots} from './types'
import useStyle from './style'

/**
 * `l-im` —— IM 模块入口（宿主只跟它打交道，三条通道：props / slots / emits）。
 *
 * 迁自宿主 `views/common/my/MyChatMessage.vue`（页面壳那部分）：`Splitter` 两栏 + 左栏（会话列表 /
 * 联系人 + 切换条）+ 右栏（消息区），以及"挂载时拉会话、按 `activeKey` 激活"。
 *
 * **范围**：3-B（壳 + 左栏）✓；3-C（右栏：气泡列表 + 发送器 + 引用/撤回菜单）✓。
 * 右栏里**还没做**的逐条列在 `components/chat-view/ChatView.tsx` 的文件头台账。
 *
 * ⚠️ 宿主在页面里**不再需要** `refreshActiveHeader` 那套同步（模块里"实体是唯一真相"，
 * 头部/左侧都是派生态）—— 宿主改成听 `@message` 的 `conversation.activated` 自己刷它的页面标题。
 */
export const ImChat = defineComponent({
  name: 'LIm',
  inheritAttrs: false,
  props: {
    /** 宿主给的能力：`subscribe`（socket 在宿主）+ `getPrincipal`（"我是谁"） */
    port: {type: Object as PropType<ImHostPort>, required: true},
    /** 联系人（宿主按登录者类型决定查什么） */
    contacts: {type: Array as PropType<SystemUserContactItem[]>, default: () => []},
    /** 受控的当前会话（如来自路由 query） */
    activeKey: String,
    /** 受控的"要跳到哪条消息"（配合 `activeKey`） */
    activeMessageId: Number,
    /** 相对时间文案（宿主给，见 `ImProps.formatRelativeTime`） */
    formatRelativeTime: {
      type: Function as PropType<(time: number) => string>,
      required: true,
    },
    prefixCls: String,
  },
  emits: {
    /** 领域事实（单一出口） */
    message: (event: ImEvent) => !!event,
  },
  setup(props, {attrs, slots, emit, expose}) {
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('im', props.prefixCls ?? 'loncra-im'))
    const [hashId, cssVarCls] = useStyle(prefixCls)

    /** 左栏当前面板 */
    const pane = ref<'conversation' | 'contact'>('conversation')
    const contacts = computed(() => props.contacts ?? [])

    // 先 provide（**子组件**要用它），再建各 hook —— ⚠️ 本组件自己 provide 的**自己 inject 不到**
    // （Vue 的 `inject` 只看父链）⇒ 这里这几个 hook 一律**显式收 `runtime` 参数**
    const runtime = provideImChat({
      port: props.port,
      contacts,
      slots: slots as unknown as Readonly<ImSlots>,
      emit: (event) => emit('message', event),
      formatRelativeTime: (time) => props.formatRelativeTime(time),
    })

    const conversations = useImConversations(runtime)
    const list = useImMessageList(runtime)
    useImSocket({runtime, list, conversations})

    /** 点会话：激活（内部会先写回旧草稿）→ 抛领域事实给宿主 */
    async function onSelect(
      conversation: UserChatConversationResponseBody,
      messageId?: number,
    ): Promise<void> {
      await list.activate(conversation, messageId)
      emit('message', {type: 'conversation.activated', conversation, messageId})
    }

    /** 联系人选中：新会话入列表并置顶 → 切回会话面板 → 激活 */
    async function onContactSelected(conversation: UserChatConversationResponseBody): Promise<void> {
      pane.value = 'conversation'
      conversations.upsertToTop(conversation)
      await onSelect(conversation)
    }

    onMounted(() => {
      void conversations.load()
    })

    // 受控 `activeKey`（路由 query 等）：变了就激活对应会话
    watch(
      () => props.activeKey,
      async (key, oldKey) => {
        if (!key || key === oldKey) {
          return
        }
        const found = conversations.findById(Number(key))
        if (found) {
          await list.activate(found, props.activeMessageId)
        }
      },
      {immediate: true},
    )

    expose({
      toReadableAnchor: () => list.toReadableAnchor(),
      showReadableAnchor: list.readableAnchorVisible,
      jumpToHistory: (message: {id?: number}) => list.jumpToHistoryMessage(message as never),
      reload: () => conversations.load(),
    })

    return () => {
      const {class: attrClass, style: attrStyle, ...rest} = attrs
      return (
        <Splitter
          {...rest}
          class={classNames(prefixCls.value, hashId.value, cssVarCls.value, attrClass)}
          style={attrStyle as never}
        >
          {/* 比例照宿主：`MyChatMessage.vue:213` 的 `default-size="20%" min="15%" max="25%"` */}
          <SplitterPanel
            defaultSize="20%"
            min="15%"
            max="25%"
            class={`${prefixCls.value}-pane-left`}
          >
            {pane.value === 'conversation' ? (
              <ConversationList api={conversations} onSelect={onSelect} />
            ) : (
              <Contact contacts={contacts.value} onSelected={onContactSelected} />
            )}
            <div class={`${prefixCls.value}-switch`}>
              <Segmented
                block
                value={pane.value}
                options={[
                  {
                    value: 'conversation',
                    icon: slots.icon?.({type: 'conversation'}) ?? <MessageOutlined />,
                  },
                  {value: 'contact', icon: slots.icon?.({type: 'contact'}) ?? <TeamOutlined />},
                ]}
                onChange={(value) => {
                  pane.value = value as 'conversation' | 'contact'
                }}
              />
            </div>
          </SplitterPanel>
          <SplitterPanel class={`${prefixCls.value}-pane-right`}>
            {/* 3-C：气泡列表 + 发送器 */}
            <ChatView list={list} conversations={conversations} />
          </SplitterPanel>
        </Splitter>
      )
    }
  },
})

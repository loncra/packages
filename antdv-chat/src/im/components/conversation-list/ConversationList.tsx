import {computed, defineComponent, type PropType, ref} from 'vue'
import {Avatar, AvatarGroup, Badge, Empty, Flex, Input, Typography} from 'antdv-next'
import {HeartFilled, MessageFilled, MutedOutlined, SearchOutlined} from '@antdv-next/icons'
import {type ConversationItemType, Conversations as XConversations, type ConversationsProps,} from '@antdv-next/x'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '@loncra/antdv'
import {isEnumValue, YES_OR_NO_TYPE} from '@loncra/client/commons'
import {AttachmentService} from '@loncra/client/resource'
import type {UserChatConversationResponseBody} from '@loncra/client/message'
import {useLocale} from '../../../_util/useLocale'
import {draftPreview, messagePreview} from '../../imPreview'
import {useImChat} from '../../useImChatContext'
import type {ImConversationsApi} from '../../useImConversations'
import useStyle from './style'

/**
 * x 的 `onActiveChange` 第二参 —— **不能直接 import `ItemType`**：x 的根 barrel 同时导出了
 * `./actions` 的同名类型（两者的 `label` 类型不同）⇒ 用 `Parameters<>` 从 `ConversationsProps` 上取，
 * 拿到的才是**这个组件**期望的那一个。
 */
type ConversationsActiveItem = Parameters<NonNullable<ConversationsProps['onActiveChange']>>[1]

/**
 * 会话列表（左栏）—— 迁自宿主 `components/message-server/chat/ChatConversation.vue`（2026-10-03 Step 3）。
 *
 * **本片（3-B）范围**：搜索 + 列表 + 头像/**角标装饰**（未读数字/点、置顶❤️、免打扰虚标 + 淡化）
 * + 名字/时间/预览。
 * **留给 3-D**：右键菜单（置顶/免打扰/删除 —— 动作已在 `useImConversations` 里就位）、
 * `@我` 的 popover、以及 `changeMessageExtraContent` 那套"页面头部同步"
 * （模块里改成抛 `conversation.activated`，宿主自己刷头部）。
 *
 * ⚠️ 角标装饰的三个图标走 **`slots.icon({type})`**（宿主可用自己的 icon-font 覆盖；包内兜底用
 * `antdv-next` 自带图标）—— 与左栏底部切换条同一口径（插槽优先 + 包内默认）。
 *
 * ⚠️ 三处与宿主的**结构性差异**（都不是行为变化）：
 * 1. **未读数字来自会话实体的 `readableCount`**（Step 1 契约：`messageServerStore` 那套是"外层菜单/角标"的维度）
 *    —— 宿主的 `getUserChatUnreadQuantity(key)` 是读那个 store；
 * 2. **时间文案由宿主注入** `runtime.formatRelativeTime`（模块不引 dayjs，2026-10-03 用户拍定 C）；
 * 3. 头像/头像组走 **`runtime.slots.avatar`**（缺省用首字母头像），附件 URL 仍走 client 的 `AttachmentService`。
 */
export const ConversationList = defineComponent({
  name: 'LImConversationList',
  inheritAttrs: false,
  props: {
    /** 会话列表 API（`useImConversations` 的返回值 —— 由 `l-im` 建好传进来） */
    api: {type: Object as PropType<ImConversationsApi>, required: true},
    /** 点选会话（`messageId` = `@我` 命中时要跳的那条；本片先恒为 `undefined`） */
    onSelect: {
      type: Function as PropType<
        (conversation: UserChatConversationResponseBody, messageId?: number) => void
      >,
      required: true,
    },
    prefixCls: String,
  },
  setup(props, {attrs}) {
    const config = useConfig()
    const prefixCls = computed(() =>
      config.value.getPrefixCls('im-conversation-list', props.prefixCls ?? 'loncra-im-conversation-list'),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)
    /** 根元素：前缀类 + hash + 变量类（+ 透传 class）—— 只有根能带前缀类 */
    const rootClass = (extra?: string) =>
      classNames(prefixCls.value, hashId.value, cssVarCls.value, extra)
    /**
     * 子元素：**只带 hash + 变量类 + 后缀**。
     *
     * ⚠️ **绝不能把前缀类拼到子元素上**：`[componentCls]` 那组规则
     * （`display:flex; flex-direction:column; height:100%; overflow:hidden`）是**给根**的 ——
     * 前缀类一旦落到子元素，子元素也会命中它：2026-10-03 实测搜索框那个 `div` 因此长到 `height:100%`
     * = 根的高度（375px），把 `flex:1 1 0` 的列表挤成 24px（只剩自己的 padding），条目被裁光。
     * 先例：`instruction-sender/InstructionSender.tsx:290`（同样只带 hash/变量类 + 后缀）。
     */
    const subClass = (suffix: string) =>
      classNames(hashId.value, cssVarCls.value, `${prefixCls.value}-${suffix}`)

    const runtime = useImChat()
    const {activeKey, formatRelativeTime, slots} = runtime
    const locale = useLocale('ConversationList')

    const search = ref('')

    const items = computed(() =>
      props.api.sorted.value
        .filter((conversation) =>
          search.value === '' ? true : (conversation.name ?? '').includes(search.value),
        )
        .map((conversation) => ({
          key: String(conversation.id),
          label: conversation.name,
          data: conversation,
        })),
    )

    function onActiveChange(value: string, item?: ConversationsActiveItem): void {
      const conversation = (item as ConversationItemType | undefined)?.data as
        | UserChatConversationResponseBody
        | undefined
      if (!conversation) {
        return
      }
      // x 的回调只有 `(value, item)`；`messageId`（`@我` 跳转）在 3-D 的 popover 里单独传
      props.onSelect(conversation)
      // `value` 与 `String(conversation.id)` 同源；这里不直接写 `activeKey` —— 由上层 `activate` 统一改
      void value
    }

    /**
     * 会话的三个装饰位（判定口径与宿主 `ChatConversation.vue:212-226` 一致）：
     * 置顶 / 免打扰 / 有人 `@我`（`mentions` 有内容）。
     */
    function marksOf(conversation: UserChatConversationResponseBody) {
      return {
        pinned: isEnumValue(conversation.pinned, YES_OR_NO_TYPE.YES),
        muted: isEnumValue(conversation.muted, YES_OR_NO_TYPE.YES),
        mentioned: (conversation.mentions ?? []).length > 0,
      }
    }

    /**
     * 头像：优先走宿主插槽，缺省**按宿主 `createAvatarNode` 的口径** ——
     * 有封面 ⇒ `AvatarGroup`（**最多 3 个、负边距叠放**）；无封面 ⇒ 名字首字母。
     */
    function renderAvatar(conversation: UserChatConversationResponseBody) {
      const fromSlot = slots.avatar?.({conversation, size: 'large'})
      if (fromSlot) {
        return fromSlot
      }
      const covers = conversation.cover ?? []
      if (covers.length > 0) {
        return (
          <AvatarGroup
            size="large"
            max={{count: 3}}
            class={`${prefixCls.value}-avatar-group`}
          >
            {covers.map((cover) => (
              <Avatar
                key={cover.objectName}
                src={AttachmentService.query(cover.bucketName, cover.objectName)}
              />
            ))}
          </AvatarGroup>
        )
      }
      return <Avatar size="large">{(conversation.name ?? '').substring(0, 1)}</Avatar>
    }

    /** 第二行：`@我` > 草稿 > 最后一条消息（`@我` popover 留 3-D，这里先只显示最后一条/草稿） */
    function renderPreview(conversation: UserChatConversationResponseBody) {
      const draft = conversation.draft
      if (draft && draft.length > 0) {
        return (
          <Typography.Text ellipsis type="danger">
            [{locale.value.draft}]:{draftPreview(draft, locale.value)}
          </Typography.Text>
        )
      }
      const last = conversation.lastUserMessage
      if (!last) {
        return null
      }
      return (
        <Typography.Text ellipsis type="secondary">
          {messagePreview(last, conversation, runtime.port.getPrincipal(), locale.value)}
        </Typography.Text>
      )
    }

    return () => {
      const {class: attrClass, style: attrStyle, ...rest} = attrs
      return (
        <Flex
          {...rest}
          vertical
          class={classNames(rootClass(), attrClass)}
          style={attrStyle as never}
        >
          <div class={subClass('search')}>
            <Input v-model:value={search.value} v-slots={{suffix: () => <SearchOutlined />}} />
          </div>
          {items.value.length > 0 ? (
            <XConversations
              class={subClass('list')}
              activeKey={activeKey.value}
              items={items.value}
              classes={{item: `${prefixCls.value}-item`}}
              onActiveChange={onActiveChange}
              v-slots={{
                iconRender: ({item}: {item: {data: UserChatConversationResponseBody}}) => {
                  const {pinned, muted, mentioned} = marksOf(item.data)
                  return (
                    <div
                      class={classNames(
                        subClass('icon'),
                        muted ? subClass('icon-muted') : undefined,
                      )}
                    >
                      {/* 未读：数字角标；免打扰时改成一个点（宿主 `:dot="muted===YES" :count="…"`） */}
                      <Badge
                        size="small"
                        dot={muted}
                        count={item.data.readableCount}
                        offset={[-4, 4]}
                      >
                        {renderAvatar(item.data)}
                      </Badge>
                      {pinned ? (
                        <span class={subClass('mark-pinned')}>
                          {slots.icon?.({type: 'conversation-pinned'}) ?? <HeartFilled />}
                        </span>
                      ) : null}
                      {muted ? (
                        <span class={subClass('mark-muted')}>
                          {slots.icon?.({
                            type: mentioned ? 'conversation-mentioned' : 'conversation-muted',
                          }) ?? (mentioned ? <MessageFilled /> : <MutedOutlined />)}
                        </span>
                      ) : null}
                    </div>
                  )
                },
                labelRender: ({item}: {item: {label?: unknown; data: UserChatConversationResponseBody}}) => (
                  <Flex vertical>
                    <div class={`${prefixCls.value}-title`}>
                      <Typography.Text
                        ellipsis
                        class={`${prefixCls.value}-title-name`}
                      >
                        {String(item.label ?? item.data.name ?? '')}
                      </Typography.Text>
                      {item.data.lastUserMessage ? (
                        <Typography.Text
                          type="secondary"
                          class={`${prefixCls.value}-title-time`}
                        >
                          {formatRelativeTime(item.data.lastUserMessage.creationTime ?? 0)}
                        </Typography.Text>
                      ) : null}
                    </div>
                    {renderPreview(item.data)}
                  </Flex>
                ),
              }}
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

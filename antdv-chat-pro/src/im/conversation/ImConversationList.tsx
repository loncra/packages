import {computed, defineComponent, type PropType, ref} from 'vue'
import {Avatar, Badge, Button, Flex, Input, Menu, type MenuItemType, Popover, Typography,} from 'antdv-next'
import {
    AlertOutlined,
    DeleteOutlined,
    MutedOutlined,
    PushpinFilled,
    PushpinOutlined,
    SearchOutlined,
    SoundOutlined,
} from '@antdv-next/icons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import useApp from 'antdv-next/dist/app/useApp'
import {classNames, fillLocale} from '@loncra/antdv'
import {useLocale} from '../../_util/useLocale.ts'
import {isEnumValue, YES_OR_NO_TYPE} from '@loncra/client/commons'
import {AuthServerService} from '@loncra/client/auth'
import {AttachmentService} from '@loncra/client/resource'
import {ChatMessageService, type UserChatConversationResponseBody,} from '@loncra/client/message'
import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import ConversationList from '../../conversation/ConversationList.tsx'
import type {ConversationNode} from '../../conversation/types.ts'
import useStyle, {IM_CONVERSATION_PREFIX} from './style/index.ts'

export interface ImConversationHost {
  timeText: (unix?: number) => string
  unreadCount: (id: string) => number
  messagePreview: (
    message: UserChatConversationResponseBody['lastUserMessage'] | undefined,
    conversation: UserChatConversationResponseBody,
  ) => string
  draftPreview: (draft: UserChatConversationResponseBody['draft']) => string
}

function confirmDelete(
  modal: ReturnType<typeof useApp>['modal'],
  copy: {deleteConfirmTitle: string, deleteConfirmSingle: string},
): Promise<boolean> {
  return new Promise((resolve) => {
    modal.confirm({
      title: copy.deleteConfirmTitle,
      content: copy.deleteConfirmSingle,
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    })
  })
}

const ImConversationList = defineComponent({
  name: 'LImConversationList',
  props: {
    items: {type: Array as PropType<UserChatConversationResponseBody[]>, required: true},
    selectedKeys: {type: Array as PropType<string[]>, required: true},
    openKeys: {type: Array as PropType<string[]>, required: true},
    host: {type: Object as PropType<ImConversationHost>, required: true},
    storedDrafts: {type: Object as PropType<Record<string, SlotConfigType[]>>, required: true},
  },
  emits: ['active', 'flags', 'delete', 'update:selectedKeys', 'update:openKeys'],
  setup(props, {emit}) {
    const keyword = ref('')
    const {modal, message} = useApp()
    const locale = useLocale('ImConversation')
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('im-conversation', IM_CONVERSATION_PREFIX))
    const [hashId, cssVarCls] = useStyle(prefixCls)

    async function removeConversation(item: UserChatConversationResponseBody) {
      const id = Number(item.id)
      const confirmed = await confirmDelete(modal, locale.value)
      if (!confirmed) {
        return
      }
      try {
        const result = await ChatMessageService.deleteConversation([id])
        message.success(result.message ?? '')
        emit('delete', item)
      } catch (e) {
        message.error(e instanceof Error ? e.message : String(e))
      }
    }

    async function toggleConversationFlag(key: 'pinned' | 'muted', item: UserChatConversationResponseBody) {
      const id = Number(item.id)
      const result = key === 'pinned'
        ? await ChatMessageService.pinnedConversation([id])
        : await ChatMessageService.mutedConversation([id])
      emit('flags', result.data ?? [])
    }

    async function onMenuClick(key: string, item: UserChatConversationResponseBody) {
      const id = Number(item.id)
      if (!Number.isFinite(id)) {
        return
      }
      if (key === 'delete') {
        await removeConversation(item)
        return
      }
      if (key === 'pinned' || key === 'muted') {
        await toggleConversationFlag(key, item)
      }
    }

    function menuOf(item: UserChatConversationResponseBody): MenuItemType[] {
      const pinned = isEnumValue(item.pinned, YES_OR_NO_TYPE.YES)
      const muted = isEnumValue(item.muted, YES_OR_NO_TYPE.YES)
      const copy = locale.value
      const PinIcon = pinned ? PushpinFilled : PushpinOutlined
      const MuteIcon = muted ? SoundOutlined : MutedOutlined
      return [
        {
          key: 'pinned',
          label: pinned ? copy.unpin : copy.pin,
          icon: () => <PinIcon />,
        },
        {
          key: 'muted',
          label: muted ? copy.unmute : copy.mute,
          icon: () => <MuteIcon />,
        },
        {type: 'divider'},
        {
          key: 'delete',
          label: copy.delete,
          danger: true,
          icon: () => <DeleteOutlined />,
        },
      ]
    }

    function renderIcon(item: UserChatConversationResponseBody) {
      const muted = isEnumValue(item.muted, YES_OR_NO_TYPE.YES)
      const cover = item.cover || []
      const avatar = cover.length > 0
        ? (
          <Avatar.Group max={{count: 3}} size="large" class={`${prefixCls.value}-avatars`}>
            {cover.map((file) => (
              <Avatar
                key={file.objectName}
                src={AttachmentService.query(file.bucketName, file.objectName)}
              />
            ))}
          </Avatar.Group>
        )
        : <Avatar size="large">{item.name.substring(0, 1)}</Avatar>
      return (
        <div class={classNames(`${prefixCls.value}-icon`, muted && `${prefixCls.value}-icon-muted`)}>
          <span class={`${prefixCls.value}-avatar`}>
            <Badge size="small" dot={muted} count={props.host.unreadCount(String(item.id))}>
              {avatar}
            </Badge>
            {isEnumValue(item.pinned, YES_OR_NO_TYPE.YES) || muted
              ? (
                <span class={`${prefixCls.value}-marks`}>
                  {isEnumValue(item.pinned, YES_OR_NO_TYPE.YES)
                    ? (
                      <span class={`${prefixCls.value}-mark ${prefixCls.value}-pin`}>
                        <PushpinFilled />
                      </span>
                    )
                    : null}
                  {muted
                    ? (
                      <span class={`${prefixCls.value}-mark ${prefixCls.value}-mute`}>
                        {(item.mentions || []).length > 0 ? <AlertOutlined /> : <MutedOutlined />}
                      </span>
                    )
                    : null}
                </span>
              )
              : null}
          </span>
        </div>
      )
    }

    function renderSubtitle(item: UserChatConversationResponseBody) {
      const mentions = item.mentions || []
      const preview = props.host.messagePreview(item.lastUserMessage, item)
      if (mentions.length > 0) {
        return (
          <Popover
            v-slots={{
              content: () => (
                <Flex vertical gap="small" class={`${prefixCls.value}-mentions`}>
                  {mentions.map((mention) => (
                    <Flex key={mention.messageId} gap="small" align="center">
                      <Typography.Text type="secondary">
                        {props.host.timeText(mention.creationTime)}
                      </Typography.Text>
                      <span>
                        {fillLocale(locale.value.mentionLine, {
                          principal: AuthServerService.getPrincipalNameByUserDetails(mention.participant.metadata?.details),
                        })}
                      </span>
                      <Button
                        type="link"
                        size="small"
                        onClick={(event: MouseEvent) => {
                          event.stopPropagation()
                          emit('active', String(item.id), mention.messageId)
                        }}
                      >
                        {locale.value.detail}
                      </Button>
                    </Flex>
                  ))}
                </Flex>
              ),
              default: () => (
                <Typography.Text ellipsis type="secondary">
                  <Typography.Text type="danger">
                    {`[${fillLocale(locale.value.mention, {count: mentions.length})}]`}
                  </Typography.Text>
                  {preview}
                </Typography.Text>
              ),
            }}
          />
        )
      }
      const roomId = item.room?.id
      const stored = roomId == null ? undefined : props.storedDrafts[String(roomId)]
      const draft = item.draft && item.draft.length > 0 ? item.draft : stored
      if (draft && draft.length > 0) {
        return (
          <Typography.Text ellipsis type="danger">
            {`[${locale.value.draft}]:${props.host.draftPreview(draft)}`}
          </Typography.Text>
        )
      }
      if (item.lastUserMessage) {
        return <Typography.Text ellipsis type="secondary">{preview}</Typography.Text>
      }
      return null
    }

    return () => {
      const lookup = new Map<string, UserChatConversationResponseBody>()
      const nodes: ConversationNode[] = props.items
        .filter((item) => keyword.value === '' || item.name.includes(keyword.value))
        .map((item) => {
          const key = String(item.id)
          lookup.set(key, item)
          const creationTime = item.lastUserMessage?.creationTime
          return {
            key,
            name: item.name,
            timeText: creationTime != null ? props.host.timeText(creationTime) : undefined,
          }
        })
      return (
        <ConversationList
          class={classNames(prefixCls.value, hashId.value, cssVarCls.value)}
          items={nodes}
          selectedKeys={props.selectedKeys}
          openKeys={props.openKeys}
          onUpdate:selectedKeys={(keys: string[]) => emit('update:selectedKeys', keys)}
          onUpdate:openKeys={(keys: string[]) => emit('update:openKeys', keys)}
          onActive={(key: string) => emit('active', key)}
          v-slots={{
            header: () => (
              <div class={`${prefixCls.value}-search`}>
                <Input
                  value={keyword.value}
                  placeholder={locale.value.search}
                  onUpdate:value={(value: string) => {
                    keyword.value = value
                  }}
                  v-slots={{suffix: () => <SearchOutlined />}}
                />
              </div>
            ),
            icon: (node: ConversationNode) => {
              const item = lookup.get(node.key)
              return item ? renderIcon(item) : null
            },
            subtitle: (node: ConversationNode) => {
              const item = lookup.get(node.key)
              return item ? renderSubtitle(item) : null
            },
            actions: (node: ConversationNode) => {
              const item = lookup.get(node.key)
              if (!item) {
                return null
              }
              return (
                <Menu
                  items={menuOf(item)}
                  onClick={(info: {key: string | number}) => onMenuClick(String(info.key), item)}
                />
              )
            },
          }}
        />
      )
    }
  },
})

export default ImConversationList

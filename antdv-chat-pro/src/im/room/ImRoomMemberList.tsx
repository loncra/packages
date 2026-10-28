import {computed, defineComponent, type PropType} from 'vue'
import {Avatar, Badge, Flex, Input, Typography} from 'antdv-next'
import {UserAddOutlined} from '@antdv-next/icons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {UserAvatar} from '@loncra/antdv-pro'
import {classNames} from '@loncra/antdv'
import {getEnumName, isEnumValue} from '@loncra/client/commons'
import {MESSAGE_SERVER_USER_CHAT_PARTICIPANT_TYPE, type UserChatParticipantEntity,} from '@loncra/client/message'
import {AuthServerService} from '@loncra/client/auth'
import {useLocale} from '../../_util/useLocale.ts'
import {isOwnerType} from './imRoomKinds.ts'

const ImRoomMemberList = defineComponent({
  name: 'LImRoomMemberList',
  props: {
    participants: {type: Array as PropType<UserChatParticipantEntity[]>, required: true},
    keyword: {type: String, default: ''},
    prefixCls: String,
    hashId: String,
    cssVarCls: String,
  },
  emits: {
    'update:keyword': (_keyword: string) => true,
    add: () => true,
  },
  setup(props, {emit}) {
    const locale = useLocale('ImRoom')
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('im-room', props.prefixCls))

    function visibleParticipants() {
      const text = props.keyword.trim().toLowerCase()
      if (!text) {
        return props.participants
      }
      return props.participants.filter((item) =>
        AuthServerService.getPrincipalNameByUserDetails(item.metadata?.details).toLowerCase().includes(text),
      )
    }

    function renderMember(participant: UserChatParticipantEntity) {
      const prefix = prefixCls.value
      const name = AuthServerService.getPrincipalNameByUserDetails(participant.metadata?.details)
      const avatar = (
        <UserAvatar
          user={participant.metadata?.details}
          {...({size: 'large', shape: 'square'} as Record<string, unknown>)}
        />
      )
      return (
        <div key={participant.id} class={`${prefix}-member`}>
          {isOwnerType(participant)
            ? (
              <Badge.Ribbon
                class={`${prefix}-ribbon`}
                color={isEnumValue(participant.type, MESSAGE_SERVER_USER_CHAT_PARTICIPANT_TYPE.OWNER) ? 'gold' : 'yellow'}
                text={getEnumName(participant.type)}
              >
                {avatar}
              </Badge.Ribbon>
            )
            : avatar}
          <Typography.Text class={`${prefix}-member-name`} ellipsis={{tooltip: name}}>
            {name}
          </Typography.Text>
        </div>
      )
    }

    return () => {
      const prefix = prefixCls.value
      return (
        <Flex vertical class={classNames(prefix, props.hashId, props.cssVarCls)}>
          <div class={`${prefix}-search`}>
            <Input.Search
              value={props.keyword}
              allowClear
              onUpdate:value={(value: string) => {
                emit('update:keyword', value)
              }}
            />
          </div>
          <div class={`${prefix}-members`}>
            {visibleParticipants().map(renderMember)}
            <div class={`${prefix}-add`} onClick={() => emit('add')}>
              <Avatar size="large" shape="square">
                <UserAddOutlined />
              </Avatar>
              <Typography.Text>{locale.value.add}</Typography.Text>
            </div>
          </div>
        </Flex>
      )
    }
  },
})

export default ImRoomMemberList

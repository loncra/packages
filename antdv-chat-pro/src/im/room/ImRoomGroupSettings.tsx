import {defineComponent, type PropType} from 'vue'
import {Button, Flex, Input, Space, SpaceCompact, Switch, Typography} from 'antdv-next'
import {CheckOutlined, CloseCircleOutlined, CloseOutlined, DeleteOutlined, EditOutlined, LogoutOutlined, UserSwitchOutlined,} from '@antdv-next/icons'
import {isEnumValue, YES_OR_NO_TYPE} from '@loncra/client/commons'
import {type UserChatConversationResponseBody} from '@loncra/client/message'
import {useLocale} from '../../_util/useLocale.ts'

const ImRoomGroupSettings = defineComponent({
  name: 'LImRoomGroupSettings',
  props: {
    conversation: {type: Object as PropType<UserChatConversationResponseBody>, required: true},
    enabled: {type: Boolean, default: false},
    selfCanManage: {type: Boolean, default: false},
    selfIsOwner: {type: Boolean, default: false},
    busy: {type: Boolean, default: false},
    pinPending: {type: Boolean, default: false},
    mutePending: {type: Boolean, default: false},
    editing: {type: Boolean, default: false},
    draftName: {type: String, default: ''},
  },
  emits: {
    'update:draftName': (_name: string) => true,
    renameStart: () => true,
    renameConfirm: () => true,
    renameCancel: () => true,
    pin: () => true,
    mute: () => true,
    memberManage: () => true,
    exit: () => true,
    disband: () => true,
  },
  setup(props, {emit}) {
    const locale = useLocale('ImRoom')

    return () => {
      const conversation = props.conversation
      return (
        <Flex vertical gap="middle">
          <Flex justify="space-between" align="center">
            <Typography.Text>{locale.value.name}</Typography.Text>
            {props.editing
              ? (
                <SpaceCompact>
                  <Input
                    size="small"
                    maxlength={16}
                    value={props.draftName}
                    onUpdate:value={(value: string) => {
                      emit('update:draftName', value)
                    }}
                    onPressEnter={() => emit('renameConfirm')}
                  />
                  <Button size="small" onClick={() => emit('renameCancel')} v-slots={{icon: () => <CloseOutlined />}} />
                  <Button
                    size="small"
                    type="primary"
                    loading={props.busy}
                    onClick={() => emit('renameConfirm')}
                    v-slots={{icon: () => <CheckOutlined />}}
                  />
                </SpaceCompact>
              )
              : (
                <Space>
                  <Typography.Text>{conversation.name}</Typography.Text>
                  {props.selfCanManage && props.enabled
                    ? (
                      <Button
                        size="small"
                        type="text"
                        onClick={() => emit('renameStart')}
                        v-slots={{icon: () => <EditOutlined />}}
                      />
                    )
                    : null}
                </Space>
              )}
          </Flex>
          {props.enabled
            ? (
              <>
                <Flex justify="space-between" align="center">
                  <Typography.Text>{locale.value.pinned}</Typography.Text>
                  <Switch
                    size="small"
                    loading={props.pinPending}
                    checked={isEnumValue(conversation.pinned, YES_OR_NO_TYPE.YES)}
                    checkedChildren={locale.value.open}
                    unCheckedChildren={locale.value.close}
                    onChange={() => emit('pin')}
                  />
                </Flex>
                <Flex justify="space-between" align="center">
                  <Typography.Text>{locale.value.muted}</Typography.Text>
                  <Switch
                    size="small"
                    loading={props.mutePending}
                    checked={isEnumValue(conversation.muted, YES_OR_NO_TYPE.YES)}
                    checkedChildren={locale.value.open}
                    unCheckedChildren={locale.value.close}
                    onChange={() => emit('mute')}
                  />
                </Flex>
              </>
            )
            : null}
          {props.selfCanManage && props.enabled
            ? (
              <Button
                block
                onClick={() => emit('memberManage')}
                v-slots={{icon: () => <UserSwitchOutlined />}}
              >
                {locale.value.memberManager}
              </Button>
            )
            : null}
          <SpaceCompact block>
            <Button
              block
              danger
              loading={props.busy}
              onClick={() => emit('exit')}
              v-slots={{icon: () => (props.enabled ? <LogoutOutlined /> : <DeleteOutlined />)}}
            >
              {props.enabled ? locale.value.exit : locale.value.deleteConversation}
            </Button>
            {props.selfIsOwner && props.enabled
              ? (
                <Button
                  block
                  danger
                  type="primary"
                  loading={props.busy}
                  onClick={() => emit('disband')}
                  v-slots={{icon: () => <CloseCircleOutlined />}}
                >
                  {locale.value.disband}
                </Button>
              )
              : null}
          </SpaceCompact>
        </Flex>
      )
    }
  },
})

export default ImRoomGroupSettings

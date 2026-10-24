import {computed, defineComponent, type PropType, type Ref, ref, toRef} from 'vue'
import {Checkbox, Divider, Empty, Flex, Input, Space, TypographyText} from 'antdv-next'
import {SearchOutlined, UsergroupAddOutlined} from '@antdv-next/icons'
import type {ConversationItemType, DividerItemType} from '@antdv-next/x'
import {Conversations} from '@antdv-next/x'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames, useTwoWayModel} from '@loncra/antdv'
import type {PlatformUser} from '@loncra/client/auth'
import {AuthServerService} from '@loncra/client/auth'
import {useLocale} from '../_util/useLocale'
import {UserAvatar} from '@loncra/antdv-pro'
import type {
  SystemUserContactItem,
  SystemUserPanelClasses,
  SystemUserPanelStyles,
} from './types'
import useStyle from './style'

const SystemUserPanel = defineComponent({
  name: 'LSystemUserPanel',
  inheritAttrs: false,
  props: {
    dataSource: {
      type: Array as PropType<SystemUserContactItem[]>,
      default: () => [],
    },
    value: {
      type: Array as PropType<SystemUserContactItem[]>,
      default: () => [],
    },
    selected: {
      type: Boolean,
      default: true,
    },
    filter: {
      type: Function as PropType<(item: SystemUserContactItem) => boolean>,
      default: () => true,
    },
    hideSelectPanel: {
      type: Boolean,
      default: false,
    },
    hideSearch: {
      type: Boolean,
      default: false,
    },
    avatarSize: {
      type: [String, Number] as PropType<string | number>,
      default: 'large',
    },
    prefixCls: String,
    rootClass: String,
    classes: Object as PropType<SystemUserPanelClasses>,
    styles: Object as PropType<SystemUserPanelStyles>,
  },
  emits: {
    selected: (_body: PlatformUser) => true,
    'update:value': (_value: SystemUserContactItem[]) => true,
  },
  setup(props, {emit, attrs}) {
    const locale = useLocale('SystemUserPanel')
    const config = useConfig()
    const prefixCls = computed(() =>
      config.value.getPrefixCls(
        'system-user-panel',
        props.prefixCls ?? 'loncra-system-user-panel',
      ),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)

    const dataSource = toRef(props, 'dataSource') as unknown as Ref<SystemUserContactItem[]>
    const selectedValue = useTwoWayModel(props, 'value', emit) as unknown as Ref<
      SystemUserContactItem[]
    >

    const searchValue = ref('')

    const showSelectPanel = computed(() => props.selected && !props.hideSelectPanel)

    const filterDataSource = computed(() =>
      dataSource.value
        .filter((item) =>
          searchValue.value === '' ? true : principalName(item.data).includes(searchValue.value),
        )
        .filter((item) => props.filter(item)),
    )

    function principalName(user: PlatformUser) {
      return AuthServerService.getPrincipalNameByUserDetails(user)
    }

    function onContactActiveChange(
      _value: string,
      item?: ConversationItemType | DividerItemType,
    ) {
      const contact = item as unknown as SystemUserContactItem | undefined
      if (!contact?.data) {
        return
      }
      const selected = selectedValue.value ?? []
      if (props.selected) {
        const find = selected.find((c) => c.key === contact.key)
        if (find) {
          selectedValue.value = selected.filter((c) => c.key !== find.key)
        } else {
          selectedValue.value = [contact, ...selected]
        }
      }
      emit('selected', contact.data)
    }

    return () => {
      const {class: attrClass, style: attrStyle, ...rest} = attrs
      const hashed = (...names: (string | undefined)[]) =>
        classNames(hashId.value, cssVarCls.value, ...names)
      const selectPanelVisible = showSelectPanel.value
      const selected = selectedValue.value ?? []

      const renderEmpty = () => (
        <Flex
          class={hashed(`${prefixCls.value}-empty`, props.classes?.empty)}
          style={props.styles?.empty}
          justify="center"
          align="center"
        >
          <Empty />
        </Flex>
      )

      return (
        <Flex
          {...rest}
          class={classNames(
            prefixCls.value,
            hashId.value,
            cssVarCls.value,
            props.rootClass,
            attrClass as string,
          )}
          style={attrStyle as never}
        >
          <Flex
            vertical
            class={hashed(
              `${prefixCls.value}-list`,
              selectPanelVisible ? `${prefixCls.value}-list-split` : `${prefixCls.value}-list-full`,
              props.classes?.list,
            )}
            style={props.styles?.list}
          >
            {!props.hideSearch ? (
              <div
                class={hashed(`${prefixCls.value}-search`, props.classes?.search)}
                style={props.styles?.search}
              >
                <Input
                  value={searchValue.value}
                  onUpdate:value={(value: string) => {
                    searchValue.value = value
                  }}
                  v-slots={{
                    suffix: () => (
                      <SearchOutlined class={hashed(`${prefixCls.value}-search-icon`)} />
                    ),
                  }}
                />
              </div>
            ) : null}
            {filterDataSource.value.length > 0 ? (
              <Conversations
                class={hashed(`${prefixCls.value}-conversations`)}
                classes={{
                  ...props.classes?.conversations,
                  item: classNames(
                    hashed(`${prefixCls.value}-item`),
                    props.classes?.conversations?.item,
                  ),
                }}
                styles={props.styles?.conversations}
                items={filterDataSource.value as never}
                groupable
                onActiveChange={onContactActiveChange}
                v-slots={{
                  iconRender: ({item}: {item: ConversationItemType}) => (
                    <Space>
                      {props.selected ? (
                        <Checkbox checked={selected.some((d) => d.key === item.key)} />
                      ) : null}
                      <UserAvatar
                        user={(item as unknown as SystemUserContactItem).data}
                        {...({size: props.avatarSize} as Record<string, unknown>)}
                      />
                    </Space>
                  ),
                  labelRender: ({item}: {item: ConversationItemType}) => {
                    const contact = item as unknown as SystemUserContactItem
                    const phoneNumber = contact.data?.phoneNumber
                    const email = contact.data?.email
                    return (
                      <Flex vertical>
                        <TypographyText ellipsis class={hashed(`${prefixCls.value}-label`)}>
                          {contact.label}
                        </TypographyText>
                        <TypographyText ellipsis type="secondary">
                          {phoneNumber ? `${locale.value.phoneNumber}: ${phoneNumber}` : null}
                          {email ? `${locale.value.email}: ${email}` : null}
                        </TypographyText>
                      </Flex>
                    )
                  },
                }}
              />
            ) : (
              renderEmpty()
            )}
          </Flex>
          {selectPanelVisible ? (
            <Flex
              vertical
              class={hashed(`${prefixCls.value}-selected-panel`, props.classes?.selectedPanel)}
              style={props.styles?.selectedPanel}
            >
              {selected.length > 0 ? (
                <div>
                  <Divider
                    plain
                    titlePlacement="left"
                    class={hashed(`${prefixCls.value}-selected-divider`)}
                    classes={props.classes?.selectedDivider}
                    styles={props.styles?.selectedDivider}
                  >
                    <Space>
                      <UsergroupAddOutlined />
                      <span>{locale.value.selectedMember}</span>
                    </Space>
                  </Divider>
                  <Space wrap>
                    {selected.map((contact) => (
                      <Flex
                        key={contact.key}
                        vertical
                        justify="center"
                        align="center"
                        class={hashed(`${prefixCls.value}-selected-item`, props.classes?.selectedItem)}
                        style={props.styles?.selectedItem}
                      >
                        <UserAvatar
                          user={contact.data}
                          {...({size: 'large', shape: 'square'} as Record<string, unknown>)}
                        />
                        <TypographyText ellipsis={{tooltip: principalName(contact.data)}}>
                          {principalName(contact.data)}
                        </TypographyText>
                      </Flex>
                    ))}
                  </Space>
                </div>
              ) : (
                renderEmpty()
              )}
            </Flex>
          ) : null}
        </Flex>
      )
    }
  },
})

export default SystemUserPanel

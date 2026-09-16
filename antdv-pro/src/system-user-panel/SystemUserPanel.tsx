import {computed, defineComponent, type PropType, type Ref, ref, useModel} from 'vue'
import {Checkbox, Divider, Empty, Flex, Input, Space, TypographyText} from 'antdv-next'
import {SearchOutlined, UsergroupAddOutlined} from '@antdv-next/icons'
import {Conversations} from '@antdv-next/x'
import type {ConversationItemType, DividerItemType} from '@antdv-next/x'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '@loncra/antdv'
import type {PlatformUser} from '@loncra/client/auth'
import {AuthServerService} from '@loncra/client/auth'
import {useLocale} from '../_util/useLocale'
import UserAvatar from '../user-avatar'
import useStyle from './style'

/**
 * 选人面板的行数据。
 * 结构上同时满足 `@antdv-next/x` 的 `ConversationItemType`（key / label / group / disabled）。
 */
export interface SystemUserContactItem {
  key: string
  label?: string
  data: PlatformUser
  disabled?: boolean
  group?: string
  [key: string]: unknown
}

export interface SystemUserPanelProps {
  /** 可选项数据源，`v-model:dataSource` */
  dataSource?: SystemUserContactItem[]
  /** 已选集合，`v-model:value` */
  value?: SystemUserContactItem[]
  /** 是否可多选，并在右侧展示「已选择的成员」面板 */
  selected?: boolean
  /** 在搜索过滤之上再过滤一次 */
  filter?: (item: SystemUserContactItem) => boolean
  /** 隐藏右侧「已选择的成员」面板 */
  hideSelectPanel?: boolean
  /** 隐藏搜索框 */
  hideSearch?: boolean
  /** 头像尺寸，透传给 UserAvatar */
  avatarSize?: string | number
  prefixCls?: string
  rootClass?: string
}

export interface SystemUserPanelEmits {
  /** 点击某个联系人时抛出，无论该联系人是否被选中 */
  selected: (body: PlatformUser) => void
  'update:dataSource': (value: SystemUserContactItem[]) => void
  'update:value': (value: SystemUserContactItem[]) => void
}

export interface SystemUserPanelSlots {}

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
  },
  emits: {
    selected: (_body: PlatformUser) => true,
    'update:dataSource': (_value: SystemUserContactItem[]) => true,
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

    // 双向绑定：父级 v-model 时纯受控，未绑时写本地值并 emit
    const dataSource = useModel(props, 'dataSource') as unknown as Ref<SystemUserContactItem[]>
    const selectedValue = useModel(props, 'value') as unknown as Ref<SystemUserContactItem[]>

    const searchValue = ref('')

    const showSelectPanel = computed(() => props.selected && !props.hideSelectPanel)

    const filterDataSource = computed(() =>
      (dataSource.value ?? [])
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

      return (
        <Flex
          {...rest}
          class={hashed(prefixCls.value, props.rootClass, attrClass as string)}
          style={attrStyle as never}
        >
          <Flex
            vertical
            class={hashed(
              `${prefixCls.value}-list`,
              selectPanelVisible ? `${prefixCls.value}-list-split` : `${prefixCls.value}-list-full`,
            )}
          >
            {!props.hideSearch ? (
              <div class={hashed(`${prefixCls.value}-search`)}>
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
                classes={{item: hashed(`${prefixCls.value}-item`)}}
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
              <Flex class={hashed(`${prefixCls.value}-empty`)} justify="center" align="center">
                <Empty />
              </Flex>
            )}
          </Flex>
          {selectPanelVisible ? (
            <Flex vertical class={hashed(`${prefixCls.value}-selected-panel`)}>
              {selected.length > 0 ? (
                <div>
                  <Divider
                    plain
                    titlePlacement="left"
                    class={hashed(`${prefixCls.value}-selected-divider`)}
                  >
                    <Space>
                      <UsergroupAddOutlined />
                      <span>{locale.value.selectedMember}</span>
                    </Space>
                  </Divider>
                  <Space wrap>
                    {selected.map((contact) => (
                      <Flex
                        key={contact.data.id}
                        vertical
                        justify="center"
                        align="center"
                        class={hashed(`${prefixCls.value}-selected-item`)}
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
                <Flex class={hashed(`${prefixCls.value}-empty`)} justify="center" align="center">
                  <Empty />
                </Flex>
              )}
            </Flex>
          ) : null}
        </Flex>
      )
    }
  },
})

export default SystemUserPanel

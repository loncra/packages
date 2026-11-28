import {computed, defineComponent, type PropType, toRef} from 'vue'
import {Alert, Card, Empty, Flex, Pagination, Space, Tag, Typography} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames, ICON_SELECT_AVATAR_MODE_VALUE, IconSelect} from '@loncra/antdv'
import {type TotalPage} from '@loncra/client/commons'
import {
  AI_SERVER_PLUGIN_INSTALL_USER_SCOPE,
  type PluginInstallGroup,
  type UserPluginInstallResult,
  type UserPluginMetadata
} from '@loncra/client/ai'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import {useLocale} from '../../../_util/useLocale'
import PluginInstallModal from './plugin-install-modal/PluginInstallModal'
import PluginCardAction from './PluginCardAction'
import {hasInstallForScope, usePluginInstallActions, type WorkspaceMeta} from './usePluginInstallActions'
import {usePluginInstallForm} from './usePluginInstallForm'
import useStyle, {AGENT_HUB_CARD_PREFIX} from './style'
import type {AgentConversationRecord} from '../../conversation'
import type {Self} from '../../types'
import type {PluginCardRecord} from '../types'

dayjs.extend(relativeTime)

const PluginCard = defineComponent({
  name: 'LAgentHubPluginCard',
  props: {
    dataSource: {type: Object as PropType<TotalPage<PluginCardRecord>>, required: true},
    installs: {type: Array as PropType<UserPluginInstallResult[]>, default: () => []},
    targetType: {type: String, required: true},
    workspaces: {type: Array as PropType<AgentConversationRecord[]>, default: () => []},
    self: {type: Object as PropType<Self>, default: undefined},
  },
  emits: {
    changePage: (_page: number, _pageSize: number) => true,
    installed: (_result: UserPluginInstallResult) => true,
    uninstalled: (_event: UserPluginMetadata) => true,
  },
  setup(props, {emit, slots}) {
    const locale = useLocale('AgentHub')
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('agent-hub-card', AGENT_HUB_CARD_PREFIX))
    const [hashId, cssVarCls] = useStyle(prefixCls)
    const cls = (name: string) => `${prefixCls.value}-${name}`
    const {
      installOpen,
      installPackage,
      installGroup,
      ownershipLocked,
      installForm,
      onInstall,
      onInstallOwnership,
      onOwnershipChange,
      onManage,
      installBody,
    } = usePluginInstallForm({targetType: props.targetType, workspaces: toRef(props, 'workspaces')})
    const {installGroups, isOrgOwner, onUninstall, onStatusChange} = usePluginInstallActions({
      targetType: props.targetType,
      installs: toRef(props, 'installs'),
      self: toRef(props, 'self'),
      onInstalled: (result: UserPluginInstallResult) => emit('installed', result),
      onUninstalled: (event: UserPluginMetadata) => {
        installOpen.value = false
        emit('uninstalled', event)
      },
    })

    function renderAction(record: PluginCardRecord) {
      return (
        <PluginCardAction
          record={record}
          installs={props.installs}
          workspaces={props.workspaces}
          self={props.self}
          targetType={props.targetType}
          onInstall={() => onInstall(record)}
          onInstallOwnership={(ownership: number) => onInstallOwnership(record, ownership)}
          onManage={(group?: PluginInstallGroup) => onManage(record, group)}
        />
      )
    }

    function renderCard(record: PluginCardRecord) {
      const group = record.id == null ? undefined : installGroups.value.get(record.id)
      const showEnterpriseAlert = hasInstallForScope(group, AI_SERVER_PLUGIN_INSTALL_USER_SCOPE.ENTERPRISE) && !isOrgOwner.value
      return (
        <Card
          key={record.id}
          size="small"
          classes={{body: cls('card-body')}}
          v-slots={{
            title: () => slots.title?.({record}),
            extra: () => renderAction(record),
          }}
        >
          <Flex gap="middle" vertical >
            <Flex gap="middle">
              <IconSelect
                preview
                value={record.icon || ICON_SELECT_AVATAR_MODE_VALUE.INPUT + record.name}
              />
              <Flex gap="small" vertical>
                <Flex justify="space-between" align="center">
                  <Space wrap>
                    {(record.tags || []).map((tag) => <Tag key={tag}>{tag}</Tag>)}
                  </Space>
                  {record.creationTime
                    ? (
                      <Typography.Text type="secondary" class={cls('time')}>
                        {dayjs(record.creationTime).fromNow()}
                      </Typography.Text>
                    )
                    : null}
                </Flex>
                <div class={cls('summary')}>{record.summary}</div>
                {slots.after?.({record})}
              </Flex>
            </Flex>
            {showEnterpriseAlert
              ? (
                <Alert
                  type="warning"
                  showIcon
                  description={locale.value.enterpriseInstalledDescription}
                />
              )
              : null}
          </Flex>
        </Card>
      )
    }

    function renderCardList(elements: PluginCardRecord[]) {
      return (
        <Flex vertical class={cls('scroll')} gap="large">
          {elements.map((record) => renderCard(record))}
          <Pagination
            size="small"
            align="center"
            current={props.dataSource.number}
            hideOnSinglePage
            pageSize={props.dataSource.size}
            total={props.dataSource.totalCount}
            onChange={(page: number, pageSize: number) => emit('changePage', page, pageSize)}
          />
        </Flex>
      )
    }

    function renderEmpty() {
      return (
        <Flex class={cls('empty')} justify="center" align="center">
          <Empty />
        </Flex>
      )
    }

    return () => {
      const rootClass = classNames(prefixCls.value, hashId.value, cssVarCls.value)
      const elements = props.dataSource.elements || []
      return (
        <div class={rootClass}>
          {elements.length > 0 ? renderCardList(elements) : renderEmpty()}
          <PluginInstallModal
            open={installOpen.value}
            record={installPackage.value}
            workspaces={props.workspaces}
            installs={props.installs}
            self={props.self}
            form={installForm}
            group={installGroup.value}
            ownershipLocked={ownershipLocked.value}
            ownershipSelectable={isOrgOwner.value}
            installBody={installBody}
            onOwnershipChange={onOwnershipChange}
            onStatusChange={(row: UserPluginInstallResult, checked: boolean) => void onStatusChange(row, checked)}
            onUninstall={(scope: number, selected: WorkspaceMeta[]) => {
              if (installPackage.value != null) {
                onUninstall(installPackage.value, scope, selected)
              }
            }}
            onUpdate:open={(open: boolean) => installOpen.value = open}
            onInstalled={(result: UserPluginInstallResult) => emit('installed', result)}
            v-slots={{
              afterScope: (ctx: Record<string, unknown>) => slots.afterModalScope?.({...ctx, group: installGroup.value}),
              workspaceItemExtra: (ctx: Record<string, unknown>) => slots.workspaceItemExtra?.(ctx),
            }}
          />
        </div>
      )
    }
  },
})

export default PluginCard

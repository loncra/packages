import {computed, defineComponent, type PropType, ref, toRef} from 'vue'
import {Button, Card, Empty, Flex, Pagination, Popover, Space, Tag, Typography} from 'antdv-next'
import {DeleteOutlined, DownloadOutlined} from '@antdv-next/icons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames, ICON_SELECT_AVATAR_MODE_VALUE, IconSelect} from '@loncra/antdv'
import type {TotalPage} from '@loncra/client/commons'
import {
  AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE,
  type UserPluginInstallResult,
  type UserPluginMetadata
} from '@loncra/client/ai'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import {useLocale} from '../../_util/useLocale'
import PluginInstallModal from './PluginInstallModal'
import {usePluginInstallActions} from './usePluginInstallActions'
import PluginWorkspaceCheckList from './PluginWorkspaceCheckList'
import type {AgentConversationRecord} from '../conversation'
import type {Self} from '../types'
import useStyle, {AGENT_HUB_PREFIX} from './style'
import type {PluginCardRecord} from './types.ts'

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
    const prefixCls = computed(() => config.value.getPrefixCls('agent-hub', AGENT_HUB_PREFIX))
    const [hashId, cssVarCls] = useStyle(prefixCls)
    const cls = (name: string) => `${prefixCls.value}-${name}`
    const installOpen = ref(false)
    const installPackage = ref<PluginCardRecord>()
    const installScope = ref<number>()
    const {installGroups, isOrgOwner, onUninstall} = usePluginInstallActions({
      targetType: props.targetType,
      installs: toRef(props, 'installs'),
      self: toRef(props, 'self'),
      onUninstalled: (event: UserPluginMetadata) => emit('uninstalled', event),
    })
    const modalWorkspaces = computed(() => {
      if (installScope.value == null || installPackage.value?.id == null) {
        return props.workspaces
      }
      const installedIds = installGroups.value
        .get(installPackage.value.id)
        ?.workspaces
        .map(item => item.workspace?.id)
      return props.workspaces.filter(item => !installedIds?.includes(String(item.id)))
    })

    function onInstall(record: PluginCardRecord, scope?: number): void {
      if (record.id == null) {
        return
      }
      installPackage.value = record
      installScope.value = scope
      installOpen.value = true
    }

    function renderInstallButton(record: PluginCardRecord) {
      return (
        <Button
          size="small"
          type="primary"
          onClick={() => onInstall(record)}
          v-slots={{icon: () => <DownloadOutlined />}}
        >
          {locale.value.install}
        </Button>
      )
    }

    function renderUninstallButton(record: PluginCardRecord, click: boolean) {
      return (
        <Button
          size="small"
          danger
          type="primary"
          onClick={click ? () => onUninstall(record, []) : undefined}
          v-slots={{icon: () => <DeleteOutlined />}}
        >
          {locale.value.uninstall}
        </Button>
      )
    }

    function renderAction(record: PluginCardRecord) {
      const group = record.id == null ? undefined : installGroups.value.get(record.id)
      if (group == null) {
        return renderInstallButton(record)
      }
      if (group.enterprise != null) {
        return (
          <Button
            size="small"
            danger
            type="primary"
            disabled={!isOrgOwner.value}
            onClick={() => onUninstall(record, [])}
            v-slots={{icon: () => <DeleteOutlined />}}
          >
            {locale.value.uninstall}
          </Button>
        )
      }
      if (group.userAll != null) {
        return renderUninstallButton(record, true)
      }
      return (
        <Popover
          trigger="hover"
          placement="bottomRight"
          content={() => (
            <PluginWorkspaceCheckList
              workspaces={group.workspaces.map(item => item.workspace!)}
              conversationWorkspaces={props.workspaces}
              showAddButton={props.workspaces.length > group.workspaces.length}
              onUninstall={(selected) => onUninstall(record, selected)}
              onAddWorkspace={() => onInstall(record, AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.SPECIFIED)}
            />
          )}
        >
          {renderUninstallButton(record, false)}
        </Popover>
      )
    }

    function renderCard(record: PluginCardRecord) {
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
            targetType={props.targetType}
            packageId={installPackage.value?.id}
            packageName={installPackage.value?.name}
            workspaces={modalWorkspaces.value}
            scope={installScope.value}
            onUpdate:open={(open: boolean) => installOpen.value = open}
            onInstalled={(result: UserPluginInstallResult) => emit('installed', result)}
          />
        </div>
      )
    }
  },
})

export default PluginCard

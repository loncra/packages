import {computed, defineComponent, type PropType, reactive, ref, toRef} from 'vue'
import {Alert, Card, Empty, Flex, Pagination, Space, Tag, Typography} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames, ICON_SELECT_AVATAR_MODE_VALUE, IconSelect} from '@loncra/antdv'
import type {TotalPage} from '@loncra/client/commons'
import {type PluginInstallGroup, type UserPluginInstallResult, type UserPluginMetadata} from '@loncra/client/ai'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import {useLocale} from '../../_util/useLocale'
import PluginInstallModal, {type PluginInstallForm} from './PluginInstallModal'
import {PLUGIN_INSTALL_SCOPE_OPTION} from './constants'
import {usePluginInstallActions, type WorkspaceMeta} from './usePluginInstallActions'
import PluginCardAction from './PluginCardAction'
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
    const {installGroups, isOrgOwner, onUninstall} = usePluginInstallActions({
      targetType: props.targetType,
      installs: toRef(props, 'installs'),
      self: toRef(props, 'self'),
      onInstalled: (result: UserPluginInstallResult) => emit('installed', result),
      onUninstalled: (event: UserPluginMetadata) => emit('uninstalled', event),
    })
    const installForm = reactive<PluginInstallForm>({
      scopeOption: 'all',
      workspaces: [],
      metadata: {},
    })

    function onInstall(record: PluginCardRecord): void {
      if (record.id == null) {
        return
      }
      installPackage.value = record
      installForm.scopeOption = PLUGIN_INSTALL_SCOPE_OPTION.ALL
      installForm.workspaces = []
      installForm.metadata = {}
      installOpen.value = true
    }

    function onManage(record: PluginCardRecord, group?: PluginInstallGroup): void {
      if (record.id == null || group == null) {
        return
      }
      const row = group.enterprise ?? group.userAll ?? group.workspaces[0]
      installPackage.value = record
      installForm.scopeOption = group.enterprise != null
        ? PLUGIN_INSTALL_SCOPE_OPTION.ENTERPRISE
        : group.userAll != null ? PLUGIN_INSTALL_SCOPE_OPTION.ALL : PLUGIN_INSTALL_SCOPE_OPTION.SPECIFIED
      installForm.workspaces = group.workspaces
        .filter((item) => item.workspace?.id != null)
        .map((item) => String(item.workspace!.id))
      installForm.metadata = {...(row?.metadata as {metadata?: Record<string, unknown>} | undefined)?.metadata ?? {}}
      installOpen.value = true
    }

    function renderAction(record: PluginCardRecord) {
      return (
        <PluginCardAction
          record={record}
          installs={props.installs}
          workspaces={props.workspaces}
          self={props.self}
          targetType={props.targetType}
          onInstall={() => onInstall(record)}
          onManage={(group?: PluginInstallGroup) => onManage(record, group)}
          onUninstall={(selected: WorkspaceMeta[]) => onUninstall(record, selected)}
        />
      )
    }

    function renderCard(record: PluginCardRecord) {
      const group = record.id == null ? undefined : installGroups.value.get(record.id)
      const showEnterpriseAlert = group?.enterprise != null && !isOrgOwner.value
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
            targetType={props.targetType}
            record={installPackage.value}
            workspaces={props.workspaces}
            form={installForm}
            enterpriseOption={isOrgOwner.value}
            onUpdate:open={(open: boolean) => installOpen.value = open}
            onInstalled={(result: UserPluginInstallResult) => emit('installed', result)}
            v-slots={{
              afterScope: (ctx: Record<string, unknown>) => slots.afterModalScope?.(ctx),
              workspaceItemExtra: (ctx: Record<string, unknown>) => slots.workspaceItemExtra?.(ctx),
            }}
          />
        </div>
      )
    }
  },
})

export default PluginCard

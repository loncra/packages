import {computed, defineComponent, h, type PropType, ref} from 'vue'
import {Button, Card, Empty, Flex, Pagination, Space, Tag, Typography} from 'antdv-next'
import {createFromIconfontCN} from '@antdv-next/icons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import useApp from 'antdv-next/dist/app/useApp'
import {classNames, IconSelect, ICON_SELECT_AVATAR_MODE_VALUE} from '@loncra/antdv'
import {fillLocale} from '@loncra/antdv'
import type {TotalPage} from '@loncra/client/commons'
import {
  AiUserPluginInstallService,
  type PluginPackageMetadata,
  type UserPluginInstallResult,
} from '@loncra/client/ai'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import {useLocale} from '../../_util/useLocale'
import PluginInstallModal from './PluginInstallModal'
import type {AgentConversationRecord} from '../conversation/useAgentConversations'
import useStyle, {AGENT_HUB_PREFIX} from './style'

dayjs.extend(relativeTime)

const IconFont = createFromIconfontCN()

export type PluginCardRecord = PluginPackageMetadata & {latestVersion?: string}

const PluginCard = defineComponent({
  name: 'LAgentHubPluginCard',
  props: {
    dataSource: {type: Object as PropType<TotalPage<PluginCardRecord>>, required: true},
    installs: {type: Array as PropType<UserPluginInstallResult[]>, default: () => []},
    targetType: {type: Number, required: true},
    workspaces: {type: Array as PropType<AgentConversationRecord[]>, default: () => []},
  },
  emits: ['changePage', 'installed', 'uninstalled'],
  setup(props, {emit, slots}) {
    const locale = useLocale('AgentHub')
    const {modal, message} = useApp()
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('agent-hub', AGENT_HUB_PREFIX))
    const [hashId, cssVarCls] = useStyle(prefixCls)
    const installOpen = ref(false)
    const installPackage = ref<PluginCardRecord>()
    const installByPackageId = computed(() =>
      AiUserPluginInstallService.mapInstallsByPackageId(props.installs, props.targetType),
    )

    function isInstalled(record: PluginCardRecord): boolean {
      return record.id != null && installByPackageId.value.has(record.id)
    }

    function onInstall(record: PluginCardRecord): void {
      if (record.id == null) {
        return
      }
      installPackage.value = record
      installOpen.value = true
    }

    async function doUninstall(id: number): Promise<void> {
      const result = await AiUserPluginInstallService.uninstall(id)
      message.success(result.message)
      emit('uninstalled', id)
    }

    function onUninstall(record: PluginCardRecord): void {
      const install = record.id == null ? undefined : installByPackageId.value.get(record.id)
      if (install?.id == null) {
        return
      }
      modal.confirm({
        title: locale.value.uninstallConfirmTitle,
        content: fillLocale(locale.value.uninstallConfirmSingle, {name: record.name}),
        onOk: () => doUninstall(install.id as number),
      })
    }

    return () => {
      const rootClass = classNames(prefixCls.value, hashId.value, cssVarCls.value)
      const elements = props.dataSource.elements || []
      const cls = (name: string) => `${prefixCls.value}-${name}`
      return (
        <div class={rootClass}>
          {elements.length > 0
            ? (
              <Flex vertical class={cls('scroll')} gap="large">
                {elements.map((record) => (
                  <Card
                    key={record.id}
                    size="small"
                    v-slots={{
                      title: () => slots.title?.({record}),
                      extra: () => isInstalled(record)
                        ? (
                          <Button
                            size="small"
                            danger
                            type="primary"
                            onClick={() => onUninstall(record)}
                            v-slots={{icon: () => <IconFont type="loncra-trash-2" />}}
                          >
                            {locale.value.uninstall}
                          </Button>
                        )
                        : (
                          <Button
                            size="small"
                            type="primary"
                            onClick={() => onInstall(record)}
                            v-slots={{icon: () => <IconFont type="loncra-download" />}}
                          >
                            {locale.value.install}
                          </Button>
                        ),
                    }}
                  >
                    <Flex gap="middle" vertical >
                      <Flex gap="middle">
                        <IconSelect
                          preview
                          value={record.icon || ICON_SELECT_AVATAR_MODE_VALUE.INPUT + record.name}
                          iconRender={(type: string) => (type ? h(IconFont, {type}) : null)}
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
                ))}
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
            : (
              <Flex class={cls('empty')} justify="center" align="center">
                <Empty />
              </Flex>
            )}
          <PluginInstallModal
            open={installOpen.value}
            targetType={props.targetType}
            packageId={installPackage.value?.id}
            packageName={installPackage.value?.name}
            workspaces={props.workspaces}
            onUpdate:open={(open: boolean) => {
              installOpen.value = open
            }}
            onInstalled={(result: UserPluginInstallResult) => emit('installed', result)}
          />
        </div>
      )
    }
  },
})

export default PluginCard

import {computed, defineComponent, type PropType, ref, type SlotsType, type VNode, watch} from 'vue'
import {
    Badge,
    Button,
    Checkbox,
    Empty,
    Flex,
    FormItem,
    Modal,
    type RadioChangeEvent,
    RadioGroup,
    Spin,
    Switch,
    Tabs,
    Typography
} from 'antdv-next'
import {
    CloseOutlined,
    CloudServerOutlined,
    DeleteOutlined,
    DownloadOutlined,
    FolderOpenOutlined,
    FolderOutlined,
    SettingOutlined,
    ShopOutlined
} from '@antdv-next/icons'
import useApp from 'antdv-next/dist/app/useApp'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {Form as LForm} from '@loncra/antdv-pro'
import {AuthServerService} from '@loncra/client/auth'
import {getEnumValue} from '@loncra/client/commons'
import {
    AGENT_WORKSPACE_TYPE_VALUE,
    AgentHubService,
    AI_SERVER_EXECUTION_CHANNEL,
    AI_SERVER_PLUGIN_INSTALL_STATUS,
    AI_SERVER_PLUGIN_INSTALL_USER_SCOPE,
    AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE,
    type ExecutionChannel,
    type PluginInstallGroup,
    type UserPluginInstallResult,
    type UserPluginRequestBody,
} from '@loncra/client/ai'
import {classNames, fillLocale} from '@loncra/antdv'
import type {AgentConversationRecord} from '../conversation'
import {isDefaultWorkspace} from '../conversation/useAgentConversations'
import {useLocale} from '../../_util/useLocale'
import type {WorkspaceMeta} from './usePluginInstallActions'
import {hasInstallForScope, isUpgradePending, scopeGroup} from './usePluginInstallActions'
import useStyle, {AGENT_HUB_PREFIX} from './style'
import type {PluginCardRecord, WorkspaceScopeOption} from './types'
import type {Self} from '../types'

export interface PluginInstallForm extends Pick<UserPluginRequestBody, 'metadata'> {
  workspaceScope: WorkspaceScopeOption
  ownership: number
  workspaces: string[]
  workspaceVersions?: Record<string, string>
}

type FooterAction = 'install' | 'save'

const PluginInstallModal = defineComponent({
  name: 'LAgentHubPluginInstall',
  props: {
    open: {type: Boolean, required: true},
    targetType: {type: String, required: true},
    record: {type: Object as PropType<PluginCardRecord>, default: undefined},
    form: {type: Object as PropType<PluginInstallForm>, default: {
      workspaceScope: AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.ALL,
      ownership: AI_SERVER_PLUGIN_INSTALL_USER_SCOPE.USER,
      workspaces: [],
      metadata: {},
    }},
    workspaces: {type: Array as PropType<AgentConversationRecord[]>, default: () => []},
    installs: {type: Array as PropType<UserPluginInstallResult[]>, default: () => []},
    self: {type: Object as PropType<Self>, default: undefined},
    ownershipSelectable: {type: Boolean, default: false},
    group: {type: Object as PropType<PluginInstallGroup>, default: undefined},
    ownershipLocked: {type: Number, default: undefined},
  },
  emits: {
    'update:open': (_open: boolean) => true,
    installed: (_result: UserPluginInstallResult) => true,
    ownershipChange: (_ownership: number) => true,
    statusChange: (_row: UserPluginInstallResult, _checked: boolean) => true,
    uninstall: (_scope: number, _selected: WorkspaceMeta[]) => true,
  },
  slots: Object as SlotsType<{
    afterScope?: (ctx: {form: PluginInstallForm; record: PluginCardRecord | undefined; group: PluginInstallGroup | undefined; submit: () => Promise<void>}) => unknown
    workspaceItemExtra?: (ctx: {workspace: AgentConversationRecord; index: number; record: PluginCardRecord | undefined; form: PluginInstallForm; group: PluginInstallGroup | undefined}) => unknown
  }>,
  setup(props, {emit, slots}) {
    const locale = useLocale('AgentHub')
    const {message} = useApp()
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('agent-hub', AGENT_HUB_PREFIX))
    const [hashId] = useStyle(prefixCls)
    const formRef = ref<{validate: () => Promise<unknown>}>()
    const spinning = ref(false)
    const form = props.form
    const showOwnershipRadio = computed(() =>
      props.group == null && props.ownershipSelectable,
    )
    const scopedGroup = computed(() => scopeGroup(props.group, form.ownership))
    const scopedRow = computed(() => scopedGroup.value?.userAll ?? scopedGroup.value?.enterprise)
    const scopedSelected = computed(() => (scopedGroup.value?.workspaces ?? [])
      .map((item) => item.workspace)
      .filter((item): item is WorkspaceMeta => item != null))
    const statusChecked = computed(() => {
      const row = scopedRow.value
      return row != null && getEnumValue(row.status) === AI_SERVER_PLUGIN_INSTALL_STATUS.ACTIVATED
    })
    const statusLoading = ref(false)
    watch(() => props.installs, () => {
      statusLoading.value = false
    })
    const showPersonalTab = computed(() =>
      hasInstallForScope(props.group, AI_SERVER_PLUGIN_INSTALL_USER_SCOPE.USER),
    )
    const showEnterpriseTab = computed(() =>
      AuthServerService.isEnterpriseOwner(props.self)
      && hasInstallForScope(props.group, AI_SERVER_PLUGIN_INSTALL_USER_SCOPE.ENTERPRISE),
    )
    const workspaceRecords = computed(() =>
      props.workspaces
        .filter((item) => item.id != null && AGENT_WORKSPACE_TYPE_VALUE.includes(getEnumValue(item.type)))
        .filter((item) => (getEnumValue(item.ownership) ?? AI_SERVER_PLUGIN_INSTALL_USER_SCOPE.USER) === form.ownership),
    )
    const workspaceOptions = computed(() =>
      workspaceRecords.value.map((item) => ({
        label: item.name,
        value: item.id as string,
      })),
    )
    const scopeOptions = computed(() => {
      const options: {value: WorkspaceScopeOption, label: string}[] = [
        {value: AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.ALL, label: locale.value.workspaceScopeAll},
      ]
      if (workspaceRecords.value.length > 0) {
        options.push({value: AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.SPECIFIED, label: locale.value.workspaceScopeSpecific})
      }
      return options
    })
    watch(() => form.ownership, () => {
      if (workspaceRecords.value.length === 0
        && form.workspaceScope !== AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.ALL) {
        form.workspaceScope = AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.ALL
      }
    })
    const ownershipOptions = computed(() => [
      {value: AI_SERVER_PLUGIN_INSTALL_USER_SCOPE.USER, label: locale.value.ownershipPersonal},
      {value: AI_SERVER_PLUGIN_INSTALL_USER_SCOPE.ENTERPRISE, label: locale.value.ownershipEnterprise},
    ])

    function pendingOfScope(ownership: number): boolean {
      return props.record != null && isUpgradePending(scopeGroup(props.group, ownership), props.record)
    }

    const ownershipTabs = computed(() => {
      const tabs: {key: string, label: string, icon: VNode}[] = []
      if (showPersonalTab.value) {
        tabs.push({
          key: String(AI_SERVER_PLUGIN_INSTALL_USER_SCOPE.USER),
          label: locale.value.ownershipPersonal,
          icon: <CloudServerOutlined />,
        })
      }
      if (showEnterpriseTab.value) {
        tabs.push({
          key: String(AI_SERVER_PLUGIN_INSTALL_USER_SCOPE.ENTERPRISE),
          label: locale.value.ownershipEnterprise,
          icon: <ShopOutlined />,
        })
      }
      return tabs.map((item) => ({
        ...item,
        label: (
          <Badge dot={pendingOfScope(Number(item.key))} offset={[4, 0]}>
            <span>{item.label}</span>
          </Badge>
        ),
      }))
    })

    const footerAction = computed<FooterAction>(() =>
      props.group == null ? 'install' : 'save',
    )

    const FOOTER_BUTTON: Record<FooterAction, {labelKey: keyof typeof locale.value; icon: typeof DownloadOutlined}> = {
      install: {labelKey: 'install', icon: DownloadOutlined},
      save: {labelKey: 'save', icon: SettingOutlined},
    }

    function channelOfWorkspace(id: string): ExecutionChannel {
      const workspace = props.workspaces.find(item => item.id === id)
      const kind = getEnumValue(workspace?.metadata?.kind)
      return kind === AI_SERVER_EXECUTION_CHANNEL.CLIENT
        ? AI_SERVER_EXECUTION_CHANNEL.CLIENT
        : AI_SERVER_EXECUTION_CHANNEL.CLOUD
    }

    function toggleWorkspace(id: string, checked: boolean): void {
      form.workspaces = checked
        ? [...form.workspaces, id]
        : form.workspaces.filter((item) => item !== id)
    }

    function onOwnershipChange(value: number): void {
      form.ownership = value
      form.workspaces = []
    }

    function onTabChange(key: string | number): void {
      const ownership = Number(key)
      if (ownership === form.ownership) {
        return
      }
      emit('ownershipChange', ownership)
    }

    function close(): void {
      emit('update:open', false)
    }

    async function validateWorkspaces(): Promise<void> {
      if (form.workspaceScope !== AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.SPECIFIED) {
        return
      }
      if (form.workspaces.length > 0) {
        return
      }
      return Promise.reject(locale.value.workspaceRequired)
    }

    function installBody(): UserPluginRequestBody {
      const body: UserPluginRequestBody = {
        targetType: props.targetType,
        packageId: props.record!.id!,
        scope: form.ownership,
        workspaceScope: form.workspaceScope,
      }
      if (form.workspaceScope === AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.SPECIFIED) {
        body.workspaces = form.workspaces.map(id => {
          const releaseVersion = form.workspaceVersions?.[id]
          return {
            id,
            value: channelOfWorkspace(id),
            metadata: releaseVersion == null ? undefined : {releaseVersion},
          }
        })
      }
      body.metadata = {...form.metadata}
      return body
    }

    async function onOk(): Promise<void> {
      await formRef.value?.validate()
      if (props.record?.id == null) {
        return Promise.reject(new Error('record.id is required'))
      }
      spinning.value = true
      try {
        const results = await AgentHubService.install(installBody())
        message.success(results.message)
        for (const item of results.data ?? []) {
          emit('installed', item)
        }
        close()
      } finally {
        spinning.value = false
      }
    }

    function renderFooter(): unknown {
      const spec = FOOTER_BUTTON[footerAction.value]
      const Icon = spec.icon
      return (
        <Flex justify="flex-end" gap="small" class={`${config.value.getPrefixCls('modal-footer')}`}>
          <Button
            type="primary"
            loading={spinning.value}
            onClick={() => void onOk()}
            v-slots={{icon: () => <Icon/>}}
          >
            {locale.value[spec.labelKey]}
          </Button>
          <Button
              type="primary"
              danger
              disabled={spinning.value}
              onClick={close}
              v-slots={{icon: () => <CloseOutlined/>}}
          >
            {locale.value.cancel}
          </Button>
        </Flex>
      )
    }

    function renderFormBody(): unknown {
      return (
        <>
          {showOwnershipRadio.value
            ? (
              <FormItem
                  name="ownership"
                  label={locale.value.ownership}
                  layout="horizontal"
                  labelAlign="left"
                  labelCol={{flex: 'auto'}}
                  wrapperCol={{flex: 'auto'}}
              >
                <Flex justify="flex-end">
                  <RadioGroup
                    value={form.ownership}
                    options={ownershipOptions.value}
                    onChange={(e: RadioChangeEvent) => onOwnershipChange(e.target.value as number)}
                  />
                </Flex>
              </FormItem>
            )
            : null}
          <FormItem
              name="workspaceScope"
              label={locale.value.workspaceScope}
              layout="horizontal"
              labelAlign="left"
              labelCol={{flex: 'auto'}}
              wrapperCol={{flex: 'auto'}}
          >
            <Flex justify="flex-end">
              <RadioGroup
                value={form.workspaceScope}
                options={scopeOptions.value}
                onChange={(e: RadioChangeEvent) => {
                  form.workspaceScope = e.target.value as WorkspaceScopeOption
                  if (form.workspaceScope !== AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.SPECIFIED) {
                    form.workspaces = []
                  }
                }}
              />
            </Flex>
          </FormItem>
          {scopedRow.value != null
            ? (
              <FormItem
                  name="status"
                  label={locale.value.status}
                  layout="horizontal"
                  labelAlign="left"
                  labelCol={{flex: 'auto'}}
                  wrapperCol={{flex: 'auto'}}
              >
                <Flex justify="flex-end">
                  <Switch
                    checked-children={locale.value.enable}
                    un-checked-children={locale.value.disable}
                    checked={statusChecked.value}
                    loading={statusLoading.value}
                    onChange={(checked: boolean) => {
                      statusLoading.value = true
                      emit('statusChange', scopedRow.value!, checked)
                    }}
                  />
                </Flex>
              </FormItem>
            )
            : null}
          {props.group != null && (scopedRow.value != null || scopedSelected.value.length > 0)
            ? (
              <FormItem
                  name="uninstall"
                  label={locale.value.uninstallPlugin}
                  layout="horizontal"
                  labelAlign="left"
                  labelCol={{flex: 'auto'}}
                  wrapperCol={{flex: 'auto'}}
              >
                <Flex justify="flex-end">
                  <Button
                    danger
                    size="small"
                    onClick={() => emit('uninstall', form.ownership, scopedSelected.value)}
                    v-slots={{icon: () => <DeleteOutlined/>}}
                  >
                    {locale.value.uninstall}
                  </Button>
                </Flex>
              </FormItem>
            )
            : null}
          {form.workspaceScope === AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.SPECIFIED
            ? (
              <FormItem
                name="workspaces"
                label={locale.value.workspace}
                rules={[{validator: validateWorkspaces, trigger: 'change', required: true}]}
              >
                {workspaceOptions.value.length > 0
                  ? (
                    <Flex vertical gap="small">
                      {workspaceOptions.value.map((option, index) => {
                        const item = workspaceRecords.value[index]
                        if (item == null) {
                          return null
                        }
                        const Icon = isDefaultWorkspace(getEnumValue(item.type)) ? FolderOpenOutlined : FolderOutlined
                        return (
                          <Flex key={option.value} align="center" gap="small">
                            <Flex align="center" class={classNames(hashId.value, `${prefixCls.value}-install-main`)}>
                              <Checkbox
                                class={classNames(hashId.value, `${prefixCls.value}-install-checkbox`)}
                                checked={form.workspaces.includes(option.value)}
                                onChange={(e: { target: { checked: boolean } }) => toggleWorkspace(option.value, e.target.checked)}
                              >
                                <Flex align="center" gap="small" class={classNames(hashId.value, `${prefixCls.value}-install-label`)}>
                                  <Icon
                                    class={classNames(
                                      hashId.value,
                                      item.tone ? `${prefixCls.value}-${item.tone}` : undefined,
                                    )}
                                  />
                                  <Typography.Text ellipsis>{item.name}</Typography.Text>
                                </Flex>
                              </Checkbox>
                            </Flex>
                            {slots.workspaceItemExtra?.({workspace: item, index, record: props.record, form, group: props.group})}
                          </Flex>
                        )
                      })}
                    </Flex>
                  )
                  : <Empty description={locale.value.workspaceEmpty} />}
              </FormItem>
            )
            : null}
          {slots.afterScope?.({form, record: props.record, group: props.group, submit: () => onOk()})}
        </>
      )
    }

    return () => (
      <Modal
        open={props.open}
        title={fillLocale(locale.value.installTitle, {name: props.record?.name ?? ''})}
        footer={null}
        mask={{closable:false}}
        destroyOnHidden
        onCancel={close}
      >
        <Spin spinning={spinning.value}>
          <LForm ref={formRef} model={form} colon={false}>
            {props.group != null
              ? (
                <Tabs
                  activeKey={String(form.ownership)}
                  size="small"
                  items={ownershipTabs.value}
                  onUpdate:activeKey={onTabChange}
                  v-slots={{contentRender: () => renderFormBody()}}
                />
              )
              : renderFormBody()}
            {renderFooter()}
          </LForm>
        </Spin>
      </Modal>
    )
  },
})

export default PluginInstallModal

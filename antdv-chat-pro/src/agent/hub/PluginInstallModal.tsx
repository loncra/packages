import {computed, defineComponent, type PropType, ref, type SlotsType} from 'vue'
import {Checkbox, Empty, Flex, FormItem, Modal, RadioGroup, Typography} from 'antdv-next'
import {FolderOpenOutlined, FolderOutlined} from '@antdv-next/icons'
import useApp from 'antdv-next/dist/app/useApp'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {Form as LForm} from '@loncra/antdv-pro'
import {getEnumValue} from '@loncra/client/commons'
import {
    AGENT_WORKSPACE_TYPE_VALUE,
    AgentHubService,
    AI_SERVER_EXECUTION_CHANNEL,
    AI_SERVER_PLUGIN_INSTALL_USER_SCOPE,
    AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE,
    type ExecutionChannel,
    type UserPluginInstallResult,
    type UserPluginRequestBody,
} from '@loncra/client/ai'
import {classNames, fillLocale} from '@loncra/antdv'
import type {AgentConversationRecord} from '../conversation'
import {isDefaultWorkspace} from '../conversation/useAgentConversations'
import {useLocale} from '../../_util/useLocale'
import useStyle, {AGENT_HUB_PREFIX} from './style'
import type {PluginCardRecord, ScopeOption} from './types'

export interface PluginInstallForm extends Pick<UserPluginRequestBody, 'metadata'> {
  scopeOption: ScopeOption
  workspaces: string[]
}

const PluginInstallModal = defineComponent({
  name: 'LAgentHubPluginInstall',
  props: {
    open: {type: Boolean, required: true},
    targetType: {type: String, required: true},
    record: {type: Object as PropType<PluginCardRecord>, default: undefined},
    form: {type: Object as PropType<PluginInstallForm>, default: {
      scopeOption: 'all',
      workspaces: [],
      metadata: {},
    }},
    workspaces: {type: Array as PropType<AgentConversationRecord[]>, default: () => []},
    enterpriseOption: {type: Boolean, default: false},
  },
  emits: {
    'update:open': (_open: boolean) => true,
    installed: (_result: UserPluginInstallResult) => true,
  },
  slots: Object as SlotsType<{
    afterScope?: (ctx: {form: PluginInstallForm; record: PluginCardRecord | undefined}) => unknown
    workspaceItemExtra?: (ctx: {workspace: AgentConversationRecord; index: number; record: PluginCardRecord | undefined}) => unknown
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
    const workspaceRecords = computed(() =>
      props.workspaces
        .filter((item) => item.id != null && AGENT_WORKSPACE_TYPE_VALUE.includes(getEnumValue(item.type))),
    )
    const workspaceOptions = computed(() =>
      workspaceRecords.value.map((item) => ({
        label: item.name,
        value: item.id as string,
      })),
    )
    const scopeOptions = computed(() => {
      const options: {value: ScopeOption; label: string}[] = [
        {value: 'all', label: locale.value.workspaceScopeAll},
      ]
      if (props.enterpriseOption) {
        options.push({value: 'enterprise', label: locale.value.workspaceScopeEnterprise})
      }
      options.push({value: 'specified', label: locale.value.workspaceScopeSpecific})
      return options
    })

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

    function close(): void {
      emit('update:open', false)
    }

    async function validateWorkspaces(): Promise<void> {
      if (form.scopeOption !== 'specified') {
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
        workspaceScope: AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.ALL,
      }
      if (form.scopeOption === 'enterprise') {
        body.scope = AI_SERVER_PLUGIN_INSTALL_USER_SCOPE.ENTERPRISE
      } else if (form.scopeOption === 'specified') {
        body.workspaceScope = AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.SPECIFIED
        body.workspaces = form.workspaces.map(id => ({id, value: channelOfWorkspace(id)}))
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

    return () => (
      <Modal
        open={props.open}
        title={fillLocale(locale.value.installTitle, {name: props.record?.name ?? ''})}
        okText={locale.value.install}
        confirmLoading={spinning.value}
        mask={{closable:false}}
        destroyOnHidden
        onOk={onOk}
        onCancel={close}
      >
        <LForm ref={formRef} model={form}>
          <FormItem name="scopeOption" label={locale.value.workspaceScope} >
            <RadioGroup v-model:value={form.scopeOption} options={scopeOptions.value} />
          </FormItem>
          {form.scopeOption === 'specified'
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
                            {slots.workspaceItemExtra?.({workspace: item, index, record: props.record})}
                          </Flex>
                        )
                      })}
                    </Flex>
                  )
                  : <Empty description={locale.value.workspaceEmpty} />}
              </FormItem>
            )
            : null}
          {slots.afterScope?.({form, record: props.record})}
        </LForm>
      </Modal>
    )
  },
})

export default PluginInstallModal

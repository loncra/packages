import {computed, defineComponent, type PropType, reactive, ref, watch} from 'vue'
import {CheckboxGroup, Empty, Flex, FormItem, Modal, RadioGroup} from 'antdv-next'
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

type ScopeOption = 'all' | 'enterprise' | 'specified'

const PluginInstallModal = defineComponent({
  name: 'LAgentHubPluginInstall',
  props: {
    open: {type: Boolean, required: true},
    targetType: {type: String, required: true},
    packageId: Number,
    packageName: String,
    workspaces: {type: Array as PropType<AgentConversationRecord[]>, default: () => []},
    scope: {type: Number, default: undefined},
    enterpriseOption: {type: Boolean, default: false},
  },
  emits: {
    'update:open': (_open: boolean) => true,
    installed: (_result: UserPluginInstallResult) => true,
  },
  setup(props, {emit}) {
    const locale = useLocale('AgentHub')
    const {message} = useApp()
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('agent-hub', AGENT_HUB_PREFIX))
    const [hashId] = useStyle(prefixCls)
    const formRef = ref<{validate: () => Promise<unknown>}>()
    const spinning = ref(false)
    const form = reactive({
      scopeOption: 'all' as ScopeOption,
      workspaces: [] as string[],
    })
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

    watch(() => props.open, (open) => {
      if (!open) {
        return
      }
      form.scopeOption = props.scope != null ? 'specified' : 'all'
      form.workspaces = []
    })

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
        packageId: props.packageId!,
        workspaceScope: AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.ALL,
      }
      if (form.scopeOption === 'enterprise') {
        body.scope = AI_SERVER_PLUGIN_INSTALL_USER_SCOPE.ENTERPRISE
      } else if (form.scopeOption === 'specified') {
        body.workspaceScope = AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.SPECIFIED
        body.workspaces = form.workspaces.map(id => ({id, value: channelOfWorkspace(id)}))
      }
      return body
    }

    async function onOk(): Promise<void> {
      await formRef.value?.validate()
      if (props.packageId == null) {
        return Promise.reject(new Error('packageId is required'))
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
        title={fillLocale(locale.value.installTitle, {name: props.packageName ?? ''})}
        okText={locale.value.install}
        confirmLoading={spinning.value}
        maskClosable={false}
        destroyOnHidden
        onOk={onOk}
        onCancel={close}
      >
        <LForm ref={formRef} model={form}>
          {props.scope == null
            ? (
              <FormItem name="scopeOption" label={locale.value.workspaceScope} rules={[{required: true}]}>
                <RadioGroup v-model:value={form.scopeOption} options={scopeOptions.value} />
              </FormItem>
            )
            : null}
          {form.scopeOption === 'specified'
            ? (
              <FormItem
                name="workspaces"
                label={locale.value.workspace}
                rules={[{validator: validateWorkspaces, trigger: 'change'}]}
              >
                {workspaceOptions.value.length > 0
                  ? (
                    <CheckboxGroup
                      v-model:value={form.workspaces}
                      options={workspaceOptions.value}
                      v-slots={{
                        labelRender: ({index}: {item: unknown; index: number}) => {
                          const item = workspaceRecords.value[index]
                          if (!item) {
                            return null
                          }
                          const Icon = isDefaultWorkspace(getEnumValue(item.type)) ? FolderOpenOutlined : FolderOutlined
                          return (
                            <Flex align="center" gap="small">
                              <Icon
                                class={classNames(
                                  hashId.value,
                                  item.tone ? `${prefixCls.value}-${item.tone}` : undefined,
                                )}
                              />
                              <span>{item.name}</span>
                            </Flex>
                          )
                        },
                      }}
                    />
                  )
                  : <Empty description={locale.value.workspaceEmpty} />}
              </FormItem>
            )
            : null}
        </LForm>
      </Modal>
    )
  },
})

export default PluginInstallModal

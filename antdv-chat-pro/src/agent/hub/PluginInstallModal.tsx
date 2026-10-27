import {computed, defineComponent, type PropType, reactive, ref, watch} from 'vue'
import {CheckboxGroup, Empty, FormItem, Modal, RadioGroup} from 'antdv-next'
import useApp from 'antdv-next/dist/app/useApp'
import {Form as LForm} from '@loncra/antdv-pro'
import {getEnumValue} from '@loncra/client/commons'
import {
  AGENT_WORKSPACE_TYPE_VALUE,
  AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE,
  AiUserPluginInstallService,
  type UserPluginInstallResult,
} from '@loncra/client/ai'
import type {AgentConversationRecord} from '../conversation'
import {useLocale} from '../../_util/useLocale'
import {fillLocale} from '@loncra/antdv'

const PluginInstallModal = defineComponent({
  name: 'LAgentHubPluginInstall',
  props: {
    open: {type: Boolean, required: true},
    targetType: {type: Number, required: true},
    packageId: Number,
    packageName: String,
    workspaces: {type: Array as PropType<AgentConversationRecord[]>, default: () => []},
  },
  emits: {
    'update:open': (_open: boolean) => true,
    installed: (_result: UserPluginInstallResult) => true,
  },
  setup(props, {emit}) {
    const locale = useLocale('AgentHub')
    const {message} = useApp()
    const formRef = ref<{validate: () => Promise<unknown>}>()
    const spinning = ref(false)
    const form = reactive({
      workspaceScope: AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.USER as number,
      agentConversationIds: [] as number[],
    })
    const workspaceOptions = computed(() =>
      props.workspaces
        .filter((item) => item.id != null && AGENT_WORKSPACE_TYPE_VALUE.includes(getEnumValue(item.type)))
        .map((item) => ({
          label: item.name,
          value: item.id as number,
        })),
    )
    const scopeOptions = computed(() => [
      {value: AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.USER, label: locale.value.workspaceScopeAll},
      {value: AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.ORG, label: locale.value.workspaceScopeSpecific},
    ])

    watch(() => props.open, (open) => {
      if (!open) {
        return
      }
      form.workspaceScope = AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.USER
      form.agentConversationIds = []
    })

    function close(): void {
      emit('update:open', false)
    }

    async function validateWorkspaces(): Promise<void> {
      if (form.workspaceScope !== AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.ORG) {
        return
      }
      if (form.agentConversationIds.length > 0) {
        return
      }
      return Promise.reject(locale.value.workspaceRequired)
    }

    async function onOk(): Promise<void> {
      await formRef.value?.validate()
      if (props.packageId == null) {
        return Promise.reject(new Error('packageId is required'))
      }
      spinning.value = true
      try {
        const result = await AiUserPluginInstallService.install({
          targetType: props.targetType,
          packageId: props.packageId,
          workspaceScope: form.workspaceScope,
          agentConversationIds: form.workspaceScope === AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.ORG
            ? form.agentConversationIds
            : undefined,
        })
        message.success(result.message)
        if (result.data) {
          emit('installed', result.data)
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
          <FormItem name="workspaceScope" label={locale.value.workspaceScope} rules={[{required: true}]}>
            <RadioGroup v-model:value={form.workspaceScope} options={scopeOptions.value} />
          </FormItem>
          {form.workspaceScope === AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.ORG
            ? (
              <FormItem
                name="agentConversationIds"
                label={locale.value.workspace}
                rules={[{validator: validateWorkspaces, trigger: 'change'}]}
              >
                {workspaceOptions.value.length > 0
                  ? (
                    <CheckboxGroup
                      v-model:value={form.agentConversationIds}
                      options={workspaceOptions.value}
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

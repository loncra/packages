import {computed, defineComponent, h, type PropType} from 'vue'
import {Divider, Segmented} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '@loncra/antdv'
import type {UserPluginInstallResult, UserPluginMetadata} from '@loncra/client/ai'
import type {AgentConversationRecord} from '../conversation'
import type {Self} from '../types'
import useStyle, {AGENT_HUB_PREFIX} from './style'
import type {PluginOverride} from "./types.ts";
import {useAgentHub} from "./useAgentHub.ts";

const AgentHub = defineComponent({
  name: 'LAgentHub',
  props: {
    installs: {type: Array as PropType<UserPluginInstallResult[]>, default: () => []},
    workspaces: {type: Array as PropType<AgentConversationRecord[]>, default: () => []},
    self: {type: Object as PropType<Self>, required: true},
    plugins:{type: Array as PropType<PluginOverride[]>, default: () => []},
  },
  emits: {
    installed: (_result: UserPluginInstallResult) => true,
    uninstalled: (_event: UserPluginMetadata) => true,
  },
  setup(props, {emit}) {
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('agent-hub', AGENT_HUB_PREFIX))
    const [hashId, cssVarCls] = useStyle(prefixCls)
    const {
      options,
      section,
      active,
    } = useAgentHub({
      overrides: props.plugins,
      installs: () => props.installs,
      workspaces: () => props.workspaces,
      self: () => props.self,
      handlers: {
        onInstalled: (result: UserPluginInstallResult) => emit('installed', result),
        onUninstalled: (event: UserPluginMetadata) => emit('uninstalled', event),
      },
    })

    return () => {
      const rootClass = classNames(prefixCls.value, hashId.value, cssVarCls.value)
      const cls = (name: string) => `${prefixCls.value}-${name}`
      return (
        <div class={rootClass}>
          <div class={cls('switch')}>
            <Segmented
              value={section.value}
              shape="round"
              options={options.value}
              onChange={(value) => {
                section.value = String(value)
              }}
            />
          </div>
          <Divider class={cls('divider')} />
          <div class={cls('body')}>
            {active.value?.component ? h(active.value.component, active.value.props()) : null}
          </div>
        </div>
      )
    }
  },
})

export default AgentHub

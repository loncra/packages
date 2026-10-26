import {computed, defineComponent, h, type PropType, ref} from 'vue'
import {Divider, Segmented} from 'antdv-next'
import {ApiOutlined, AppstoreOutlined, ThunderboltOutlined} from '@antdv-next/icons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '@loncra/antdv'
import type {UserPluginInstallResult} from '@loncra/client/ai'
import {useLocale} from '../../_util/useLocale'
import type {AgentConversationRecord} from '../conversation'
import McpMarket from './McpMarket'
import SkillMarket from './SkillMarket'
import InstalledPlugins from './InstalledPlugins'
import useStyle, {AGENT_HUB_PREFIX} from './style'

const AgentHub = defineComponent({
  name: 'LAgentHub',
  props: {
    installs: {type: Array as PropType<UserPluginInstallResult[]>, default: () => []},
    workspaces: {type: Array as PropType<AgentConversationRecord[]>, default: () => []},
  },
  emits: ['installed', 'uninstalled'],
  setup(props, {emit}) {
    const locale = useLocale('AgentHub')
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('agent-hub', AGENT_HUB_PREFIX))
    const [hashId, cssVarCls] = useStyle(prefixCls)
    const section = ref<'mcp' | 'skill' | 'installed'>('mcp')
    const options = computed(() => [
      {value: 'mcp', label: locale.value.mcp, icon: h(ApiOutlined)},
      {value: 'skill', label: locale.value.skill, icon: h(ThunderboltOutlined)},
      {value: 'installed', label: locale.value.myPlugin, icon: h(AppstoreOutlined)},
    ])

    return () => {
      const rootClass = classNames(prefixCls.value, hashId.value, cssVarCls.value)
      const cls = (name: string) => `${prefixCls.value}-${name}`
      const marketProps = {
        installs: props.installs,
        workspaces: props.workspaces,
        onInstalled: (result: UserPluginInstallResult) => emit('installed', result),
        onUninstalled: (id: number) => emit('uninstalled', id),
      }
      return (
        <div class={rootClass}>
          <div class={cls('switch')}>
            <Segmented
              value={section.value}
              shape="round"
              options={options.value}
              onChange={(value) => {
                const next = String(value)
                section.value = next === 'skill' || next === 'installed' ? next : 'mcp'
              }}
            />
          </div>
          <Divider class={cls('divider')} />
          <div class={cls('body')}>
            {section.value === 'skill'
              ? <SkillMarket {...marketProps} />
              : section.value === 'installed'
                ? <InstalledPlugins {...marketProps} />
                : <McpMarket {...marketProps} />}
          </div>
        </div>
      )
    }
  },
})

export default AgentHub

import {computed, defineComponent, type PropType, ref} from 'vue'
import {Button, Checkbox, Flex, SpaceCompact} from 'antdv-next'
import {DeleteOutlined, FolderOpenOutlined, FolderOutlined, PlusOutlined} from '@antdv-next/icons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '@loncra/antdv'
import {getEnumValue} from '@loncra/client/commons'
import {useLocale} from '../../_util/useLocale'
import {isDefaultWorkspace} from '../conversation/useAgentConversations'
import type {AgentConversationRecord} from '../conversation'
import type {WorkspaceMeta} from './usePluginInstallActions'
import useStyle, {AGENT_HUB_PREFIX} from './style'

const PluginWorkspaceCheckList = defineComponent({
  name: 'LAgentHubWorkspaceCheckList',
  props: {
    workspaces: {type: Array as PropType<WorkspaceMeta[]>, required: true},
    conversationWorkspaces: {type: Array as PropType<AgentConversationRecord[]>, default: () => []},
    showAddButton: {type: Boolean, default: false},
  },
  emits: {
    uninstall: (_selected: WorkspaceMeta[]) => true,
    addWorkspace: () => true,
  },
  setup(props, {emit}) {
    const locale = useLocale('AgentHub')
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('agent-hub', AGENT_HUB_PREFIX))
    const [hashId] = useStyle(prefixCls)
    const checked = ref<WorkspaceMeta[]>([])
    const selected = computed(() =>
      checked.value.filter(ws => props.workspaces.some(item => item.id === ws.id)),
    )

    function toggle(workspace: WorkspaceMeta, value: boolean): void {
      checked.value = value
        ? [...checked.value, workspace]
        : checked.value.filter(item => item.id !== workspace.id)
    }

    return () => {
      const cls = (name: string) => `${prefixCls.value}-${name}`
      const rows = props.workspaces.map((workspace) => {
        const workspaceRecord = props.conversationWorkspaces.find(item => String(item.id) === workspace.id)
        const Icon = workspaceRecord && isDefaultWorkspace(getEnumValue(workspaceRecord.type))
          ? FolderOpenOutlined
          : FolderOutlined
        return (
          <Flex key={workspace.id} align="center" gap="small" class={cls('popover-row')}>
            <Checkbox
              checked={selected.value.some(item => item.id === workspace.id)}
              onChange={(e: {target: {checked: boolean}}) => toggle(workspace, e.target.checked)}
            />
            <Icon
              class={classNames(
                hashId.value,
                workspaceRecord?.tone ? `${prefixCls.value}-${workspaceRecord.tone}` : undefined,
              )}
            />
            <span>{workspace.name}</span>
          </Flex>
        )
      })
      return (
        <Flex vertical gap="small">
          {rows}
          <SpaceCompact block>
            <Button
              size="small"
              type="primary"
              danger
              disabled={selected.value.length === 0}
              onClick={() => {
                emit('uninstall', selected.value)
                checked.value = []
              }}
              v-slots={{icon: () => <DeleteOutlined />}}
            >
              {locale.value.uninstallSelected}
            </Button>
            {props.showAddButton
              ? (
                <Button
                  size="small"
                  type="primary"
                  onClick={() => emit('addWorkspace')}
                  v-slots={{icon: () => <PlusOutlined />}}
                >
                  {locale.value.addWorkspace}
                </Button>
              )
              : null}
          </SpaceCompact>
        </Flex>
      )
    }
  },
})

export default PluginWorkspaceCheckList

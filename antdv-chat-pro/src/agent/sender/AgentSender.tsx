import {computed, defineComponent, h, type PropType, ref, type VNodeChild} from 'vue'
import {Button, Dropdown, Menu, Tag} from 'antdv-next'
import type {MenuInfo, MenuItemType} from 'antdv-next'
import {
  ApiOutlined,
  createFromIconfontCN,
  PlusOutlined,
  ProfileOutlined,
  QuestionCircleOutlined,
  RobotOutlined,
} from '@antdv-next/icons'
import {isEnumValue} from '@loncra/client/commons'
import {AI_SERVER_AGENT_CHAT_TYPE} from '@loncra/client/ai'
import {SenderHeader} from '@antdv-next/x'
import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import type {DraftRestoreResult} from '@loncra/chat-core'
import {classNames} from '@loncra/antdv'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import DraftSender, {type DraftBinding, type DraftSenderExpose} from '../../draft-sender'
import {
  type InstructionItem,
  type InstructionSenderHandle,
  type InstructionSenderProps,
} from '@loncra/antdv-chat'
import useStyle from './style'

export interface AgentSenderWorkspace {
  title: string
  color?: string
  variant?: 'outlined' | 'filled' | 'solid'
  icon?: () => VNodeChild
}

export interface AgentSenderChoice {
  label?: string
  color?: string
  icon?: string | null
  items: MenuItemType[]
  selectedKeys: string[]
}

const IconFont = createFromIconfontCN()

function chatTypeIcon(key: string | undefined) {
  const type = Number(key)
  if (isEnumValue(type, AI_SERVER_AGENT_CHAT_TYPE.ASK)) {
    return QuestionCircleOutlined
  }
  if (isEnumValue(type, AI_SERVER_AGENT_CHAT_TYPE.PLAN)) {
    return ProfileOutlined
  }
  return RobotOutlined
}

export interface AgentSenderExpose {
  flush: () => Promise<void>
  clearStored: () => Promise<void>
  clear: () => void
  getSlotConfigValue: () => SlotConfigType[]
  getSender: () => InstructionSenderHandle | undefined
}

const AgentSender = defineComponent({
  name: 'LAgentSender',
  inheritAttrs: false,
  props: {
    binding: {type: Object as PropType<DraftBinding<any>>, required: true},
    readLive: {type: Function as PropType<() => unknown>, required: true},
    slotsOf: {type: Function as PropType<(live: unknown) => SlotConfigType[]>, required: true},
    onRestore: {
      type: Function as PropType<(result: DraftRestoreResult<unknown, SlotConfigType[]>) => void>,
      required: true,
    },
    saveSource: {default: undefined},
    onFilterDataSource: {
      type: Function as PropType<InstructionSenderProps['onFilterDataSource']>,
      required: true,
    },
    senderInsertInstruction: {
      type: Function as PropType<InstructionSenderProps['senderInsertInstruction']>,
      required: true,
    },
    createInstructionSlot: {
      type: Function as PropType<InstructionSenderProps['createInstructionSlot']>,
      required: true,
    },
    slotConfig: Array as PropType<SlotConfigType[]>,
    placeholder: String,
    instructionMap: Object as PropType<Record<string, InstructionItem[]>>,
    isRunning: {type: Boolean, default: false},
    workspace: Object as PropType<AgentSenderWorkspace>,
    catalogPrefix: String,
    toCatalogMenuItems: Function as PropType<(items: InstructionItem[]) => MenuItemType[]>,
    onCatalogClick: Function as PropType<
      (key: string | number, pick: (item: InstructionItem) => void) => void
    >,
    plusItems: {type: Array as PropType<MenuItemType[]>, default: () => []},
    onPlusClick: Function as PropType<(key: string | number) => void>,
    model: Object as PropType<AgentSenderChoice>,
    typeChoice: Object as PropType<AgentSenderChoice>,
    onModelClick: Function as PropType<(key: string | number) => void>,
    onTypeClick: Function as PropType<(key: string | number) => void>,
    prefixCls: String,
    rootClass: String,
  },
  emits: {
    pasteFile: (_fileList: FileList) => true,
    submit: (_value: string, _slotConfig?: SlotConfigType[]) => true,
    change: (_value: string, _event?: Event, _slotConfig?: SlotConfigType[]) => true,
    cancel: () => true,
  },
  setup(props, {attrs, slots, emit, expose}) {
    const draftRef = ref<DraftSenderExpose>()
    const config = useConfig()
    const prefixCls = computed(() =>
      config.value.getPrefixCls('agent-sender', props.prefixCls ?? 'loncra-agent-sender'),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)

    function slashSelectedKeys(items: InstructionItem[], activeIndex: number): string[] {
      const item = items[activeIndex]
      const group = item?.metadata?.group
      if (!item?.id || typeof group !== 'string' || !group) {
        return []
      }
      return [group + ':' + item.id]
    }

    expose({
      flush: () => draftRef.value?.flush() ?? Promise.resolve(),
      clearStored: () => draftRef.value?.clearStored() ?? Promise.resolve(),
      clear: () => draftRef.value?.clear(),
      getSlotConfigValue: () => draftRef.value?.getSlotConfigValue() ?? [],
      getSender: () => draftRef.value?.getSender(),
    })

    return () => {
      const catalogClass = classNames(
        prefixCls.value,
        hashId.value,
        cssVarCls.value,
        props.rootClass,
        `${prefixCls.value}-catalog`,
      )
      const plusDisabled = props.plusItems.length === 0 || props.isRunning
      const workspace = props.workspace
      return (
        <DraftSender
          {...attrs}
          ref={draftRef}
          binding={props.binding}
          readLive={props.readLive}
          slotsOf={props.slotsOf}
          onRestore={props.onRestore}
          saveSource={props.saveSource}
          slotConfig={props.slotConfig}
          placeholder={props.placeholder}
          instructionMap={props.instructionMap}
          onFilterDataSource={props.onFilterDataSource}
          senderInsertInstruction={props.senderInsertInstruction}
          createInstructionSlot={props.createInstructionSlot}
          onPasteFile={(fileList: FileList) => emit('pasteFile', fileList)}
          onSubmit={(value: string, slotConfig?: SlotConfigType[]) => emit('submit', value, slotConfig)}
          onChange={(value: string, event?: Event, slotConfig?: SlotConfigType[]) =>
            emit('change', value, event, slotConfig)
          }
          onCancel={() => emit('cancel')}
          v-slots={{
            header: workspace
              ? () => (
                  <SenderHeader title=" " closable={false} open>
                    {{
                      title: () => (
                        <Tag
                          color={workspace.color}
                          variant={workspace.variant}
                          v-slots={workspace.icon ? {icon: workspace.icon} : undefined}
                        >
                          {workspace.title}
                        </Tag>
                      ),
                    }}
                  </SenderHeader>
                )
              : slots.header,
            instructionListRender: props.catalogPrefix
              ? (slotProps: {
                  items: InstructionItem[]
                  prefix: string
                  activeIndex: number
                  pick: (item: InstructionItem) => void
                }) => {
                  if (slotProps.prefix !== props.catalogPrefix || !props.toCatalogMenuItems) {
                    return slots.instructionListRender?.(slotProps)
                  }
                  return (
                    <Menu
                      class={catalogClass}
                      items={props.toCatalogMenuItems(slotProps.items)}
                      selectable={false}
                      selectedKeys={slashSelectedKeys(slotProps.items, slotProps.activeIndex)}
                      onClick={(info: MenuInfo) => props.onCatalogClick?.(info.key, slotProps.pick)}
                    />
                  )
                }
              : slots.instructionListRender,
            defaultButton: ({
              components,
            }: {
              components: {
                ClearButton: new () => { $props: {disabled?: boolean; onClick?: () => void} }
                LoadingButton: new () => { $props: {disabled?: boolean; type?: string} }
                SendButton: new () => { $props: {disabled?: boolean; type?: string} }
              }
            }) => [
              props.isRunning
                ? h(components.ClearButton, {
                    disabled: false,
                    onClick: () => draftRef.value?.clear(),
                  })
                : null,
              h(props.isRunning ? components.LoadingButton : components.SendButton, {
                disabled: false,
                type: 'primary',
              }),
            ],
            leftExtra: () => [
              <Dropdown
                menu={{items: props.plusItems}}
                trigger={['click']}
                disabled={plusDisabled}
                placement="topLeft"
                onMenuClick={(info: MenuInfo) => props.onPlusClick?.(info.key)}
              >
                <Button
                  shape="circle"
                  size="small"
                  disabled={plusDisabled}
                  v-slots={{icon: () => <PlusOutlined />}}
                />
              </Dropdown>,
              props.model ? (
                <Dropdown
                  menu={{
                    selectable: true,
                    items: props.model.items,
                    selectedKeys: props.model.selectedKeys,
                  }}
                  onMenuClick={(info: MenuInfo) => props.onModelClick?.(info.key)}
                >
                  <Button
                    color="primary"
                    variant="outlined"
                    size="small"
                    v-slots={{
                      icon: () => props.model?.icon
                        ? <IconFont type={props.model.icon} />
                        : <ApiOutlined />,
                    }}
                  >
                    {props.model.label}
                  </Button>
                </Dropdown>
              ) : null,
              props.typeChoice ? (
                <Dropdown
                  menu={{
                    selectable: true,
                    items: props.typeChoice.items,
                    selectedKeys: props.typeChoice.selectedKeys,
                  }}
                  onMenuClick={(info: MenuInfo) => props.onTypeClick?.(info.key)}
                >
                  <Button
                    color={props.typeChoice.color as 'default'}
                    variant="dashed"
                    type="text"
                    size="small"
                    v-slots={{
                      icon: () => {
                        const TypeIcon = chatTypeIcon(props.typeChoice?.selectedKeys[0])
                        return <TypeIcon />
                      },
                    }}
                  >
                    {props.typeChoice.label}
                  </Button>
                </Dropdown>
              ) : null,
              slots.leftExtra?.(),
            ],
            rightExtra: slots.rightExtra ? () => slots.rightExtra?.() : undefined,
            instructionItemRender: slots.instructionItemRender,
          }}
        />
      )
    }
  },
})

export default AgentSender

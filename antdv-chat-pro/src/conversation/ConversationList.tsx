import {computed, defineComponent, type PropType} from 'vue'
import type {ItemType} from 'antdv-next/dist/menu/interface'
import type {RenderItem} from 'antdv-next/dist/menu/menu'
import {Button, Dropdown, Empty, Flex, Menu, Spin, theme, Typography} from 'antdv-next'
import {EllipsisOutlined} from '@antdv-next/icons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '@loncra/antdv'
import type {ConversationNode} from './types.ts'
import useStyle, {CONVERSATION_LIST_PREFIX} from './style/index.ts'

function stopRowAction(event: MouseEvent) {
  event.stopPropagation()
  event.preventDefault()
}

function stopRowBubble(event: MouseEvent) {
  event.stopPropagation()
}

function asNode(item: RenderItem): ConversationNode {
  return {
    key: String(item.key),
    name: String(item.name ?? item.label ?? ''),
    timeText: typeof item.timeText === 'string' ? item.timeText : undefined,
    editing: item.editing === true,
    children: Array.isArray(item.children) ? item.children as ConversationNode[] : undefined,
  }
}

function toMenuItem(node: ConversationNode): ItemType {
  return {
    ...node,
    key: node.key,
    label: node.name,
    children: node.children?.map(toMenuItem),
  } as ItemType
}

const ConversationList = defineComponent({
  name: 'LConversationList',
  inheritAttrs: false,
  props: {
    items: {type: Array as PropType<ConversationNode[]>, required: true},
    selectedKeys: {type: Array as PropType<string[]>, required: true},
    openKeys: {type: Array as PropType<string[]>, required: true},
    loading: {type: Boolean, default: false},
    actionsVisible: {type: Boolean, default: true},
  },
  emits: ['update:selectedKeys', 'update:openKeys', 'active'],
  setup(props, {emit, slots, attrs}) {
    const config = useConfig()
    const {token} = theme.useToken()
    const prefixCls = computed(() => config.value.getPrefixCls('conversation-list', CONVERSATION_LIST_PREFIX))
    const [hashId, cssVarCls] = useStyle(prefixCls)

    function renderLabel(node: ConversationNode) {
      if (node.editing) {
        return (
          <div onClick={stopRowBubble} onMousedown={stopRowBubble}>
            {slots.editor?.(node)}
          </div>
        )
      }
      return (
        <Flex vertical>
          <div class={`${prefixCls.value}-line`}>
            <Typography.Text class={`${prefixCls.value}-name`} ellipsis>
              {node.name}
            </Typography.Text>
            <span class={`${prefixCls.value}-side`}>
              {node.timeText
                ? (
                  <Typography.Text type="secondary" class={`${prefixCls.value}-time`}>
                    {node.timeText}
                  </Typography.Text>
                )
                : null}
              {props.actionsVisible
                ? (
                  <span
                    class={`${prefixCls.value}-actions`}
                    onClick={stopRowAction}
                    onMousedown={stopRowAction}
                  >
                    <Dropdown
                      popupRender={() => (
                        <div onClick={stopRowAction} onMousedown={stopRowAction}>
                          {slots.actions?.(node)}
                        </div>
                      )}
                    >
                      <Button
                        type="text"
                        size="small"
                        onClick={stopRowAction}
                        v-slots={{icon: () => <EllipsisOutlined />}}
                      />
                    </Dropdown>
                  </span>
                )
                : null}
            </span>
          </div>
          {slots.subtitle
            ? <div class={`${prefixCls.value}-subtitle`}>{slots.subtitle(node)}</div>
            : null}
        </Flex>
      )
    }

    return () => {
      const {class: attrClass, style: attrStyle, ...rest} = attrs
      const itemClass = `${prefixCls.value}-item`
      const itemContentClass = `${prefixCls.value}-item-content`
      return (
        <Flex
          {...rest}
          vertical
          class={classNames(prefixCls.value, hashId.value, cssVarCls.value, attrClass)}
          style={attrStyle as never}
        >
          {slots.header?.()}
          <div class={`${prefixCls.value}-body`}>
            {props.items.length === 0
              ? (
                <Flex justify="center" align="center" class={`${prefixCls.value}-empty`}>
                  <Empty />
                </Flex>
              )
              : (
                <Spin spinning={props.loading} class={`${prefixCls.value}-full-spin`}>
                  <Menu
                    mode="inline"
                    inlineIndent={token.value.paddingSM}
                    items={props.items.map(toMenuItem)}
                    selectedKeys={props.selectedKeys}
                    openKeys={props.openKeys}
                    onUpdate:selectedKeys={(keys: string[]) => emit('update:selectedKeys', keys)}
                    onUpdate:openKeys={(keys: string[]) => emit('update:openKeys', keys)}
                    onClick={(info: {key: string | number}) => emit('active', String(info.key))}
                    rootClass={`${prefixCls.value}-menu`}
                    classes={{
                      item: itemClass,
                      itemContent: itemContentClass,
                      subMenu: {
                        item: itemClass,
                        itemContent: itemContentClass,
                      },
                    }}
                    iconRender={(item: RenderItem) => {
                      const node = asNode(item)
                      return node.editing ? null : slots.icon?.(node)
                    }}
                    labelRender={(item: RenderItem) => renderLabel(asNode(item))}
                  />
                </Spin>
              )}
          </div>
        </Flex>
      )
    }
  },
})

export default ConversationList

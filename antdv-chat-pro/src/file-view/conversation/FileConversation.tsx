import {computed, defineComponent, h, type PropType, ref, type VNodeChild} from 'vue'
import {Flex, Menu, TypographyText} from 'antdv-next'
import type {MenuItemType} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {LoadingOutlined, ProfileOutlined, ReloadOutlined} from '@antdv-next/icons'
import {classNames} from '@loncra/antdv'
import {ActionButton, type ResolvedAction} from '@loncra/antdv-pro'
import type {ConversationNode} from '../../conversation'
import ConversationList from '../../conversation'
import {useLocale} from '../../_util/useLocale'
import {hasSlotContent} from '../_util/slotContent'
import type {FileConversationProps, FileViewNode} from '../types'
import useStyle from './style'

const FileConversation = defineComponent({
  name: 'LFileConversation',
  inheritAttrs: false,
  props: {
    model: {
      type: Object as PropType<FileConversationProps['model']>,
      required: true,
    },
    name: String,
    toolbarActions: Array as PropType<FileConversationProps['toolbarActions']>,
    menuItems: Function as PropType<FileConversationProps['menuItems']>,
    title: Function as PropType<FileConversationProps['title']>,
  },
  setup(props, {expose}) {
    const config = useConfig()
    const locale = useLocale('FileView')
    const listRef = ref<{revealItem: (key: string) => void}>()
    const prefixCls = computed(() =>
      config.value.getPrefixCls('file-conversation', 'loncra-file-conversation'),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)

    expose({
      revealItem(key: string) {
        void listRef.value?.revealItem(key)
      },
    })

    return () => {
      const hashed = (...names: (string | undefined)[]) =>
        classNames(hashId.value, cssVarCls.value, ...names)
      const {state, resolveIcon, setOpenKeys, toggleNode, reload} = props.model
      const titles = new Map<string, VNodeChild>()
      const lookup = new Map<string, FileViewNode>()

      const toNode = (item: FileViewNode): ConversationNode => {
        lookup.set(item.id, item)
        const custom = props.title?.(item)
        if (hasSlotContent(custom)) {
          titles.set(item.id, custom)
        }
        const children = item.children ?? []
        return {
          key: item.id,
          name: item.name,
          editing: titles.has(item.id),
          children: children.length > 0 ? children.map(toNode) : undefined,
        }
      }

      const actions: ResolvedAction[] = [
        {
          id: 'refresh',
          label: locale.value.refresh,
          icon: h(ReloadOutlined),
          disabled: false,
          loading: state.value.loading,
          run: () => props.model.reload(null),
        },
        ...(props.toolbarActions ?? []),
      ]

      return (
        <ConversationList
          ref={listRef}
          class={hashed(`${prefixCls.value}-side`)}
          items={state.value.dataSource.map(toNode)}
          selectedKeys={state.value.selected ? [state.value.selected.id] : []}
          openKeys={state.value.openKeys}
          loading={state.value.loading}
          actionsVisible
          onUpdate:openKeys={setOpenKeys}
          onActive={(key: string) => {
            const item = lookup.get(key)
            if (item) {
              void toggleNode(item)
            }
          }}
          v-slots={{
            header: () => (
              <Flex
                gap="small"
                justify="space-between"
                align="center"
                class={hashed(`${prefixCls.value}-toolbar`)}
              >
                <Flex flex="1" gap="small" align="center">
                  {h(ProfileOutlined)}
                  <TypographyText ellipsis>
                    {props.name || locale.value.untitled}
                  </TypographyText>
                </Flex>
                <ActionButton type="text" size="small" actions={actions} />
              </Flex>
            ),
            icon: (node: ConversationNode) => {
              const item = lookup.get(node.key)
              if (!item) {
                return null
              }
              return item.loading
                ? h(LoadingOutlined, {class: hashed(`${prefixCls.value}-icon-spin`)})
                : resolveIcon(item)
            },
            editor: (node: ConversationNode) => titles.get(node.key),
            actions: (node: ConversationNode) => {
              const item = lookup.get(node.key)
              if (!item) {
                return null
              }
              const items: MenuItemType[] = []
              const handlers = new Map<string, () => void>()
              if (item.dir) {
                items.push({
                  key: 'refresh',
                  label: locale.value.refresh,
                  icon: () => h(ReloadOutlined),
                })
                handlers.set('refresh', () => {
                  void reload(item)
                })
              }
              const extraItems = props.menuItems?.(item)
              for (const extra of Array.isArray(extraItems) ? extraItems : []) {
                if (!extra) {
                  continue
                }
                const {onClick, ...itemRest} = extra as MenuItemType & {
                  onClick?: () => void
                }
                items.push(itemRest)
                if (onClick) {
                  handlers.set(String(extra.key), onClick)
                }
              }
              if (items.length === 0) {
                return null
              }
              return (
                <Menu
                  items={items}
                  onClick={(info: {key: string | number}) => handlers.get(String(info.key))?.()}
                />
              )
            },
          }}
        />
      )
    }
  },
})

export default FileConversation

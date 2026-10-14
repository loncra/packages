import {computed, defineComponent, h, type PropType} from 'vue'
import {Button, Empty, Flex, Input, Menu, SpaceCompact, TypographyText,} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {
    CheckOutlined,
    CloseOutlined,
    FileAddOutlined,
    FolderAddOutlined,
    LoadingOutlined,
    ProfileOutlined,
    ReloadOutlined,
} from '@antdv-next/icons'
import {classNames} from '@loncra/antdv'
import {ActionButton, type ResolvedAction} from '@loncra/antdv-pro'
import type {ConversationNode} from '../../conversation'
import ConversationList from '../../conversation'
import type {EditObjectItemInfo} from '../types'
import type {useFileEditor} from '../useFileEditor'
import useStyle from './style'

const FileConversation = defineComponent({
  name: 'LFileConversation',
  inheritAttrs: false,
  props: {
    editor: {
      type: Object as PropType<ReturnType<typeof useFileEditor>>,
      required: true,
    },
    name: String,
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const config = useConfig()
    const prefixCls = computed(() =>
      config.value.getPrefixCls('file-conversation', 'loncra-file-conversation'),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)
    return () => {
      const {
        locale,
        resolveIcon,
        createMenu,
        setOpenKeys,
        onMenuClick,
        confirmEdit,
        cancelEdit,
        onRefresh,
        onRootUpload,
        getDisplayName,
        state,
      } = props.editor
      const hashed = (...names: (string | undefined)[]) =>
        classNames(hashId.value, cssVarCls.value, ...names)

      const lookup = new Map<string, EditObjectItemInfo>()
      const toNode = (item: EditObjectItemInfo): ConversationNode => {
        const children = (item.children ?? []) as EditObjectItemInfo[]
        lookup.set(item.id, item)
        return {
          key: item.id,
          name: getDisplayName(item),
          editing:
            state.value.currentEditItem?.id === item.id &&
            state.value.currentEditItem?.editing === true,
          children: children.length > 0 ? children.map(toNode) : undefined,
        }
      }
      const nodes = (state.value.dataSource as EditObjectItemInfo[]).map(toNode)

      const actions: ResolvedAction[] = [
        {
          id: 'refresh',
          label: locale.value.refresh,
          icon: h(ReloadOutlined),
          disabled: false,
          loading: state.value.loading,
          run: onRefresh,
        },
      ]
      if (!props.readonly) {
        actions.push(
          {
            id: 'uploadFile',
            label: locale.value.uploadFile,
            icon: h(FileAddOutlined),
            disabled: false,
            run: () => onRootUpload(false),
          },
          {
            id: 'uploadDirectory',
            label: locale.value.uploadDirectory,
            icon: h(FolderAddOutlined),
            disabled: false,
            run: () => onRootUpload(true),
          },
        )
      }

      return (
        <ConversationList
          class={hashed(`${prefixCls.value}-side`)}
          items={nodes}
          selectedKeys={state.value.selectedItem ? [state.value.selectedItem.id] : []}
          openKeys={state.value.openKeys}
          loading={state.value.loading}
          actionsVisible={!props.readonly}
          onUpdate:openKeys={setOpenKeys}
          onActive={(key: string) => {
            const item = lookup.get(key)
            if (item) {
              void onMenuClick(item)
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
            editor: (node: ConversationNode) => {
              const item = lookup.get(node.key)
              if (!item) {
                return null
              }
              return (
                <SpaceCompact size="small" block>
                  <Input
                    value={item.editName}
                    onUpdate:value={(value: string) => {
                      item.editName = value
                    }}
                    onPressEnter={() => {
                      void confirmEdit(item)
                    }}
                  />
                  <Button
                    type="primary"
                    onClick={() => {
                      void confirmEdit(item)
                    }}
                  >
                    {{icon: () => h(CheckOutlined)}}
                  </Button>
                  <Button
                    type="primary"
                    danger
                    onClick={() => {
                      cancelEdit(item)
                    }}
                  >
                    {{icon: () => h(CloseOutlined)}}
                  </Button>
                </SpaceCompact>
              )
            },
            actions: (node: ConversationNode) => {
              const item = lookup.get(node.key)
              if (!item) {
                return null
              }
              return <Menu {...createMenu(item)} />
            },
            empty: () => (
              <Flex justify="center" align="center">
                <Empty />
              </Flex>
            ),
          }}
        />
      )
    }
  },
})

export default FileConversation

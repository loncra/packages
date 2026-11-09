import {computed, defineComponent, h, type PropType} from 'vue'
import {Badge, Button, Empty, Flex, SpaceCompact, Tabs, Tooltip, TypographyText} from 'antdv-next'
import {AimOutlined, CloseOutlined, DownloadOutlined} from '@antdv-next/icons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '@loncra/antdv'
import {useLocale} from '../../_util/useLocale'
import FilePaneRenderer from '../FilePaneRenderer'
import {hasSlotContent} from '../_util/slotContent'
import type {FileTabsProps, FileViewNode} from '../types'
import useStyle from './style'

const FileTabs = defineComponent({
  name: 'LFileTabs',
  inheritAttrs: false,
  props: {
    model: {
      type: Object as PropType<FileTabsProps['model']>,
      required: true,
    },
    locate: {
      type: Function as PropType<FileTabsProps['locate']>,
      required: true,
    },
    dirty: Function as PropType<FileTabsProps['dirty']>,
    onDownload: Function as PropType<FileTabsProps['onDownload']>,
    open: {
      type: Function as PropType<FileTabsProps['open']>,
      required: true,
    },
    tabExtra: Function as PropType<FileTabsProps['tabExtra']>,
    pane: Function as PropType<FileTabsProps['pane']>,
  },
  setup(props) {
    const config = useConfig()
    const locale = useLocale('FileView')
    const prefixCls = computed(() =>
      config.value.getPrefixCls('file-tabs', 'loncra-file-tabs'),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)

    return () => {
      const hashed = (...names: (string | undefined)[]) =>
        classNames(hashId.value, cssVarCls.value, ...names)
      const {state, resolveIcon, activateTab, requestCloseTab} = props.model
      if (state.value.tabs.length === 0) {
        return (
          <Flex class={hashed(`${prefixCls.value}-tabs`)} align="center" justify="center">
            <Empty />
          </Flex>
        )
      }
      const selected = state.value.selected
      const extra = selected ? props.tabExtra?.(selected) : null
      return (
        <Flex vertical class={hashed(`${prefixCls.value}-tabs`)}>
          <Tabs
            hideAdd
            size="small"
            destroyOnHidden={false}
            activeKey={selected?.id}
            items={state.value.tabs.map((file) => ({
              key: file.id,
              label: file.name,
              file,
            }))}
            classes={{
              root: hashed(`${prefixCls.value}-tabs-root`),
              body: hashed(`${prefixCls.value}-tabs-body`),
              content: hashed(`${prefixCls.value}-tabs-content`),
              item: hashed(`${prefixCls.value}-tab-item`),
              header: hashed(`${prefixCls.value}-tab-header`),
            }}
            onChange={(key) => activateTab(String(key))}
            v-slots={{
              labelRender: ({item}: {item: {key: string; label: string; file: FileViewNode}}) => (
                <Flex align="center" gap="small" class={hashed(`${prefixCls.value}-tab-label`)}>
                  <Badge dot={props.dirty?.(item.file) === true} offset={[0, 0]}>
                    {resolveIcon(item.file)}
                  </Badge>
                  <TypographyText
                    class={hashed(`${prefixCls.value}-grow`)}
                    ellipsis={{tooltip: {title: item.label, mouseEnterDelay: 1}}}
                  >
                    {item.label}
                  </TypographyText>
                  <Button
                    type="text"
                    size="small"
                    class={hashed(`${prefixCls.value}-tab-close`)}
                    {...({
                      onClick: (event: Event) => {
                        event.stopPropagation()
                        void requestCloseTab(item.key)
                      },
                      onMousedown: (event: Event) => event.stopPropagation(),
                    } as Record<string, unknown>)}
                  >
                    {{icon: () => h(CloseOutlined)}}
                  </Button>
                </Flex>
              ),
              contentRender: ({item}: {item: {key: string; file?: FileViewNode}}) => {
                if (!item.file) {
                  return null
                }
                const custom = props.pane?.(item.file)
                if (hasSlotContent(custom)) {
                  return custom
                }
                return (
                  <FilePaneRenderer
                    key={item.key}
                    node={item.file}
                    open={() => props.open(item.file as FileViewNode)}
                  />
                )
              },
              rightExtra: () => (
                selected ? (
                  <SpaceCompact size="small">
                    {hasSlotContent(extra) ? extra : null}
                    <Tooltip title={locale.value.download}>
                      <Button size="small" onClick={() => props.onDownload?.(selected)}>
                        {{icon: () => h(DownloadOutlined)}}
                      </Button>
                    </Tooltip>
                    <Tooltip title={locale.value.locate}>
                      <Button size="small" onClick={() => props.locate(selected.id)}>
                        {{icon: () => h(AimOutlined)}}
                      </Button>
                    </Tooltip>
                  </SpaceCompact>
                ) : null
              ),
            }}
          />
        </Flex>
      )
    }
  },
})

export default FileTabs

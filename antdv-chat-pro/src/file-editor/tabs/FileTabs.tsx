import {defineComponent, h, type PropType} from 'vue'
import {
    Badge,
    Button,
    Empty,
    Flex,
    SpaceCompact,
    Tabs,
    Tooltip,
    TypographyText,
} from 'antdv-next'
import {
    AimOutlined,
    CloseOutlined,
    DownloadOutlined,
    SaveOutlined,
} from '@antdv-next/icons'
import {classNames} from '@loncra/antdv'
import type {ObjectItemInfo} from '@loncra/client/resource'
import FilePaneHost from '../FilePaneHost'
import type {useFileEditor} from '../useFileEditor'

const FileTabs = defineComponent({
  name: 'LFileTabs',
  inheritAttrs: false,
  props: {
    editor: {
      type: Object as PropType<ReturnType<typeof useFileEditor>>,
      required: true,
    },
    prefixCls: {
      type: String,
      required: true,
    },
    hashId: String,
    cssVarCls: String,
    bucket: {
      type: String,
      required: true,
    },
    rootPath: {
      type: String,
      required: true,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    return () => {
      const {
        locale,
        resolveIcon,
        tabItems,
        tabMeta,
        activateTab,
        onCloseTab,
        onPaneDirtyChange,
        paneHostRef,
        saveActive,
        activeCanSave,
        onSelectOpenFile,
        onDownloadFile,
        state,
      } = props.editor
      const hashed = (...names: (string | undefined)[]) =>
        classNames(props.hashId, props.cssVarCls, ...names)

      return state.value.tabs.length ? (
        <Flex vertical class={hashed(`${props.prefixCls}-tabs`)}>
          <Tabs
            hideAdd
            size="small"
            destroyOnHidden={false}
            activeKey={state.value.selectedItem?.id}
            items={tabItems.value}
            classes={{
              root: hashed(`${props.prefixCls}-tabs-root`),
              body: hashed(`${props.prefixCls}-tabs-body`),
              content: hashed(`${props.prefixCls}-tabs-content`),
              item: hashed(`${props.prefixCls}-tab-item`),
              header: hashed(`${props.prefixCls}-tab-header`),
            }}
            onChange={activateTab}
            v-slots={{
              labelRender: ({
                item,
              }: {
                item: {key: string; label: string; file: ObjectItemInfo}
              }) => (
                <Flex
                  align="center"
                  gap="small"
                  class={hashed(`${props.prefixCls}-tab-label`)}
                >
                  {/*
                    图标**在这里画**（要套 `Badge` 的"未保存"圆点）—— 不能交给 `items[].icon`：
                    `@v-c/tabs` 的 `TabNode` 会把那份再画一遍 ⇒ 两个图标（见 `useFileEditor` 的 `tabItems`）
                  */}
                  <Badge dot={tabMeta[item.key]?.dirty} offset={[0, 0]}>
                    {resolveIcon(item.file)}
                  </Badge>
                  <TypographyText
                    class={hashed(`${props.prefixCls}-grow`)}
                    ellipsis={{
                      tooltip: {title: item.label, mouseEnterDelay: 1},
                    }}
                  >
                    {item.label}
                  </TypographyText>
                  <Button
                    type="text"
                    size="small"
                    class={hashed(`${props.prefixCls}-tab-close`)}
                    {...({
                      onClick: (e: Event) => {
                        e.stopPropagation()
                        onCloseTab(item.key)
                      },
                      onMousedown: (e: Event) => e.stopPropagation(),
                    } as Record<string, unknown>)}
                  >
                    {{icon: () => h(CloseOutlined)}}
                  </Button>
                </Flex>
              ),
              contentRender: ({
                item,
              }: {
                item: {key: string; file?: ObjectItemInfo}
              }) =>
                item.file ? (
                  <FilePaneHost
                    key={item.key}
                    ref={paneHostRef(item.key)}
                    class={hashed(`${props.prefixCls}-pane`)}
                    item={item.file}
                    bucket={props.bucket}
                    readonly={props.readonly}
                    rootPath={props.rootPath}
                    prefixCls={props.prefixCls}
                    hashId={props.hashId}
                    cssVarCls={props.cssVarCls}
                    onDirtyChange={(dirty: boolean) => onPaneDirtyChange(item.key, dirty)}
                  />
                ) : null,
              rightExtra: () =>
                state.value.selectedItem ? (
                  <SpaceCompact size="small">
                    {activeCanSave.value ? (
                      <Tooltip title={locale.value.save}>
                        <Button size="small" onClick={saveActive}>
                          {{icon: () => h(SaveOutlined)}}
                        </Button>
                      </Tooltip>
                    ) : null}
                    <Tooltip title={locale.value.locate}>
                      <Button
                        size="small"
                        onClick={() =>
                          state.value.selectedItem &&
                          onSelectOpenFile(state.value.selectedItem)
                        }
                      >
                        {{icon: () => h(AimOutlined)}}
                      </Button>
                    </Tooltip>
                    <Tooltip title={locale.value.download}>
                      <Button
                        size="small"
                        onClick={() =>
                          state.value.selectedItem &&
                          onDownloadFile(state.value.selectedItem)
                        }
                      >
                        {{icon: () => h(DownloadOutlined)}}
                      </Button>
                    </Tooltip>
                  </SpaceCompact>
                ) : null,
            }}
          />
        </Flex>
      ) : (
        <Flex class={hashed(`${props.prefixCls}-pane`)} align="center" justify="center">
          <Empty />
        </Flex>
      )
    }
  },
})

export default FileTabs

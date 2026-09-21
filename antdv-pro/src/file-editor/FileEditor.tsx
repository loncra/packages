import {computed, defineComponent, h, type PropType, type VNodeChild} from 'vue'
import {
  Badge,
  Button,
  Dropdown,
  Empty,
  Flex,
  Input,
  Menu,
  SpaceCompact,
  Spin,
  Splitter,
  SplitterPanel,
  Tabs,
  theme,
  Tooltip,
  TypographyText,
  Upload,
} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {
  AimOutlined,
  CheckOutlined,
  CloseOutlined,
  DownloadOutlined,
  EllipsisOutlined,
  FileAddOutlined,
  FolderAddOutlined,
  LoadingOutlined,
  ProfileOutlined,
  ReloadOutlined,
  SaveOutlined,
} from '@antdv-next/icons'
import {classNames} from '@loncra/antdv'
import type {ObjectItemInfo} from '@loncra/client/resource'
import FilePaneHost from './FilePaneHost'
import type {EditObjectItemInfo, FileEditorProps} from './types'
import {useFileEditor} from './useFileEditor'
import useStyle from './style'

const FileEditor = defineComponent({
  name: 'LFileEditor',
  inheritAttrs: false,
  props: {
    readonly: {
      type: Boolean,
      default: false,
    },
    name: String,
    path: {
      type: String,
      required: true,
    },
    bucket: {
      type: String,
      required: true,
    },
    getIcon: Function as PropType<FileEditorProps['getIcon']>,
    height: [String, Number],
    maxHeight: [String, Number],
    prefixCls: String,
    rootClass: String,
  },
  setup(props, {attrs}) {
    const config = useConfig()
    const {token} = theme.useToken()
    const prefixCls = computed(() =>
      config.value.getPrefixCls('file-editor', props.prefixCls ?? 'loncra-file-editor'),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)
    const editor = useFileEditor(props)

    return () => {
      const {class: attrClass, style: attrStyle} = attrs
      const hashed = (...names: (string | undefined)[]) =>
        classNames(hashId.value, cssVarCls.value, ...names)
      const {
        locale,
        resolveIcon,
        fileUploadTrigger,
        dirUploadTrigger,
        createMenu,
        onMenuClick,
        activateTab,
        onRefresh,
        cancelEdit,
        confirmEdit,
        onSelectOpenFile,
        onDownloadFile,
        onUploadChange,
        tabItems,
        tabMeta,
        onPaneDirtyChange,
        paneHostRef,
        onCloseTab,
        saveActive,
        activeCanSave,
        onRootUpload,
        getDisplayName,
        state,
      } = editor

      const sizeStyle: Record<string, string> = {}
      if (props.height != null && props.height !== '') {
        const height = typeof props.height === 'number' ? `${props.height}px` : props.height
        sizeStyle.height = height
        sizeStyle.minHeight = height
      }
      if (props.maxHeight != null && props.maxHeight !== '') {
        sizeStyle.maxHeight =
          typeof props.maxHeight === 'number' ? `${props.maxHeight}px` : props.maxHeight
      }

      return (
        <div
          class={hashed(prefixCls.value, props.rootClass, attrClass as string)}
          style={[sizeStyle, attrStyle] as never}
        >
          <Upload
            key={`file-${state.value.upload.session}`}
            showUploadList={false}
            beforeUpload={() => false}
            multiple
            class={hashed(`${prefixCls.value}-hidden-upload`)}
            onChange={onUploadChange}
          >
            <span ref={fileUploadTrigger} />
          </Upload>
          <Upload
            key={`dir-${state.value.upload.session}`}
            showUploadList={false}
            beforeUpload={() => false}
            multiple
            directory
            class={hashed(`${prefixCls.value}-hidden-upload`)}
            onChange={onUploadChange}
          >
            <span ref={dirUploadTrigger} />
          </Upload>
          <Splitter class={hashed(`${prefixCls.value}-splitter`)}>
            <SplitterPanel class={hashed(`${prefixCls.value}-panel`)} defaultSize="20%" min="10%" max="30%">
              <Flex vertical class={hashed(`${prefixCls.value}-side`)}>
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
                  <SpaceCompact size="small">
                    <Tooltip title={locale.value.refresh}>
                      <Button onClick={onRefresh}>
                        {{icon: () => h(ReloadOutlined)}}
                      </Button>
                    </Tooltip>
                    {!props.readonly ? (
                      <>
                        <Tooltip title={locale.value.uploadFile}>
                          <Button onClick={() => onRootUpload(false)}>
                            {{icon: () => h(FileAddOutlined)}}
                          </Button>
                        </Tooltip>
                        <Tooltip title={locale.value.uploadDirectory}>
                          <Button onClick={() => onRootUpload(true)}>
                            {{icon: () => h(FolderAddOutlined)}}
                          </Button>
                        </Tooltip>
                      </>
                    ) : null}
                  </SpaceCompact>
                </Flex>
                <div class={hashed(`${prefixCls.value}-tree`)}>
                  <Spin
                    class={hashed(`${prefixCls.value}-spin`)}
                    spinning={state.value.loading}
                  >
                    <Menu
                      class={hashed(`${prefixCls.value}-menu`)}
                      mode="inline"
                      items={state.value.dataSource as never}
                      inlineIndent={token.value.sizeXS}
                      expandIcon={h('span')}
                      openKeys={state.value.openKeys}
                      selectedKeys={state.value.selectedItem ? [state.value.selectedItem.id] : []}
                      v-slots={{
                        iconRender: (item: EditObjectItemInfo) =>
                          item.loading
                            ? h(LoadingOutlined, {class: hashed(`${prefixCls.value}-icon-spin`)})
                            : resolveIcon(item),
                        labelRender: (item: EditObjectItemInfo) =>
                          state.value.currentEditItem?.id === item.id &&
                          state.value.currentEditItem.editing ? (
                            <SpaceCompact
                              size="small"
                              block
                              {...({
                                onClick: (e: Event) => e.stopPropagation(),
                                onMousedown: (e: Event) => e.stopPropagation(),
                              } as Record<string, unknown>)}
                            >
                              <Input
                                value={state.value.currentEditItem.editName}
                                onUpdate:value={(value: string) => {
                                  if (state.value.currentEditItem) {
                                    state.value.currentEditItem.editName = value
                                  }
                                }}
                                onPressEnter={() =>
                                  state.value.currentEditItem &&
                                  confirmEdit(state.value.currentEditItem)
                                }
                              />
                              <Button
                                type="primary"
                                onClick={() =>
                                  state.value.currentEditItem &&
                                  confirmEdit(state.value.currentEditItem)
                                }
                              >
                                {{icon: () => h(CheckOutlined)}}
                              </Button>
                              <Button
                                type="primary"
                                danger
                                onClick={() =>
                                  state.value.currentEditItem &&
                                  cancelEdit(state.value.currentEditItem)
                                }
                              >
                                {{icon: () => h(CloseOutlined)}}
                              </Button>
                            </SpaceCompact>
                          ) : (
                            <Flex
                              class={hashed(`${prefixCls.value}-row`)}
                              justify="space-between"
                              align="center"
                              {...({
                                onClick: () => onMenuClick(item),
                              } as Record<string, unknown>)}
                            >
                              <TypographyText
                                class={hashed(`${prefixCls.value}-grow`)}
                                ellipsis={{
                                  tooltip: {title: item.name, mouseEnterDelay: 1},
                                }}
                              >
                                {getDisplayName(item)}
                              </TypographyText>
                              {!item.readonly && !props.readonly ? (
                                <span class={hashed(`${prefixCls.value}-more`)}>
                                  <Dropdown menu={createMenu(item) as never}>
                                    <Button
                                      type="text"
                                      size="small"
                                      class={hashed(`${prefixCls.value}-more-btn`)}
                                      {...({
                                        onClick: (e: Event) => e.stopPropagation(),
                                        onMousedown: (e: Event) => e.stopPropagation(),
                                      } as Record<string, unknown>)}
                                    >
                                      {{icon: () => h(EllipsisOutlined)}}
                                    </Button>
                                  </Dropdown>
                                </span>
                              ) : null}
                            </Flex>
                          ),
                      }}
                    />
                  </Spin>
                </div>
              </Flex>
            </SplitterPanel>
            <SplitterPanel class={hashed(`${prefixCls.value}-panel-main`)}>
              {state.value.tabs.length ? (
                <Flex vertical class={hashed(`${prefixCls.value}-tabs`)}>
                  <Tabs
                    hideAdd
                    destroyOnHidden={false}
                    activeKey={state.value.selectedItem?.id}
                    items={tabItems.value}
                    classes={{
                      root: hashed(`${prefixCls.value}-tabs-root`),
                      body: hashed(`${prefixCls.value}-tabs-body`),
                      content: hashed(`${prefixCls.value}-tabs-content`),
                      item: hashed(`${prefixCls.value}-tab-item`),
                      header: hashed(`${prefixCls.value}-tab-header`),
                    }}
                    onChange={activateTab}
                    v-slots={{
                      labelRender: ({
                        item,
                      }: {
                        item: {key: string; label: string; icon: VNodeChild; file: ObjectItemInfo}
                      }) => (
                        <Flex
                          align="center"
                          gap="small"
                          class={hashed(`${prefixCls.value}-tab-label`)}
                        >
                          <Badge dot={tabMeta[item.key]?.dirty} offset={[0, 0]}>
                            {item.icon}
                          </Badge>
                          <TypographyText
                            class={hashed(`${prefixCls.value}-grow`)}
                            ellipsis={{
                              tooltip: {title: item.label, mouseEnterDelay: 1},
                            }}
                          >
                            {item.label}
                          </TypographyText>
                          <Button
                            type="text"
                            size="small"
                            class={hashed(`${prefixCls.value}-tab-close`)}
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
                            class={hashed(`${prefixCls.value}-pane`)}
                            item={item.file}
                            bucket={props.bucket}
                            readonly={props.readonly}
                            rootPath={props.path}
                            prefixCls={prefixCls.value}
                            hashId={hashId.value}
                            cssVarCls={cssVarCls.value}
                            onDirtyChange={(dirty: boolean) => onPaneDirtyChange(item.key, dirty)}
                          />
                        ) : null,
                      rightExtra: () =>
                        state.value.selectedItem ? (
                          <SpaceCompact size="small">
                            {activeCanSave.value ? (
                              <Tooltip title={locale.value.save}>
                                <Button onClick={saveActive}>
                                  {{icon: () => h(SaveOutlined)}}
                                </Button>
                              </Tooltip>
                            ) : null}
                            <Tooltip title={locale.value.locate}>
                              <Button
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
                <Flex class={hashed(`${prefixCls.value}-pane`)} align="center" justify="center">
                  <Empty />
                </Flex>
              )}
            </SplitterPanel>
          </Splitter>
        </div>
      )
    }
  },
})

export default FileEditor
export type {FileEditorProps, FileEditorSlots} from './types'

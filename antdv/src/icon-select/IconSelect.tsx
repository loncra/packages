import {computed, defineComponent, type PropType, type VNodeChild} from 'vue'
import {
  Avatar,
  Button,
  Flex,
  Input,
  InputSearch,
  Popover,
  Select,
  Space,
  SpaceAddon,
  SpaceCompact,
  Tabs,
  type ButtonProps,
  type PopoverProps,
  type TabsProps,
} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {SelectOutlined} from '@antdv-next/icons'
import {classNames} from '../_util/classNames'
import {useFormItemTrigger} from '../_util/useFormItemTrigger'
import {useLocale} from '../_util/context/useLocale'
import {avatarModeOptions, parseAvatarModel} from './iconSelectKinds'
import {useIconSelect} from './useIconSelect'
import useStyle from './style'
import {ICON_SELECT_AVATAR_MODE_VALUE, ICON_SELECT_MODE} from './constants'
import type {
  IconfontJson,
  IconSelectAvatarModeValueType,
  IconSelectClasses,
  IconSelectModeType,
  IconSelectProps,
  IconSelectStyles,
} from './types'

interface GlyphGridParams {
  prefixCls: string
  hashed: (...names: (string | undefined)[]) => string
  glyphs: {key: string; value: string}[]
  current: string
  button: {
    classes?: ButtonProps['classes']
    styles?: ButtonProps['styles']
  }
  renderIcon: (type: string) => VNodeChild
  onPick: (value: string) => void
}

interface GlyphPopoverParams {
  prefixCls: string
  scope: string
  hashed: (...names: (string | undefined)[]) => string
  classes: IconSelectClasses
  styles: IconSelectStyles
  placeholder: string
  tabItems: TabsProps['items']
  current: string
  onPick: (value: string) => void
  onSearch: (value: string) => void
  glyphsOf: (packName: string) => {key: string; value: string}[]
  renderIcon: (type: string) => VNodeChild
}

function renderAvatar(
  type: IconSelectAvatarModeValueType,
  payload: string,
  iconRender: (type: string) => VNodeChild,
  avatarAttrs: Record<string, unknown> = {},
) {
  if (type === ICON_SELECT_AVATAR_MODE_VALUE.AVATAR) {
    return <Avatar {...avatarAttrs} src={payload} />
  }
  if (type === ICON_SELECT_AVATAR_MODE_VALUE.ICON) {
    return <Avatar {...avatarAttrs}>{iconRender(payload)}</Avatar>
  }
  if (type === ICON_SELECT_AVATAR_MODE_VALUE.INPUT) {
    return <Avatar {...avatarAttrs}>{payload.substring(0, 1)}</Avatar>
  }
  return null
}

function preventEnter(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault()
  }
}

function mergeSemanticClasses(base: unknown, patch: Record<string, string>) {
  if (!base) {
    return patch
  }
  if (typeof base === 'function') {
    return (info: unknown) =>
      mergeSemanticClasses((base as (value: unknown) => unknown)(info), patch)
  }
  const merged = {...(base as Record<string, unknown>)}
  Object.keys(patch).forEach((key) => {
    merged[key] = classNames(merged[key], patch[key])
  })
  return merged
}

function renderGlyphGrid(params: GlyphGridParams) {
  return (
    <Space wrap>
      {params.glyphs.map((glyph) => (
        <Button
          key={glyph.key}
          size="large"
          type={params.current === glyph.value ? 'primary' : 'default'}
          class={params.hashed(`${params.prefixCls}-glyph`)}
          classes={params.button.classes}
          styles={params.button.styles}
          onClick={() => params.onPick(glyph.value)}
        >
          {params.renderIcon(glyph.value)}
        </Button>
      ))}
    </Space>
  )
}

function renderGlyphPopover(params: GlyphPopoverParams) {
  const {prefixCls, scope, hashed, classes, styles} = params
  const button = {classes: classes.glyph, styles: styles.glyph}

  return (
    <Popover
      rootClass={scope}
      classes={
        mergeSemanticClasses(classes.popover, {
          root: scope,
          content: scope,
        }) as PopoverProps['classes']
      }
      styles={styles.popover}
      trigger={'click'}
      v-slots={{
        title: () => (
          <Flex justify="space-between" align="center" class={scope}>
            <InputSearch
              class={hashed(`${prefixCls}-popover-search`)}
              classes={classes.popover?.search}
              styles={styles.popover?.search}
              placeholder={params.placeholder}
              size="small"
              onSearch={params.onSearch}
              onKeydown={preventEnter}
            />
          </Flex>
        ),
        content: () => (
          <div class={scope}>
            <Tabs
              centered
              items={params.tabItems}
              classes={
                mergeSemanticClasses(classes.popover?.tabs, {
                  body: hashed(`${prefixCls}-popover-body`),
                }) as TabsProps['classes']
              }
              styles={styles.popover?.tabs}
              v-slots={{
                contentRender: ({ item }: { item: { packName: string } }) =>
                  renderGlyphGrid({
                    prefixCls,
                    hashed,
                    glyphs: params.glyphsOf(item.packName),
                    current: params.current,
                    button,
                    renderIcon: params.renderIcon,
                    onPick: params.onPick,
                  }),
              }}
            />
          </div>
        ),
      }}
    >
      <Button>
        {params.current ? params.renderIcon(params.current) : <SelectOutlined />}
      </Button>
    </Popover>
  )
}

const IconSelect = defineComponent({
  name: 'LIconSelect',
  inheritAttrs: false,
  props: {
    value: {
      type: String,
      default: '',
    },
    options: {
      type: Array as () => IconfontJson[],
      default: () => [],
    },
    mode: {
      type: String as () => IconSelectModeType,
      default: ICON_SELECT_MODE.VIEW,
    },
    preview: {
      type: Boolean,
      default: false,
    },
    iconRender: Function as PropType<IconSelectProps['iconRender']>,
    prefixCls: String,
    rootClass: String,
    size: [String, Number] as PropType<IconSelectProps['size']>,
    classes: {
      type: Object as PropType<IconSelectProps['classes']>,
      default: () => ({}),
    },
    styles: {
      type: Object as PropType<IconSelectProps['styles']>,
      default: () => ({}),
    },
  },
  emits: ['update:value'],
  setup(props, { slots, attrs, emit }) {
    const locale = useLocale('IconSelect')
    useFormItemTrigger(() => props.value)
    const config = useConfig()
    const prefixCls = computed(() =>
      config.value.getPrefixCls('icon-select', props.prefixCls ?? 'loncra-icon-select'),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)

    const {
      modelValue,
      tabItems,
      onSearch,
      glyphsOf,
      selectedPackName,
      avatarType,
      avatarPayload,
    } = useIconSelect(props, emit)

    const avatarOptions = computed(() => avatarModeOptions(props.options, locale.value))

    function renderIcon(type: string): VNodeChild {
      return props.iconRender?.(type) ?? null
    }

    function hashed(...names: (string | undefined)[]) {
      return classNames(hashId.value, cssVarCls.value, ...names)
    }

    return () => {
      const { class: attrClass, style: attrStyle, ...rest } = attrs
      const classes = props.classes ?? {}
      const styles = props.styles ?? {}
      const scope = classNames(prefixCls.value, hashId.value, cssVarCls.value, props.rootClass)
      const rootClass = classNames(scope, classes.root, attrClass)
      const rootStyle = styles.root ? ([styles.root, attrStyle] as never) : (attrStyle as never)
      const avatarAttrs = {
        class: classes.avatar,
        style: styles.avatar,
        size: props.size,
      }
      const prefix = prefixCls.value
      const gridButton = {classes: classes.glyph, styles: styles.glyph}

      if (props.preview) {
        return (
          <div class={classNames(rootClass, `${prefix}-preview`)} style={rootStyle} {...rest}>
            {renderAvatar(parseAvatarModel(modelValue.value).type, avatarPayload.value, renderIcon, avatarAttrs)}
            {slots.afterAvatar?.()}
          </div>
        )
      }

      if (props.mode === ICON_SELECT_MODE.VIEW) {
        return (
          <div class={rootClass} style={rootStyle} {...rest}>
            <Tabs
              centered
              items={tabItems.value}
              classes={
                mergeSemanticClasses(classes.tabs, {
                  body: hashed(`${prefix}-tabs-body`),
                }) as TabsProps['classes']
              }
              styles={styles.tabs}
              v-slots={{
                labelRender: ({ item }: { item: { label: string; packName: string } }) =>
                  `${item.label} (${glyphsOf(item.packName).length})`,
                contentRender: ({ item }: { item: { packName: string } }) =>
                  renderGlyphGrid({
                    prefixCls: prefix,
                    hashed,
                    glyphs: glyphsOf(item.packName),
                    current: modelValue.value,
                    button: gridButton,
                    renderIcon,
                    onPick: (value) => {
                      modelValue.value = value
                    },
                  }),
                leftExtra: () => (
                  <InputSearch
                    class={hashed(`${prefix}-search`)}
                    classes={classes.search}
                    styles={styles.search}
                    onSearch={onSearch}
                    onKeydown={preventEnter}
                  />
                ),
                rightExtra: () => (
                  <SpaceCompact>
                    <SpaceAddon
                      class={hashed(`${prefix}-pack-name`, classes.packName)}
                      style={styles.packName}
                    >
                      {selectedPackName()}
                    </SpaceAddon>
                    <Input
                      class={hashed(`${prefix}-code-input`)}
                      classes={classes.codeInput}
                      styles={styles.codeInput}
                      value={modelValue.value}
                      onUpdate:value={(value: string) => {
                        modelValue.value = value
                      }}
                    />
                  </SpaceCompact>
                ),
              }}
            />
          </div>
        )
      }

      if (props.mode === ICON_SELECT_MODE.INPUT) {
        return (
          <div class={rootClass} style={rootStyle} {...rest}>
            <SpaceCompact
              class={hashed(`${prefix}-compact`, classes.compact)}
              style={styles.compact}
            >
              <Input
                class={hashed(`${prefix}-input`)}
                classes={classes.input}
                styles={styles.input}
                value={modelValue.value}
                onUpdate:value={(value: string) => {
                  modelValue.value = value
                }}
              />
            </SpaceCompact>
          </div>
        )
      }

      return (
        <div class={classNames(rootClass, `${prefix}-avatar`)} style={rootStyle} {...rest}>
          <Flex align="center" gap="small">
            {renderAvatar(avatarType.value, avatarPayload.value, renderIcon, avatarAttrs)}
            <SpaceCompact
              block
              class={hashed(`${prefix}-compact`, classes.compact)}
              style={styles.compact}
            >
              <Select
                options={avatarOptions.value}
                class={hashed(`${prefix}-select`)}
                classes={classes.select}
                styles={styles.select}
                value={avatarType.value}
                onUpdate:value={(type) => {
                  avatarType.value = type as IconSelectAvatarModeValueType
                }}
              />
              <Input
                class={hashed(`${prefix}-payload`)}
                classes={classes.payload}
                styles={styles.payload}
                value={avatarPayload.value}
                onUpdate:value={(value: string) => {
                  avatarPayload.value = value
                }}
              />
              {avatarType.value === ICON_SELECT_AVATAR_MODE_VALUE.ICON
                ? renderGlyphPopover({
                    prefixCls: prefix,
                    scope,
                    hashed,
                    classes,
                    styles,
                    placeholder: locale.value.searchPlaceholder,
                    tabItems: tabItems.value,
                    current: avatarPayload.value,
                    onPick: (value) => {
                      avatarPayload.value = value
                    },
                    onSearch,
                    glyphsOf,
                    renderIcon,
                  })
                : null}
            </SpaceCompact>
          </Flex>
        </div>
      )
    }
  },
})

export default IconSelect

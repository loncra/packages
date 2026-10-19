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
import type {IconfontJson, IconSelectAvatarModeValueType, IconSelectModeType} from './types'

export type {
  IconfontGlyph,
  IconfontJson,
  IconSelectAvatarModeValueType,
  IconSelectModeType,
} from './types'
export {AVATAR_SCHEMES, ICON_SELECT_AVATAR_MODE_VALUE, ICON_SELECT_MODE} from './constants'

export interface IconSelectProps {
  value?: string
  options?: IconfontJson[]
  mode?: IconSelectModeType
  preview?: boolean
  iconRender?: (type: string) => VNodeChild
  prefixCls?: string
  class?: unknown
  rootClass?: string
  style?: unknown
}

export interface IconSelectEmits {
  'update:value': (value: string) => void
}

export interface IconSelectSlots {
  afterAvatar?: () => unknown
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
  },
  emits: ['update:value'],
  setup(props, { slots, attrs }) {
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
    } = useIconSelect(props)

    const avatarOptions = computed(() => avatarModeOptions(props.options, locale.value))

    function renderIcon(type: string): VNodeChild {
      return props.iconRender?.(type) ?? null
    }

    function hashed(...names: (string | undefined)[]) {
      return classNames(hashId.value, cssVarCls.value, ...names)
    }

    function renderGlyphButtons(packName: string, current: string, onPick: (value: string) => void) {
      return (
        <Space wrap>
          {glyphsOf(packName).map((glyph) => (
            <Button
              key={glyph.key}
              size="large"
              type={current === glyph.value ? 'primary' : 'default'}
              class={hashed(`${prefixCls.value}-glyph`)}
              onClick={() => onPick(glyph.value)}
            >
              {renderIcon(glyph.value)}
            </Button>
          ))}
        </Space>
      )
    }

    return () => {
      const { class: attrClass, style: attrStyle, ...rest } = attrs
      const rootClass = classNames(
        prefixCls.value,
        hashId.value,
        cssVarCls.value,
        props.rootClass,
        attrClass,
      )
      const popoverClass = classNames(
        prefixCls.value,
        hashId.value,
        cssVarCls.value,
        props.rootClass,
      )

      if (props.preview) {
        return (
          <div class={classNames(rootClass, `${prefixCls.value}-preview`)} style={attrStyle as never}>
            {renderAvatar(parseAvatarModel(modelValue.value).type, avatarPayload.value, renderIcon, rest)}
            {slots.afterAvatar?.()}
          </div>
        )
      }

      if (props.mode === ICON_SELECT_MODE.VIEW) {
        return (
          <Tabs
            class={rootClass}
            style={attrStyle as never}
            centered
            items={tabItems.value}
            classes={{body: hashed(`${prefixCls.value}-tabs-body`)}}
            v-slots={{
              labelRender: ({ item }: { item: { label: string; packName: string } }) =>
                `${item.label} (${glyphsOf(item.packName).length})`,
              contentRender: ({ item }: { item: { packName: string } }) =>
                renderGlyphButtons(item.packName, modelValue.value, (value) => {
                  modelValue.value = value
                }),
              leftExtra: () => (
                <InputSearch onSearch={onSearch} onKeydown={preventEnter} />
              ),
              rightExtra: () => (
                <SpaceCompact>
                  <SpaceAddon>{selectedPackName()}</SpaceAddon>
                  <Input
                    value={modelValue.value}
                    onUpdate:value={(value: string) => {
                      modelValue.value = value
                    }}
                  />
                </SpaceCompact>
              ),
            }}
          />
        )
      }

      if (props.mode === ICON_SELECT_MODE.INPUT) {
        return (
          <SpaceCompact class={rootClass} style={attrStyle as never}>
            <Input
              {...rest}
              value={modelValue.value}
              onUpdate:value={(value: string) => {
                modelValue.value = value
              }}
            />
          </SpaceCompact>
        )
      }

      return (
        <Flex
          align="center"
          gap="small"
          class={classNames(rootClass, `${prefixCls.value}-avatar`)}
          style={attrStyle as never}
        >
          {avatarType.value === ICON_SELECT_AVATAR_MODE_VALUE.AVATAR ? (
            <Avatar src={avatarPayload.value} />
          ) : avatarType.value === ICON_SELECT_AVATAR_MODE_VALUE.ICON ? (
            <Avatar>{renderIcon(avatarPayload.value)}</Avatar>
          ) : (
            <Avatar>{avatarPayload.value.substring(0, 1)}</Avatar>
          )}
          <SpaceCompact block class={`${prefixCls.value}-compact`}>
            <Select
              options={avatarOptions.value}
              class={`${prefixCls.value}-select`}
              value={avatarType.value}
              onUpdate:value={(type) => {
                avatarType.value = type as IconSelectAvatarModeValueType
              }}
            />
            <Input
              class={`${prefixCls.value}-payload`}
              value={avatarPayload.value}
              onUpdate:value={(value: string) => {
                avatarPayload.value = value
              }}
            />
            {avatarType.value === ICON_SELECT_AVATAR_MODE_VALUE.ICON ? (
              <Popover
                class={popoverClass}
                rootClass={popoverClass}
                trigger={"click"}
                classes={{root: popoverClass, content: popoverClass}}
                v-slots={{
                  title: () => (
                    <Flex justify="space-between" align="center" class={popoverClass}>
                      <InputSearch
                        class={hashed(`${prefixCls.value}-search`)}
                        placeholder={locale.value.searchPlaceholder}
                        size="small"
                        onSearch={onSearch}
                        onKeydown={preventEnter}
                      />
                    </Flex>
                  ),
                  content: () => (
                    <div class={popoverClass}>
                      <Tabs
                        centered
                        items={tabItems.value}
                        classes={{body: hashed(`${prefixCls.value}-popover-body`)}}
                        v-slots={{
                          contentRender: ({item}: {item: {packName: string}}) =>
                            renderGlyphButtons(item.packName, avatarPayload.value, (value) => {
                              avatarPayload.value = value
                            }),
                        }}
                      />
                    </div>
                  ),
                }}
              >
                <Button>
                  {avatarPayload.value ? renderIcon(avatarPayload.value) : <SelectOutlined />}
                </Button>
              </Popover>
            ) : null}
          </SpaceCompact>
        </Flex>
      )
    }
  },
})

export default IconSelect

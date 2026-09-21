import {
  computed,
  defineComponent,
  h,
  type PropType,
  type Ref,
  ref,
  useModel,
  type VNodeChild,
  watch,
} from 'vue'
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
import {useLocale} from '../_util/useLocale'
import useStyle from './style'
import {
  AVATAR_SCHEMES,
  ICON_SELECT_AVATAR_MODE_VALUE,
  ICON_SELECT_MODE,
  type IconfontGlyph,
  type IconfontJson,
  type IconSelectAvatarModeValueType,
  type IconSelectModeType,
} from './types'

export type {
  IconfontGlyph,
  IconfontJson,
  IconSelectAvatarModeValueType,
  IconSelectModeType,
} from './types'
export { AVATAR_SCHEMES, ICON_SELECT_AVATAR_MODE_VALUE, ICON_SELECT_MODE } from './types'

export interface IconSelectProps {
  value?: string
  options?: IconfontJson[]
  mode?: IconSelectModeType
  preview?: boolean
  /**
   * 图标怎么画：宿主自己渲染（一般直接给它 `@/utils/commonUtils` 的 `renderIconFont`，
   * 签名一致）。**包不认识宿主的图标字体**，所以这是唯一入口，不给就什么都不画。
   */
  iconRender?: (type: string, className?: string) => VNodeChild
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

function glyphType(pack: IconfontJson, glyph: IconfontGlyph) {
  return pack.css_prefix_text + glyph.font_class
}

function parseAvatarModel(raw: string) {
  const value = raw ?? ''
  const type = AVATAR_SCHEMES.find((scheme) => value.startsWith(scheme))
  if (!type) {
    return { type: ICON_SELECT_AVATAR_MODE_VALUE.AVATAR, payload: value }
  }
  return { type, payload: value.slice(type.length) }
}

function toAvatarModel(type: IconSelectAvatarModeValueType, payload: string) {
  const text = payload ?? ''
  return text ? `${type}${text}` : ''
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
  setup(props, { emit, slots, attrs }) {
    const locale = useLocale('IconSelect')
    useFormItemTrigger(() => props.value)
    const config = useConfig()
    const prefixCls = computed(() =>
      config.value.getPrefixCls('icon-select', props.prefixCls ?? 'loncra-icon-select'),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)

    const state = ref({
      search: {
        dataSource: [] as IconfontJson[],
        text: '',
      },
    })

    // 双向绑定：父级 v-model 时纯受控，未绑时写本地值并 emit
    const modelValue = useModel(props, 'value') as unknown as Ref<string>

    const avatarOptions = computed(() => {
      const result: { label: string; value: IconSelectAvatarModeValueType }[] = [
        { label: locale.value.link, value: ICON_SELECT_AVATAR_MODE_VALUE.AVATAR },
        { label: locale.value.name, value: ICON_SELECT_AVATAR_MODE_VALUE.INPUT },
      ]
      if (props.options.length > 0) {
        result.push({ label: locale.value.icon, value: ICON_SELECT_AVATAR_MODE_VALUE.ICON })
      }
      return result
    })

    function search() {
      const keyword = state.value.search.text.trim().toLowerCase()
      if (keyword === '') {
        state.value.search.dataSource = props.options
        return
      }
      state.value.search.dataSource = props.options.map((icon) => ({
        ...icon,
        glyphs: icon.glyphs.filter((glyph) =>
          glyphType(icon, glyph).toLowerCase().includes(keyword),
        ),
      }))
    }

    function onSearch(value: string) {
      state.value.search.text = value
      search()
    }

    function glyphsOf(name: string) {
      const pack = state.value.search.dataSource.find((icon) => icon.name === name)
      if (!pack) {
        return []
      }
      return pack.glyphs.map((glyph) => ({
        key: glyph.icon_id,
        value: glyphType(pack, glyph),
      }))
    }

    const tabItems = computed(() =>
      state.value.search.dataSource.map((icon) => ({
        key: `${icon.name}::${state.value.search.text}`,
        packName: icon.name,
        label: icon.name,
      })),
    )

    // avatarType 是 modelValue 的派生值：单一真相源，不再用内部 ref + watch 同步
    const avatarType = computed<IconSelectAvatarModeValueType>({
      get: () => parseAvatarModel(modelValue.value ?? '').type,
      set: (type: IconSelectAvatarModeValueType) => {
        modelValue.value = toAvatarModel(type, parseAvatarModel(modelValue.value ?? '').payload)
      },
    })

    const avatarPayload = computed({
      get() {
        return parseAvatarModel(modelValue.value ?? '').payload
      },
      set(payload: string) {
        modelValue.value = toAvatarModel(avatarType.value, payload)
      },
    })

    watch(() => props.options, () => search(), { immediate: true })

    function renderIcon(type: string, className?: string): VNodeChild {
      return props.iconRender?.(type, className) ?? null
    }

    function renderAvatar(payload: string, avatarAttrs: Record<string, unknown> = {}) {
      const parsed = parseAvatarModel(modelValue.value)
      if (parsed.type === ICON_SELECT_AVATAR_MODE_VALUE.AVATAR) {
        return <Avatar {...avatarAttrs} src={payload} />
      }
      if (parsed.type === ICON_SELECT_AVATAR_MODE_VALUE.ICON) {
        return <Avatar {...avatarAttrs}>{renderIcon(payload)}</Avatar>
      }
      if (parsed.type === ICON_SELECT_AVATAR_MODE_VALUE.INPUT) {
        return <Avatar {...avatarAttrs}>{payload.substring(0, 1)}</Avatar>
      }
      return null
    }

    function preventEnter(event: KeyboardEvent) {
      if (event.key === 'Enter') {
        event.preventDefault()
      }
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

    function selectedPackName() {
      return props.options.find((icon) =>
        icon.glyphs.some((glyph) => glyphType(icon, glyph) === String(modelValue.value)),
      )?.name
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

      if (props.preview) {
        return (
          <div class={classNames(rootClass, `${prefixCls.value}-preview`)} style={attrStyle as never}>
            {renderAvatar(avatarPayload.value, rest)}
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
                class={rootClass}
                rootClass={rootClass}
                classes={{root: rootClass, content: rootClass}}
                v-slots={{
                  title: () => (
                    <Flex justify="space-between" align="center" class={rootClass}>
                      <span>{locale.value.icon}</span>
                      <InputSearch
                        class={hashed(`${prefixCls.value}-search`)}
                        size="small"
                        onSearch={onSearch}
                        onKeydown={preventEnter}
                      />
                    </Flex>
                  ),
                  content: () => (
                    <div class={rootClass}>
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
                {/* 已选图标仍按原方式渲染（数据源来自 options）；未选中时用 SelectOutlined 占位 */}
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

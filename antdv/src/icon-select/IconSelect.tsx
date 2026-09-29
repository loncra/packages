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
   * 图标怎么画：宿主自己渲染。**包不认识宿主的图标字体**，所以这是唯一入口，不给就什么都不画。
   *
   * 只收 `type` 一个参数 —— 之前那个可选的 `className` 二参是个**空口径**（内部 4 个调用点
   * 都只传 type，永远传不出去），已删。宿主要追加自己的类（尺寸 / 对齐）就自己包一层：
   * `iconRender={(type) => renderIconFont(type, 'align')}`。
   */
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

    /**
     * 模式（`avatar://` / `icon://` / `text://`）。
     *
     * ⚠️ **不能只从 `modelValue` 派生**：`toAvatarModel(type, '')` 对空 payload 返回 `''`
     * （空值 = 未选，这是有意的），所以"切到图标模式但还没选图标"这件事**模型里存不下** ⇒
     * 只读模型的话，用户一点「图标」，`avatarType` 立刻变回默认的 `avatar://`（Select 弹回「链接」），
     * 图标模式那一支整个不渲染（选图标的占位按钮和 Popover 永远不出现）。2026-09-28 用户报。
     *
     * 所以：模型**有 payload** 时以模型为准（单一真相源优先）；payload 为空时用下面这层界面态兜住
     * （旧组件那个内部 `avatarType` ref 干的就是这件事）。
     */
    const localAvatarType = ref<IconSelectAvatarModeValueType>(
      parseAvatarModel(props.value ?? '').type,
    )
    const avatarType = computed<IconSelectAvatarModeValueType>({
      get: () => {
        const {type, payload} = parseAvatarModel(modelValue.value ?? '')
        return payload ? type : localAvatarType.value
      },
      set: (type: IconSelectAvatarModeValueType) => {
        localAvatarType.value = type
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

    function renderIcon(type: string): VNodeChild {
      return props.iconRender?.(type) ?? null
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
      /** 组件自己的根元素吃**全部**：prefixCls + hashId + cssVarCls + `rootClass` 声明 + 宿主透传的 class */
      const rootClass = classNames(
        prefixCls.value,
        hashId.value,
        cssVarCls.value,
        props.rootClass,
        attrClass,
      )
      /**
       * Popover 是**传送到 body** 的，里面的规则要 `.loncra-icon-select` 当祖先选择器（`-tabs-nav` 那种是
       * 嵌套写法）+ `hashId` / `cssVarCls` 才命中 ⇒ 弹层那几个壳也得挂这套类。
       *
       * ⚠️ **但绝不能带宿主的 `class`**：宿主一般写的是 `w-full` 这类工具类，挂到 `.ant-popover` 上就是
       * "一开弹层整个被撑成全宽"的元凶（`attrClass` 只该落在组件根元素上）。
       * 2026-09-28 用户截图定位：`.ant-popover.loncra-icon-select.css-var-… w-full`。
       */
      const popoverClass = classNames(
        prefixCls.value,
        hashId.value,
        cssVarCls.value,
        props.rootClass,
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
                class={popoverClass}
                rootClass={popoverClass}
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

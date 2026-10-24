import {computed, defineComponent, h, type PropType, ref} from 'vue'
import {Button, Card, CardGrid, Popover, Tabs} from 'antdv-next'
import {SmileOutlined} from '@antdv-next/icons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import emojiGroups from 'unicode-emoji-json/data-by-group.json'
import {classNames} from '@loncra/antdv'
import type {EmojiButtonLocale} from '../locale'
import {useLocale} from '../_util/useLocale'
import {EMOJI_DEFAULT_HIDDEN_SLUGS} from './constants'
import type {EmojiButtonClasses, EmojiButtonProps, EmojiButtonStyles} from './types'
import useStyle from './style'

const EmojiButton = defineComponent({
  name: 'LEmojiButton',
  inheritAttrs: false,
  props: {
    prefixCls: String,
    rootClass: String,
    type: String as PropType<EmojiButtonProps['type']>,
    disabled: Boolean,
    hiddenSlugs: {
      type: Array as PropType<string[]>,
      default: () => EMOJI_DEFAULT_HIDDEN_SLUGS,
    },
    classes: Object as PropType<EmojiButtonClasses>,
    styles: Object as PropType<EmojiButtonStyles>,
  },
  emits: ['selected'],
  setup(props, { emit, slots, attrs }) {
    const locale = useLocale('EmojiButton')
    const config = useConfig()
    const prefixCls = computed(() =>
      config.value.getPrefixCls('emoji-button', props.prefixCls ?? 'loncra-emoji-button'),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)

    const state = ref({
      activeKey: 'smileys_emotion',
      open: false,
    })

    const hiddenSlugSet = computed(() => new Set(props.hiddenSlugs))

    const tabItems = computed(() =>
      emojiGroups
        .filter((group) => !hiddenSlugSet.value.has(group.slug))
        .map((group) => ({
          key: group.slug,
          label: locale.value[group.slug as keyof EmojiButtonLocale] ?? group.name,
        })),
    )

    function emojisOf(slug: string) {
      return emojiGroups.find((group) => group.slug === slug)?.emojis ?? []
    }

    function onSelectedEmoji(emoji: string) {
      state.value.open = false
      emit('selected', emoji)
    }

    function renderTriggerIcon() {
      const custom = slots.icon?.()
      if (custom) {
        return custom
      }
      return h(SmileOutlined)
    }

    return () => {
      const { class: attrClass, style: attrStyle, ...rest } = attrs
      const hashedClass = classNames(prefixCls.value, hashId.value, cssVarCls.value)

      return (
        <Popover
          trigger="click"
          open={state.value.open}
          onUpdate:open={(open: boolean) => {
            state.value.open = open
          }}
          classes={props.classes?.popover}
          styles={props.styles?.popover}
          v-slots={{
            content: () => (
              <div
                class={classNames(hashedClass, `${prefixCls.value}-panel`, props.classes?.panel)}
                style={props.styles?.panel as never}
              >
                <Tabs
                  activeKey={state.value.activeKey}
                  items={tabItems.value}
                  onChange={(key) => {
                    state.value.activeKey = String(key)
                  }}
                  v-slots={{
                    contentRender: ({ item }: { item: { key: string } }) => (
                      <div
                        class={classNames(
                          hashId.value,
                          cssVarCls.value,
                          `${prefixCls.value}-body`,
                          props.classes?.body,
                        )}
                        style={props.styles?.body as never}
                      >
                        <Card size="small">
                          {emojisOf(item.key).map((itemEmoji) => (
                            <CardGrid
                              key={itemEmoji.name}
                              hoverable
                              class={classNames(
                                hashId.value,
                                cssVarCls.value,
                                `${prefixCls.value}-cell`,
                                props.classes?.cell,
                              )}
                              style={props.styles?.cell as never}
                            >
                              <span
                                class={classNames(
                                  hashId.value,
                                  cssVarCls.value,
                                  `${prefixCls.value}-emoji`,
                                  props.classes?.emoji,
                                )}
                                style={props.styles?.emoji as never}
                                onClick={() => onSelectedEmoji(itemEmoji.emoji)}
                              >
                                {itemEmoji.emoji}
                              </span>
                            </CardGrid>
                          ))}
                        </Card>
                      </div>
                    ),
                  }}
                />
              </div>
            ),
          }}
        >
          <Button
            {...rest}
            type={props.type}
            disabled={props.disabled}
            class={classNames(hashedClass, props.rootClass, attrClass)}
            style={attrStyle as never}
            classes={props.classes?.root}
            styles={props.styles?.root}
            v-slots={{ icon: () => renderTriggerIcon() }}
          />
        </Popover>
      )
    }
  },
})

export default EmojiButton

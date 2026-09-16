import {computed, defineComponent, h, ref} from 'vue'
import {Button, Card, CardGrid, Popover, Tabs} from 'antdv-next'
import {SmileOutlined} from '@antdv-next/icons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import emojiGroups from 'unicode-emoji-json/data-by-group.json'
import type {EmojiButtonLocale} from '../locale'
import {classNames} from '../_util/classNames'
import {useLocale} from '../_util/useLocale'
import useStyle from './style'

export interface EmojiButtonProps {
  class?: unknown
  rootClass?: string
  style?: unknown
  prefixCls?: string
}

export interface EmojiButtonEmits {
  selected: (emoji: string) => void
}

export interface EmojiButtonSlots {
  icon?: () => unknown
}

const hiddenSlugs = new Set(['people_body', 'symbols', 'flags'])

const EmojiButton = defineComponent({
  name: 'LEmojiButton',
  inheritAttrs: false,
  props: {
    prefixCls: String,
    rootClass: String,
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

    const tabItems = computed(() =>
      emojiGroups
        .filter((group) => !hiddenSlugs.has(group.slug))
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
          v-slots={{
            content: () => (
              <div class={classNames(hashedClass, `${prefixCls.value}-panel`)}>
                <Tabs
                  activeKey={state.value.activeKey}
                  items={tabItems.value}
                  classes={{ body: `${prefixCls.value}-body` }}
                  onChange={(key) => {
                    state.value.activeKey = String(key)
                  }}
                  v-slots={{
                    contentRender: ({ item }: { item: { key: string } }) => (
                      <div class={`${prefixCls.value}-body`}>
                        <Card size="small">
                          {emojisOf(item.key).map((itemEmoji) => (
                            <CardGrid
                              key={itemEmoji.name}
                              hoverable
                              class={`${prefixCls.value}-cell`}
                            >
                              <span
                                class={`${prefixCls.value}-emoji`}
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
            class={classNames(hashedClass, props.rootClass, attrClass)}
            style={attrStyle as never}
            v-slots={{ icon: () => renderTriggerIcon() }}
          />
        </Popover>
      )
    }
  },
})

export default EmojiButton

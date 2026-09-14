import {computed, defineComponent, type PropType} from 'vue'
import {Card, CardMeta, Checkbox, Empty, Flex, Masonry, theme, Tooltip} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {BasicImage, classNames, renderIconFont} from '@loncra/antdv'
import {AttachmentService} from '@loncra/client/resource'
import type {ObjectItemInfo} from '@loncra/client/resource'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import {byteFormat} from '../_util/format'
import useStyle from './style'

dayjs.extend(relativeTime)

export interface AttachmentMasonryProps {
  bucket?: string
  dataSource?: ObjectItemInfo[]
  checkValue?: ObjectItemInfo[]
  prefixCls?: string
  class?: unknown
  rootClass?: string
  style?: unknown
}

export interface AttachmentMasonryEmits {
  'update:dataSource': (value: ObjectItemInfo[]) => void
  'update:checkValue': (value: ObjectItemInfo[]) => void
}

export interface AttachmentMasonrySlots {}

const AttachmentMasonry = defineComponent({
  name: 'LAttachmentMasonry',
  inheritAttrs: false,
  props: {
    bucket: {
      type: String,
      default: 'user.file',
    },
    dataSource: {
      type: Array as PropType<ObjectItemInfo[]>,
      default: () => [],
    },
    checkValue: {
      type: Array as PropType<ObjectItemInfo[]>,
      default: () => [],
    },
    prefixCls: String,
    rootClass: String,
  },
  emits: {
    'update:dataSource': (_value: ObjectItemInfo[]) => true,
    'update:checkValue': (_value: ObjectItemInfo[]) => true,
  },
  setup(props, {emit, attrs}) {
    const config = useConfig()
    const {token} = theme.useToken()
    const prefixCls = computed(() =>
      config.value.getPrefixCls(
        'attachment-masonry',
        props.prefixCls ?? 'loncra-attachment-masonry',
      ),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)

    function onCheckChange(id: string, checked: boolean) {
      const selected = props.checkValue ?? []
      const source = props.dataSource ?? []
      if (checked && !selected.map((r) => r.id).includes(id)) {
        const data = source.find((r) => r.id === id)
        if (data) {
          emit('update:checkValue', [...selected, data])
        }
      } else {
        emit(
          'update:checkValue',
          selected.filter((s) => s.id !== id),
        )
      }
    }

    return () => {
      const {class: attrClass, style: attrStyle} = attrs
      const hashedClass = classNames(
        prefixCls.value,
        hashId.value,
        cssVarCls.value,
        props.rootClass,
        attrClass,
      )
      const source = props.dataSource ?? []
      const selected = props.checkValue ?? []
      if (source.length === 0) {
        return (
          <div class={hashedClass} style={attrStyle as never}>
            <Empty />
          </div>
        )
      }

      const items = source.map((item) => ({
        key: item.id,
        data: item,
      }))

      return (
        <div class={hashedClass} style={attrStyle as never}>
          <Masonry
            columns={{xs: 1, sm: 2, md: 3, lg: 4}}
            gutter={token.value.sizeMD}
            items={items}
            v-slots={{
              itemRender: (info: {data: ObjectItemInfo}) => {
                const item = info.data
                return (
                  <Card
                    size="small"
                    v-slots={{
                      cover: () =>
                        (item.userMetadata?.['content-type'] || '').startsWith('image/') ? (
                          <BasicImage
                            class={classNames(
                              hashId.value,
                              cssVarCls.value,
                              `${prefixCls.value}-cover`,
                            )}
                            {...({
                              src: AttachmentService.query(props.bucket, item.objectName),
                            } as Record<string, unknown>)}
                          />
                        ) : (
                          <div
                            class={classNames(
                              hashId.value,
                              cssVarCls.value,
                              `${prefixCls.value}-placeholder`,
                            )}
                          >
                            {renderIconFont(
                              'loncra-file-text',
                              classNames(hashId.value, `${prefixCls.value}-file-icon`),
                            )}
                          </div>
                        ),
                    }}
                  >
                    <CardMeta
                      v-slots={{
                        title: () =>
                          item.userMetadata?.['X-Amz-Meta-Original-Filename'] || item.objectName,
                        description: () => (
                          <Flex justify="space-between" align="center">
                            <Checkbox
                              checked={selected.map((r) => r.id).includes(item.id)}
                              onChange={(e: {target: {checked: boolean}}) =>
                                onCheckChange(item.id, e.target.checked)
                              }
                            >
                              {byteFormat(item.size)}
                            </Checkbox>
                            <Tooltip title={dayjs(item.lastModified).format('YYYY-MM-DD HH:mm:ss')}>
                              <span>{dayjs(item.lastModified).fromNow()}</span>
                            </Tooltip>
                          </Flex>
                        ),
                      }}
                    />
                  </Card>
                )
              },
            }}
          />
        </div>
      )
    }
  },
})

export default AttachmentMasonry

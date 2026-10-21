import {computed, defineComponent, type PropType} from 'vue'
import {Card, CardMeta, Checkbox, Empty, Flex, Masonry, theme, Tooltip} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {FileTextOutlined} from '@antdv-next/icons'
import {BasicImage, classNames} from '@loncra/antdv'
import type {ObjectItemInfo} from '@loncra/client/resource'
import {AttachmentService} from '@loncra/client/resource'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import {byteFormat} from '../_util/format'
import {useDateFormat} from '../_util/crud/useDateFormat'
import type {AttachmentMasonryClasses, AttachmentMasonryStyles} from './types'
import useStyle from './style'

dayjs.extend(relativeTime)

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
    classes: Object as PropType<AttachmentMasonryClasses>,
    styles: Object as PropType<AttachmentMasonryStyles>,
  },
  emits: {
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
    const {dateTimeFormat: formatDateTime} = useDateFormat()

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
      const {class: attrClass, style: attrStyle, ...rest} = attrs
      const hashedClass = classNames(
        prefixCls.value,
        hashId.value,
        cssVarCls.value,
        props.rootClass,
        props.classes?.root,
        attrClass,
      )
      const rootStyle = [props.styles?.root, attrStyle]
      const source = props.dataSource ?? []
      const selected = props.checkValue ?? []
      if (source.length === 0) {
        return (
          <div {...rest} class={hashedClass} style={rootStyle as never}>
            <Empty classes={props.classes?.empty} styles={props.styles?.empty} />
          </div>
        )
      }

      const items = source.map((item) => ({
        key: item.id,
        data: item,
      }))

      return (
        <div {...rest} class={hashedClass} style={rootStyle as never}>
          <Masonry
            columns={{xs: 1, sm: 2, md: 3, lg: 4}}
            gutter={token.value.sizeMD}
            items={items}
            classes={props.classes?.masonry}
            styles={props.styles?.masonry}
            v-slots={{
              itemRender: (info: {data: ObjectItemInfo}) => {
                const item = info.data
                return (
                  <Card
                    size="small"
                    classes={props.classes?.card}
                    styles={props.styles?.card}
                    v-slots={{
                      cover: () =>
                        (item.userMetadata?.['content-type'] || '').startsWith('image/') ? (
                          <BasicImage
                            class={classNames(
                              hashId.value,
                              cssVarCls.value,
                              props.classes?.cover,
                              `${prefixCls.value}-cover`,
                            )}
                            style={props.styles?.cover as never}
                            {...({
                              src: AttachmentService.query(props.bucket, item.objectName),
                            } as Record<string, unknown>)}
                          />
                        ) : (
                          <div
                            class={classNames(
                              hashId.value,
                              cssVarCls.value,
                              props.classes?.placeholder,
                              `${prefixCls.value}-placeholder`,
                            )}
                            style={props.styles?.placeholder as never}
                          >
                            <FileTextOutlined
                              class={classNames(
                                hashId.value,
                                props.classes?.fileIcon,
                                `${prefixCls.value}-file-icon`,
                              )}
                              style={props.styles?.fileIcon as never}
                            />
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
                            <Tooltip title={formatDateTime(item.lastModified)}>
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

import {computed, defineComponent, onMounted, onUnmounted, type PropType, ref} from 'vue'
import {Flex, Segmented, Table} from 'antdv-next'
import {EyeInvisibleOutlined, EyeOutlined} from '@antdv-next/icons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames, fillLocale} from '@loncra/antdv'
import {isEnumValue, YES_OR_NO_TYPE} from '@loncra/client/commons'
import {
  ChatMessageService,
  type UserChatMessageReadResponseBody,
} from '@loncra/client/message'
import {useDateFormat, UserAvatar} from '@loncra/antdv-pro'
import {useLocale} from '../../_util/useLocale.ts'
import useStyle, {IM_BUBBLE_PREFIX} from './style/index.ts'
import type {ImHost} from '../host.ts'

const ImMessageReadTable = defineComponent({
  name: 'LImMessageReadTable',
  props: {
    messageId: {type: Number, required: true},
    host: {type: Object as PropType<ImHost>, required: true},
  },
  setup(props) {
    const locale = useLocale('ImBubble')
    const {dateTimeFormat} = useDateFormat()
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('im-bubble', IM_BUBBLE_PREFIX))
    const [hashId, cssVarCls] = useStyle(prefixCls)
    const active = ref<'read' | 'unread'>('read')
    const loading = ref(false)
    const dataSource = ref<UserChatMessageReadResponseBody[]>([])

    const readRows = computed(() =>
      dataSource.value.filter((item) => isEnumValue(item.readable, YES_OR_NO_TYPE.NO)),
    )
    const unreadRows = computed(() =>
      dataSource.value.filter((item) => isEnumValue(item.readable, YES_OR_NO_TYPE.YES)),
    )
    const rows = computed(() => (active.value === 'read' ? readRows.value : unreadRows.value))
    const columns = computed(() => [
      {title: locale.value.name, dataIndex: 'name', key: 'name', ellipsis: true},
      active.value === 'read'
        ? {title: locale.value.readTime, dataIndex: 'readTime', key: 'readTime', width: 210, ellipsis: true}
        : {title: locale.value.creationTime, dataIndex: 'creationTime', key: 'creationTime', width: 210, ellipsis: true},
    ])

    onMounted(async () => {
      loading.value = true
      try {
        const result = await ChatMessageService.findMessageRead(props.messageId)
        dataSource.value = result.data ?? []
      } finally {
        loading.value = false
      }
      const stop = props.host.subscribeReadUpdate((updates) => {
        for (const row of updates) {
          const found = dataSource.value.find((item) => item.id === row.id)
          if (!found) {
            continue
          }
          found.readable = {value: YES_OR_NO_TYPE.NO, name: locale.value.read}
          found.readTime = row.value
        }
      })
      onUnmounted(stop)
    })

    function nameOf(record: UserChatMessageReadResponseBody): string {
      if (record.principal === props.host.selfName) {
        return locale.value.me
      }
      return props.host.principalName(record.participant?.metadata?.details)
    }

    return () => (
      <Flex
        vertical
        gap="small"
        class={classNames(prefixCls.value, hashId.value, cssVarCls.value, `${prefixCls.value}-read-table`)}
      >
        <Segmented
          block
          value={active.value}
          options={[
            {
              label: fillLocale(locale.value.readCount, {count: readRows.value.length}),
              value: 'read',
              icon: <EyeOutlined />,
            },
            {
              label: fillLocale(locale.value.unreadCount, {count: unreadRows.value.length}),
              value: 'unread',
              icon: <EyeInvisibleOutlined />,
            },
          ]}
          onUpdate:value={(value: string | number) => {
            active.value = value === 'unread' ? 'unread' : 'read'
          }}
        />
        <Table
          pagination={false}
          loading={loading.value}
          size="small"
          tableLayout="fixed"
          scroll={{y: 350}}
          columns={columns.value}
          dataSource={rows.value}
          v-slots={{
            bodyCell: ({column, record}: {column: {key?: string}; record: UserChatMessageReadResponseBody}) => {
              if (column.key === 'name') {
                return (
                  <Flex align="center" gap="small">
                    <UserAvatar user={record.participant?.metadata?.details} />
                    {nameOf(record)}
                  </Flex>
                )
              }
              if (column.key === 'readTime') {
                return dateTimeFormat(record.readTime)
              }
              if (column.key === 'creationTime') {
                return dateTimeFormat(record.creationTime)
              }
              return null
            },
          }}
        />
      </Flex>
    )
  },
})

export default ImMessageReadTable

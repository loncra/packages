import {computed, defineComponent, inject, nextTick, ref, watch, type PropType} from 'vue'
import {
  Button,
  DateRangePicker,
  Divider,
  Empty,
  Flex,
  Input,
  Modal,
  Pagination,
  Segmented,
  Space,
  SpaceCompact,
  Spin,
  Typography,
} from 'antdv-next'
import {
  AudioOutlined,
  FileImageOutlined,
  FileTextOutlined,
  MessageOutlined,
  SearchOutlined,
  VideoCameraOutlined,
} from '@antdv-next/icons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {AttachmentMasonry, useDateFormat, UserAvatar} from '@loncra/antdv-pro'
import {classNames, fillLocale} from '@loncra/antdv'
import {
  AttachmentService,
  type ObjectItemInfo,
  type PageRequest,
  type TotalPage,
} from '@loncra/client/commons'
import {
  ChatMessageService,
  MESSAGE_SERVER_USER_CHAT_MESSAGE_TYPE,
  type UserChatMessageResponseBody,
} from '@loncra/client/message'
import type {TextBlock} from '@loncra/chat-core'
import ImBubbleContent from '../bubble/ImBubbleContent.tsx'
import type {ImHost} from '../host.ts'
import {IM_HISTORY_KEY} from './useImHistory.ts'
import {useLocale} from '../../_util/useLocale.ts'
import useStyle, {IM_HISTORY_PREFIX} from './style/index.ts'

type HistorySegment = 'message' | 'image' | 'video' | 'audio' | 'unknown'

function emptyPage(): TotalPage<UserChatMessageResponseBody> {
  return {
    elements: [],
    size: 10,
    last: true,
    number: 1,
    first: true,
    totalCount: 0,
    totalPages: 0,
  }
}

function toMillis(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (value && typeof value === 'object' && 'valueOf' in value) {
    const raw = (value as {valueOf: () => unknown}).valueOf()
    const parsed = typeof raw === 'number' ? raw : Number(raw)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

function contentType(item: ObjectItemInfo): string {
  return item.userMetadata?.['content-type'] || ''
}

function fileName(item: ObjectItemInfo): string {
  return item.userMetadata?.['X-Amz-Meta-Original-Filename'] || item.objectName
}

function matchesSegment(item: ObjectItemInfo, segment: HistorySegment): boolean {
  const type = contentType(item)
  if (segment === 'image') {
    return type.startsWith('image/')
  }
  if (segment === 'video') {
    return type.startsWith('video/')
  }
  if (segment === 'audio') {
    return type.startsWith('audio/')
  }
  if (segment === 'unknown') {
    return !type.startsWith('image/') && !type.startsWith('video/') && !type.startsWith('audio/')
  }
  return false
}

const ImHistoriesModal = defineComponent({
  name: 'LImHistoriesModal',
  props: {
    open: {type: Boolean, required: true},
    roomId: {type: Number, required: true},
    roomName: {type: String, required: true},
    host: {type: Object as PropType<ImHost>, required: true},
  },
  emits: ['update:open'],
  setup(props, {emit, slots}) {
    const locale = useLocale('ImHistory')
    const history = inject(IM_HISTORY_KEY, null)
    const {dateFormat} = useDateFormat()
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('im-history', IM_HISTORY_PREFIX))
    const [hashId, cssVarCls] = useStyle(prefixCls)

    const keyword = ref('')
    const dateRange = ref<[import('dayjs').Dayjs, import('dayjs').Dayjs] | null>(null)
    const segment = ref<HistorySegment>('message')
    const loading = ref(false)
    const messages = ref<TotalPage<UserChatMessageResponseBody>>(emptyPage())
    const files = ref<ObjectItemInfo[]>([])
    const checkedFiles = ref<ObjectItemInfo[]>([])
    const applied = ref<{keyword: string; date: [import('dayjs').Dayjs, import('dayjs').Dayjs] | null}>({
      keyword: '',
      date: null,
    })

    function resetQuery() {
      keyword.value = ''
      dateRange.value = null
      segment.value = 'message'
      applied.value = {keyword: '', date: null}
    }

    async function loadMessages(page: number) {
      const query: PageRequest = {
        number: page,
        withoutReadableAnchor: true,
        totalPage: true,
        'filter_[type_eq]': MESSAGE_SERVER_USER_CHAT_MESSAGE_TYPE.USER,
      }
      if (applied.value.keyword !== '') {
        query['filter_[content.*type_jin]'] = 'text'
        query['filter_[content.*value_jsa]'] = applied.value.keyword
      }
      if (applied.value.date?.[0] != null && applied.value.date?.[1] != null) {
        query['filter_[creation_time_between]'] = applied.value.date
      }
      const result = await ChatMessageService.histories(query, props.roomId)
      messages.value = (result.data as TotalPage<UserChatMessageResponseBody> | undefined) ?? emptyPage()
    }

    async function loadFiles() {
      const result = await AttachmentService.findAttachment('temp', `user_chat_room/${props.roomId}`)
      files.value = result.data ?? []
    }

    async function load() {
      if (!props.open || !props.roomId) {
        return
      }
      loading.value = true
      try {
        await Promise.all([loadMessages(1), loadFiles()])
      } finally {
        loading.value = false
      }
    }

    function onSearch() {
      if (loading.value || segment.value !== 'message') {
        return
      }
      applied.value = {keyword: keyword.value, date: dateRange.value}
      loading.value = true
      loadMessages(1).finally(() => {
        loading.value = false
      })
    }

    function onPage(page: number) {
      loading.value = true
      loadMessages(page).finally(() => {
        loading.value = false
      })
    }

    async function locate(message: UserChatMessageResponseBody) {
      if (!history) {
        return
      }
      await history.jumpToHistoryMessage(message)
      emit('update:open', false)
    }

    watch(
      () => [props.open, props.roomId] as const,
      ([open, roomId], previous) => {
        if (!open || !roomId) {
          return
        }
        if (previous && previous[1] !== roomId) {
          resetQuery()
        }
        load()
      },
    )

    watch(segment, async (key) => {
      if (key === 'message') {
        return
      }
      await nextTick()
      window.dispatchEvent(new Event('resize'))
    })

    return () => {
      const prefix = prefixCls.value
      const fileGroups = segment.value === 'message'
        ? []
        : Object.entries(
          [...files.value]
            .filter((item) => matchesSegment(item, segment.value))
            .filter((item) => keyword.value === '' || fileName(item).includes(keyword.value))
            .filter((item) => {
              const range = dateRange.value
              if (range?.[0] == null || range?.[1] == null) {
                return true
              }
              const start = toMillis(range[0])
              const end = toMillis(range[1])
              if (start == null || end == null) {
                return true
              }
              return item.lastModified >= start && item.lastModified <= end
            })
            .sort((a, b) => a.lastModified - b.lastModified)
            .reduce<Record<string, ObjectItemInfo[]>>((acc, item) => {
              const key = dateFormat(item.lastModified)
              ;(acc[key] ||= []).push(item)
              return acc
            }, {}),
        )
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([key, items]) => ({
            key,
            items: [...items].sort((a, b) => b.lastModified - a.lastModified),
          }))
      const rows = messages.value.elements ?? []
      return (
        <Modal
          open={props.open}
          title={fillLocale(locale.value.title, {name: props.roomName})}
          footer={null}
          width={{xs: '90%', sm: '80%', md: '70%', lg: '60%', xl: '60%', xxl: '60%'}}
          onCancel={() => emit('update:open', false)}
        >
          <Flex vertical gap="middle" class={classNames(prefix, hashId.value, cssVarCls.value)}>
            <SpaceCompact>
              <Input
                value={keyword.value}
                onUpdate:value={(value: string) => {
                  keyword.value = value
                }}
                onPressEnter={onSearch}
              />
              <DateRangePicker
                showTime
                value={dateRange.value}
                onUpdate:value={(value) => {
                  const start = value?.[0]
                  const end = value?.[1]
                  dateRange.value = start && end ? [start, end] : null
                }}
              />
              <Button loading={loading.value} onClick={onSearch} v-slots={{icon: () => <SearchOutlined />}} />
            </SpaceCompact>
            <Segmented
              block
              value={segment.value}
              options={[
                {label: locale.value.message, value: 'message', icon: <MessageOutlined />},
                {label: locale.value.image, value: 'image', icon: <FileImageOutlined />},
                {label: locale.value.video, value: 'video', icon: <VideoCameraOutlined />},
                {label: locale.value.audio, value: 'audio', icon: <AudioOutlined />},
                {label: locale.value.unknown, value: 'unknown', icon: <FileTextOutlined />},
              ]}
              onUpdate:value={(value: HistorySegment) => {
                segment.value = value
              }}
            />
            <Spin spinning={loading.value}>
              <Flex vertical gap="middle">
                <div class={`${prefix}-list`}>
                  {segment.value === 'message'
                    ? rows.length > 0
                      ? rows.map((data) => {
                        const details = data.participant?.metadata?.details
                        return (
                          <div key={data.id} class={`${prefix}-row`}>
                            {details
                              ? (
                                <UserAvatar
                                  user={details}
                                  {...({size: 'large'} as Record<string, unknown>)}
                                />
                              )
                              : null}
                            <div class={`${prefix}-main`}>
                              <div class={`${prefix}-title`}>
                                <Typography.Text strong class={`${prefix}-name`}>
                                  {props.host.principalName(details)}
                                </Typography.Text>
                                <Space>
                                  <Button
                                    size="small"
                                    type="text"
                                    class={`${prefix}-locate`}
                                    onClick={() => locate(data)}
                                    v-slots={{icon: () => <SearchOutlined />}}
                                  >
                                    {locale.value.positioning}
                                  </Button>
                                  <Typography.Text type="secondary">
                                    {props.host.timeText(data.creationTime ?? 0)}
                                  </Typography.Text>
                                </Space>
                              </div>
                              <ImBubbleContent
                                content={(data.content ?? []) as readonly TextBlock<string, unknown>[]}
                                principal={String(data.principal ?? '')}
                                host={props.host}
                                onJump={() => undefined}
                                onReedit={() => undefined}
                                v-slots={{call: slots.call}}
                              />
                            </div>
                          </div>
                        )
                      })
                      : <Empty />
                    : fileGroups.length > 0
                      ? fileGroups.map((group) => (
                        <div key={group.key}>
                          <Divider titlePlacement="start" plain>{group.key}</Divider>
                          <AttachmentMasonry
                            bucket="temp"
                            dataSource={group.items}
                            checkValue={checkedFiles.value}
                            onUpdate:checkValue={(value: ObjectItemInfo[]) => {
                              checkedFiles.value = value
                            }}
                          />
                        </div>
                      ))
                      : <Empty />}
                </div>
                {segment.value === 'message'
                  ? (
                    <div class={`${prefix}-pager`}>
                      <Pagination
                        pageSize={messages.value.size}
                        current={messages.value.number}
                        total={messages.value.totalCount}
                        hideOnSinglePage
                        onChange={onPage}
                      />
                    </div>
                  )
                  : null}
              </Flex>
            </Spin>
          </Flex>
        </Modal>
      )
    }
  },
})

export default ImHistoriesModal

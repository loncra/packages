import {computed, defineComponent, h} from 'vue'
import {Button, Flex, FormItem, Input, Select, SpaceCompact, Table, type TableColumnType,} from 'antdv-next'
import {CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined, PlusOutlined} from '@antdv-next/icons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import TooltipValidationFormItem from '../tooltip-validation-form-item'
import {classNames} from '../_util/classNames'
import {useLocale} from '../_util/context/useLocale'
import {KEY_VALUE_COLUMNS, TABLE_SCROLL_Y} from './constants'
import {useKeyValueTable} from './useKeyValueTable'
import type {KeyValueRow} from './types'
import useStyle from './style'

export type { KeyValueRow } from './types'

export interface KeyValueTableProps {
  value?: KeyValueRow[]
  formItemNamePrefix?: string[]
  title?: string
  multipleValue?: boolean
  edit?: boolean
  prefixCls?: string
  class?: unknown
  rootClass?: string
  style?: unknown
}

export interface KeyValueTableEmits {
  'update:value': (value: KeyValueRow[]) => void
  change: (item: KeyValueRow, data: KeyValueRow[]) => void
}

export interface KeyValueTableSlots {
  title?: (ctx: { title?: string }) => unknown
}

export interface KeyValueTableExpose {
  confirmAllEditingRows: () => void
}

const KeyValueTable = defineComponent({
  name: 'LKeyValueTable',
  inheritAttrs: false,
  props: {
    value: {
      type: Array as () => KeyValueRow[],
      default: () => [],
    },
    formItemNamePrefix: {
      type: Array as () => string[],
      default: () => [],
    },
    title: String,
    multipleValue: {
      type: Boolean,
      default: false,
    },
    edit: {
      type: Boolean,
      default: true,
    },
    prefixCls: String,
    rootClass: String,
  },
  emits: {
    'update:value': (_value: KeyValueRow[]) => true,
    change: (_item: KeyValueRow, _data: KeyValueRow[]) => true,
  },
  setup(props, { emit, slots, attrs, expose }) {
    const locale = useLocale('KeyValueTable')
    const config = useConfig()
    const prefixCls = computed(() =>
      config.value.getPrefixCls('key-value-table', props.prefixCls ?? 'loncra-key-value-table'),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)

    const {
      rows,
      addRow,
      removeRow,
      startEditing,
      confirmRow,
      cancelRow,
      confirmAllEditingRows,
    } = useKeyValueTable(props, (item, data) => emit('change', item, data))

    const columns = computed<TableColumnType<KeyValueRow>[]>(() => [
      {...KEY_VALUE_COLUMNS.key, title: locale.value.name},
      {...KEY_VALUE_COLUMNS.value, title: locale.value.value},
      ...(props.edit ? [{...KEY_VALUE_COLUMNS.action, title: locale.value.action}] : []),
    ])

    expose({ confirmAllEditingRows })

    function renderKeyCell(index: number, column: TableColumnType<KeyValueRow>, record: KeyValueRow) {
      if (!record.editing) {
        return record.key
      }
      return (
        <FormItem
          noStyle
          hasFeedback
          rules={[{ required: true }]}
          name={[...props.formItemNamePrefix, index, column.key]}
          messageVariables={{ label: String(column.title ?? '') }}
        >
          <TooltipValidationFormItem>
            <Input
              value={record.key}
              onUpdate:value={(value: string) => {
                record.key = value
              }}
            />
          </TooltipValidationFormItem>
        </FormItem>
      )
    }

    function renderValueCell(index: number, column: TableColumnType<KeyValueRow>, record: KeyValueRow) {
      if (!record.editing) {
        return Array.isArray(record.value) ? record.value.join(', ') : record.value
      }
      return (
        <FormItem
          noStyle
          hasFeedback
          rules={[{ required: true }]}
          name={[...props.formItemNamePrefix, index, column.key]}
          messageVariables={{ label: String(column.title ?? '') }}
        >
          <TooltipValidationFormItem>
            {props.multipleValue ? (
              <Select
                mode="tags"
                class={`${prefixCls.value}-value`}
                maxTagCount="responsive"
                value={record.value as string[]}
                onUpdate:value={(value) => {
                  record.value = Array.isArray(value) ? value.map(String) : []
                }}
              />
            ) : (
              <Input
                value={record.value as string}
                onUpdate:value={(value: string) => {
                  record.value = value
                }}
              />
            )}
          </TooltipValidationFormItem>
        </FormItem>
      )
    }

    function renderActionCell(record: KeyValueRow) {
      if (record.editing) {
        return (
          <SpaceCompact>
            <Button size="small" type="primary" onClick={() => confirmRow(record)}>
              {h(CheckOutlined)}
            </Button>
            <Button size="small" type="primary" danger onClick={() => cancelRow(record)}>
              {h(CloseOutlined)}
            </Button>
          </SpaceCompact>
        )
      }
      return (
        <SpaceCompact>
          <Button size="small" type="primary" onClick={() => startEditing(record)}>
            {h(EditOutlined)}
          </Button>
          <Button size="small" type="primary" danger onClick={() => removeRow(record)}>
            {h(DeleteOutlined)}
          </Button>
        </SpaceCompact>
      )
    }

    return () => {
      const { class: attrClass, style: attrStyle, ...rest } = attrs
      return (
        <div
          class={classNames(
            prefixCls.value,
            hashId.value,
            cssVarCls.value,
            props.rootClass,
            attrClass,
          )}
          style={attrStyle as string | Record<string, string> | undefined}
        >
          <Table
            {...rest}
            pagination={false}
            bordered
            scroll={{ y: TABLE_SCROLL_Y }}
            dataSource={rows.value}
            columns={columns.value}
            rowKey="id"
            v-slots={{
              title:
                props.title || slots.title
                  ? () => (
                      <Flex justify="space-between" align="center">
                        {slots.title ? slots.title({ title: props.title }) : props.title}
                        {props.edit ? (
                          <Button size="small" onClick={addRow}>{h(PlusOutlined)}</Button>
                        ) : null}
                      </Flex>
                    )
                  : undefined,
              bodyCell: ({
                index,
                column,
                record,
              }: {
                index: number
                column: TableColumnType<KeyValueRow>
                record: KeyValueRow
              }) => {
                if (column.dataIndex === 'key') {
                  return renderKeyCell(index, column, record)
                }
                if (column.dataIndex === 'value') {
                  return renderValueCell(index, column, record)
                }
                if (column.dataIndex === 'action') {
                  return renderActionCell(record)
                }
                return null
              },
            }}
          />
        </div>
      )
    }
  },
})

export default KeyValueTable

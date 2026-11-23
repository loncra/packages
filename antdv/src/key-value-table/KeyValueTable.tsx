import {computed, defineComponent, h, type PropType} from 'vue'
import {
  Button,
  Flex,
  FormItem,
  Input,
  Select,
  SpaceCompact,
  Table,
  useFormInstance,
  type FormItemProps,
  type TableColumnType,
} from 'antdv-next'
import {CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined, PlusOutlined} from '@antdv-next/icons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import TooltipValidationFormItem from '../tooltip-validation-form-item'
import {classNames} from '../_util/classNames'
import {useLocale} from '../_util/context/useLocale'
import {KEY_VALUE_COLUMNS, TABLE_SCROLL_Y} from './constants'
import {useKeyValueTable} from './useKeyValueTable'
import type {KeyValueColumnConfig, KeyValueRow, KeyValueTableProps} from './types'
import useStyle from './style'

function resolveColumnRules(
  config: KeyValueColumnConfig | undefined,
): FormItemProps['rules'] | undefined {
  if (config == null) {
    return [{ required: true }]
  }
  if (config.rules === null || (Array.isArray(config.rules) && config.rules.length === 0)) {
    return undefined
  }
  return config.rules ?? [{ required: true }]
}

function readRowField(record: KeyValueRow, field: string): string | string[] | undefined {
  return (record as unknown as Record<string, string | string[]>)[field]
}

function writeRowField(record: KeyValueRow, field: string, value: string | string[]): void {
  ;(record as unknown as Record<string, string | string[]>)[field] = value
}

interface ValueControlOptions {
  multipleValue: boolean
  valueField: string
  classes?: KeyValueTableProps['classes']
  styles?: KeyValueTableProps['styles']
  prefixCls: string
}

function renderValueControl(
  record: KeyValueRow,
  current: string | string[] | undefined,
  options: ValueControlOptions,
) {
  return options.multipleValue ? (
    <Select
      mode="tags"
      class={`${options.prefixCls}-value-select`}
      classes={options.classes?.valueSelect}
      styles={options.styles?.valueSelect}
      maxTagCount="responsive"
      placeholder={record.placeholder}
      value={Array.isArray(current) ? current : current ? [current] : []}
      onUpdate:value={(value) => {
        writeRowField(record, options.valueField, Array.isArray(value) ? value.map(String) : [])
      }}
    />
  ) : (
    <Input
      classes={options.classes?.valueInput}
      styles={options.styles?.valueInput}
      placeholder={record.placeholder}
      value={current as string}
      onUpdate:value={(value: string) => {
        writeRowField(record, options.valueField, value)
      }}
    />
  )
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
    addable: {
      type: Boolean,
      default: undefined,
    },
    columns: {
      type: Object as PropType<KeyValueTableProps['columns']>,
      default: undefined,
    },
    prefixCls: String,
    rootClass: String,
    classes: {
      type: Object as PropType<KeyValueTableProps['classes']>,
      default: () => ({}),
    },
    styles: {
      type: Object as PropType<KeyValueTableProps['styles']>,
      default: () => ({}),
    },
  },
  emits: {
    'update:value': (_value: KeyValueRow[]) => true,
    change: (_item: KeyValueRow, _data: KeyValueRow[]) => true,
  },
  setup(props, { emit, slots, attrs, expose }) {
    const locale = useLocale('KeyValueTable')
    const config = useConfig()
    const formInstance = useFormInstance()
    const prefixCls = computed(() =>
      config.value.getPrefixCls('key-value-table', props.prefixCls ?? 'loncra-key-value-table'),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)

    const keyColumn = computed(() => props.columns?.key ?? {})
    const valueColumn = computed(() => props.columns?.value ?? {})
    const keyField = computed(() => keyColumn.value.field ?? 'key')
    const valueField = computed(() => valueColumn.value.field ?? 'value')
    const hasEditableCell = computed(
      () => keyColumn.value.readonly !== true || valueColumn.value.readonly !== true,
    )

    const {
      rows,
      addRow,
      removeRow,
      startEditing,
      confirmRow,
      cancelRow,
      confirmAllEditingRows,
    } = useKeyValueTable(props, emit)

    const columns = computed<TableColumnType<KeyValueRow>[]>(() => [
      {
        ...KEY_VALUE_COLUMNS.key,
        key: keyField.value,
        dataIndex: keyField.value,
        title: keyColumn.value.title ?? locale.value.name,
      },
      {
        ...KEY_VALUE_COLUMNS.value,
        key: valueField.value,
        dataIndex: valueField.value,
        title: valueColumn.value.title ?? locale.value.value,
      },
      ...(hasEditableCell.value
        ? [{...KEY_VALUE_COLUMNS.action, title: locale.value.action}]
        : []),
    ])

    expose({ confirmAllEditingRows })

    async function confirmAndCloseRow(index: number, record: KeyValueRow) {
      if (formInstance) {
        try {
          await formInstance.validateFields([
            [...props.formItemNamePrefix, index, keyField.value],
            [...props.formItemNamePrefix, index, valueField.value],
          ])
        } catch {
          return
        }
      }
      confirmRow(record)
    }

    function renderKeyCell(index: number, column: TableColumnType<KeyValueRow>, record: KeyValueRow) {
      if (!record.editing || keyColumn.value.readonly === true) {
        return record.key
      }
      return (
        <FormItem
          noStyle
          hasFeedback
          rules={resolveColumnRules(keyColumn.value)}
          name={[...props.formItemNamePrefix, index, keyField.value]}
          messageVariables={{ label: String(column.title ?? '') }}
        >
          <TooltipValidationFormItem>
            <Input
              classes={props.classes?.keyInput}
              styles={props.styles?.keyInput}
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
      const current = readRowField(record, valueField.value)
      if (!record.editing || valueColumn.value.readonly === true) {
        return Array.isArray(current) ? current.join(', ') : current
      }
      return (
        <FormItem
          noStyle
          hasFeedback
          rules={resolveColumnRules(valueColumn.value)}
          name={[...props.formItemNamePrefix, index, valueField.value]}
          messageVariables={{ label: String(column.title ?? '') }}
        >
          <TooltipValidationFormItem>
            {renderValueControl(record, current, {
              multipleValue: props.multipleValue,
              valueField: valueField.value,
              classes: props.classes,
              styles: props.styles,
              prefixCls: prefixCls.value,
            })}
          </TooltipValidationFormItem>
        </FormItem>
      )
    }

    function renderActionCell(index: number, record: KeyValueRow) {
      if (record.editing) {
        return (
          <SpaceCompact class={props.classes?.action} style={props.styles?.action}>
            <Button size="small" type="primary" onClick={() => void confirmAndCloseRow(index, record)}>
              {h(CheckOutlined)}
            </Button>
            <Button size="small" type="primary" danger onClick={() => cancelRow(record)}>
              {h(CloseOutlined)}
            </Button>
          </SpaceCompact>
        )
      }
      return (
        <SpaceCompact class={props.classes?.action} style={props.styles?.action}>
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
            props.classes?.root,
            attrClass,
          )}
          style={props.styles?.root ? ([props.styles.root, attrStyle] as never) : (attrStyle as never)}
        >
          <Table
            {...rest}
            classes={props.classes?.table}
            styles={props.styles?.table}
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
                      <Flex
                        justify="space-between"
                        align="center"
                        class={props.classes?.title}
                        style={props.styles?.title}
                      >
                        {slots.title ? slots.title({ title: props.title }) : props.title}
                        {props.addable !== false ? (
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
                if (column.dataIndex === keyField.value) {
                  return renderKeyCell(index, column, record)
                }
                if (column.dataIndex === valueField.value) {
                  return renderValueCell(index, column, record)
                }
                if (column.dataIndex === 'action') {
                  return renderActionCell(index, record)
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

import {computed, defineComponent, type Ref, useModel} from 'vue'
import {Button, Flex, FormItem, Input, Select, Space, SpaceCompact, Table, type TableColumnType,} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import TooltipValidationFormItem from '../tooltip-validation-form-item'
import {classNames} from '../_util/classNames'
import {renderIconFont} from '../_util/iconFont'
import {useLocale} from '../_util/useLocale'
import type {KeyValueRow} from './types'
import useStyle from './style'

export type { KeyValueRow } from './types'

export interface KeyValueTableProps {
  value?: KeyValueRow[]
  formItemNamePrefix?: string[]
  title?: string
  multipleValue?: boolean
  edit?: boolean
  icon?: string
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
  icon?: (ctx: { type: string; class?: string }) => unknown
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
    icon: String,
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

    // 双向绑定：父级 v-model 时纯受控，未绑时写本地值并 emit
    const model = useModel(props, 'value') as unknown as Ref<KeyValueRow[]>

    const columns = computed<TableColumnType<KeyValueRow>[]>(() => {
      const result: TableColumnType<KeyValueRow>[] = [
        {
          title: locale.value.name,
          dataIndex: 'key',
          key: 'key',
          width: 120,
        },
        {
          title: locale.value.value,
          dataIndex: 'value',
          key: 'value',
        },
      ]
      if (props.edit) {
        result.push({
          title: locale.value.action,
          dataIndex: 'action',
          key: 'action',
          align: 'center',
          fixed: 'right',
          width: 100,
        })
      }
      return result
    })

    function renderIcon(type: string, className?: string) {
      const custom = slots.icon?.({ type, class: className })
      if (custom) {
        return custom
      }
      return renderIconFont(type, className)
    }

    function addKeyValueRow() {
      model.value = [
        ...model.value,
        { id: crypto.randomUUID(), key: '', value: '', editing: true },
      ]
    }

    function removeKeyValueRow(record: KeyValueRow) {
      model.value = model.value.filter((row) => row.id !== record.id)
      emit('change', record, model.value)
    }

    function editKeyValueRow(record: KeyValueRow) {
      record.editing = true
      record.origin = { ...record }
    }

    function confirmKeyValueRow(record: KeyValueRow) {
      record.editing = false
      delete record.origin
      emit('change', record, model.value)
    }

    function cancelKeyValueRow(record: KeyValueRow) {
      if (record.origin) {
        record.key = record.origin.key
        record.value = record.origin.value
        delete record.origin
      }
      record.editing = false
      emit('change', record, model.value)
    }

    function confirmAllEditingRows() {
      for (const row of model.value) {
        if (row.editing) {
          confirmKeyValueRow(row)
        }
      }
    }

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
            <Button type="primary" onClick={() => confirmKeyValueRow(record)}>
              {renderIcon('loncra-check')}
            </Button>
            <Button type="primary" danger onClick={() => cancelKeyValueRow(record)}>
              {renderIcon('loncra-x')}
            </Button>
          </SpaceCompact>
        )
      }
      return (
        <SpaceCompact>
          <Button type="primary" onClick={() => editKeyValueRow(record)}>
            {renderIcon('loncra-file-pen-line')}
          </Button>
          <Button type="primary" danger onClick={() => removeKeyValueRow(record)}>
            {renderIcon('loncra-archive-x')}
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
            scroll={{ y: 275 }}
            dataSource={model.value}
            columns={columns.value}
            rowKey="id"
            v-slots={{
              title: props.title
                ? () => (
                    <Flex justify="space-between" align="center">
                      <Space>
                        {props.icon ? renderIcon(props.icon, 'align') : null}
                        {props.title}
                      </Space>
                      {props.edit ? (
                        <Button onClick={addKeyValueRow}>{renderIcon('loncra-plus')}</Button>
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

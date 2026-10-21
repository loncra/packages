import {computed, type ComputedRef} from 'vue'
import {DatePicker, Input, InputNumber, Select} from 'antdv-next'
import {getEnumName, type NameValueEnumMetadata} from '@loncra/client/commons'
import {Editor, IconSelect, KeyValueTable, type KeyValueTableExpose} from '@loncra/antdv'
import AttachmentUpload, {type AttachmentUploadExpose} from '../attachment-upload'
import UserSelect from '../user-select'
import {useCrudConfig} from '../crud-config-provider'
import {byteFormat} from '../_util/format'
import {useDateFormat} from '../_util/crud/useDateFormat'
import type {FormatContext, PageRegistry, ValueFormatter} from './types'

const ENUM_OPTIONS = (options: NameValueEnumMetadata<number | string>[]) => ({
  options,
  fieldNames: {label: 'name'},
})

function listFormatter(format: string, resolve: (value: unknown, ctx: FormatContext) => string): ValueFormatter {
  return (value, ctx) => {
    if (value == null) {
      return ''
    }
    if (!Array.isArray(value)) {
      throw new Error(
        `[crud-page] 字段 ${ctx.key} 声明 format: '${format}'，但值不是数组：${JSON.stringify(value)}`,
      )
    }
    return value.map((item) => resolve(item, ctx)).join(',')
  }
}

export function usePageRegistry(): ComputedRef<PageRegistry> {
  const config = useCrudConfig()
  const {dateFormat, dateTimeFormat} = useDateFormat()
  return computed<PageRegistry>(() => ({
    fieldComponents: {
      input: {component: Input},
      password: {component: Input.Password},
      textarea: {component: Input.TextArea},
      number: {component: InputNumber},
      select: {component: Select, defaults: {allowClear: true}, mapOptions: ENUM_OPTIONS},
      date: {component: DatePicker},
      dateRange: {component: DatePicker.RangePicker},
      editor: {component: Editor},
      iconSelect: {component: IconSelect},
      userSelect: {component: UserSelect},
      keyValueTable: {
        component: KeyValueTable,
        ownFormItem: true,
        beforeSubmit: (instance) =>
          (instance as KeyValueTableExpose | undefined)?.confirmAllEditingRows(),
      },
      attachmentUpload: {
        component: AttachmentUpload,
        beforeSubmit: async (instance) => {
          await (instance as AttachmentUploadExpose | undefined)?.upload()
        },
      },
      ...config.value.fieldComponents,
    },
    formatters: {
      enum: (value) => (value == null ? '' : getEnumName(value)),
      enumList: listFormatter('enumList', (value) => getEnumName(value)),
      dict: (value) => (value == null ? '' : getEnumName(value)),
      dictList: listFormatter('dictList', getEnumName),
      date: (value) => dateFormat(value),
      dateTime: (value) => dateTimeFormat(value),
      byte: (value) => (value == null ? '' : byteFormat(Number(value))),
      ...config.value.formatters,
    },
  }))
}

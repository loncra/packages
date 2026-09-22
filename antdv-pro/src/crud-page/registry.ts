import {type Component, computed, type ComputedRef, markRaw} from 'vue'
import {DatePicker, Input, InputNumber, Select} from 'antdv-next'
import {
  getEnumName,
  type DataDictionaryMetadata,
  type NameValueEnumMetadata,
} from '@loncra/client/commons'
import {useCrudConfig} from '../crud-config-provider'
import {byteFormat} from '../_util/format'
import {useDateFormat} from '../_util/crud/useDateFormat'
import type {
  FieldComponentSpec,
  FormatContext,
  PageFieldComponent,
  PageRegistry,
  PageValueFormat,
  ValueFormatter,
} from './types'

// #region 字段组件注册表

/** 默认的枚举选项喂法：antdv-next 的枚举元数据是 `{name, value}`，标签取 `name` */
const ENUM_OPTIONS = (options: NameValueEnumMetadata<number | string>[]) => ({
  options,
  fieldNames: {label: 'name'},
})

/** 注册表 key 或直接给组件；key 不在表里就抛（声明写错了要当场知道，别静默略过） */
export function resolveFieldSpec(
  name: PageFieldComponent | Component | undefined,
  table: Record<string, FieldComponentSpec>,
): FieldComponentSpec | undefined {
  if (!name) {
    return undefined
  }
  if (typeof name !== 'string') {
    return {component: markRaw(name)}
  }
  const spec = table[name]
  if (!spec) {
    throw new Error(
      `[crud-page] 未注册的字段组件 '${name}'：用 CrudConfig.fieldComponents 注册，或者直接传组件`,
    )
  }
  return spec
}

/** 组件名（报错用）：注册表 key / 直接传的组件 / 默认 input */
export function componentName(name?: PageFieldComponent | Component): string {
  if (typeof name === 'string') {
    return name
  }
  return name ? '直接传入的组件' : 'input'
}

// #endregion

// #region 值格式注册表

/** 用枚举桶把值翻译成名称；没给 `enumRef` 就抛（声明写错了要当场知道） */
function enumName(ctx: FormatContext, value: unknown): string {
  if (!ctx.enumRef) {
    throw new Error(
      `[crud-page] 字段 ${ctx.key} 声明了枚举格式，但没给 enumRef（模块 + 枚举 id）：没有桶就查不到名称`,
    )
  }
  return getEnumName(value)
}

/**
 * 数据字典 → 名称。值是字典项（后端给整条 `DataDictionaryMetadata`）就直接取 `name`；
 * 只给了 code 才回查声明 `dictionaries` 预载回来的字典。
 */
function dictName(ctx: FormatContext, value: unknown): string {
  if (!ctx.dictId) {
    throw new Error(
      `[crud-page] 字段 ${ctx.key} 声明了字典格式，但没给 dictId：没有字典就查不到名称`,
    )
  }
  if (value != null && typeof value === 'object' && 'name' in value) {
    return String((value as DataDictionaryMetadata).name)
  }
  return ctx.dictionaries[ctx.dictId]?.find((item) => String(item.code) === String(value))?.name ?? ''
}

/** 字典项喂给 Select：label 取 `name`、值取 `code`（字典的"值"就是 code） */
export function dictOptions(list: DataDictionaryMetadata[] | undefined): Record<string, unknown> {
  return {options: list ?? [], fieldNames: {label: 'name', value: 'code'}}
}

/** 列表型格式：值必须是数组，逐个翻译后逗号连接 */
function listFormatter(
  format: string,
  resolve: (ctx: FormatContext, value: unknown) => string,
): ValueFormatter {
  return (value, ctx) => {
    if (!Array.isArray(value)) {
      throw new Error(
        `[crud-page] 字段 ${ctx.key} 声明 format: '${format}'，但值不是数组：${JSON.stringify(value)}`,
      )
    }
    return value.map((item) => resolve(ctx, item)).join(',')
  }
}

/** 没声明 `format` 就原样返回；声明了但表里没有对应 formatter → 抛（别静默略过） */
export function formatValue(
  format: PageValueFormat | undefined,
  value: unknown,
  ctx: FormatContext,
  table: Record<string, ValueFormatter>,
): unknown {
  if (value === null || value === undefined) {
    return ''
  }
  if (!format) {
    return value
  }
  const formatter = table[format]
  if (!formatter) {
    throw new Error(
      `[crud-page] 字段 ${ctx.key} 声明 format: '${format}'，但没有这个 formatter（在 CrudConfig.formatters 里注册）`,
    )
  }
  return formatter(value, ctx)
}

// #endregion

/**
 * 注册表 = 两张内置表 + 宿主 `CrudConfig.fieldComponents` / `formatters` 的**逐 key 覆盖**。
 * 没挂 `CrudConfigProvider`、或没给这两个字段，就是内置表本身。
 *
 * 两张内置表都整张写在这里（不再拆模块级常量）：`date` / `dateTime` 的格式串来自
 * `CrudConfigProvider`，要吃 inject，模块级常量给不了 —— 与其拆两半，不如一眼看全。
 */
export function usePageRegistry(): ComputedRef<PageRegistry> {
  const config = useCrudConfig()
  const {dateFormat, dateTimeFormat} = useDateFormat()
  return computed<PageRegistry>(() => ({
    /**
     * 内置字段组件表。**搜索项的 placeholder / 外观不在这里**：文案是宿主的 i18n key、
     * `w-full` 是宿主的 Tailwind 类，都由宿主在声明的 `search.props` 里给（函数形态，跟随语言切换）。
     * 这里只留组件本体与枚举喂法。
     */
    fieldComponents: {
      input: {component: Input},
      password: {component: Input.Password},
      textarea: {component: Input.TextArea},
      number: {component: InputNumber},
      select: {component: Select, defaults: {allowClear: true}, mapOptions: ENUM_OPTIONS},
      date: {component: DatePicker},
      dateRange: {component: DatePicker.RangePicker},
      ...config.value.fieldComponents,
    },
    /**
     * 声明 `format` 即断言值的形状，形状不对就抛。
     * `enum` / `enumList` 吃 `enumRef` + `list.enums`；`dict` / `dictList` 吃 `dictId` + `list.dictionaries`；
     * `date` / `dateTime` 走显示格式（见 `CrudConfigProvider.dateFormat` / `dateTimeFormat`）；
     * `byte` 是字节数（实现在 `@loncra/client/commons`，不依赖宿主）。
     * 不够用宿主在 `CrudConfig.formatters` 里加（金额、链接…），按 key 覆盖这张表。
     */
    formatters: {
      enum: (value, ctx) => enumName(ctx, value),
      enumList: listFormatter('enumList', enumName),
      dict: (value, ctx) => dictName(ctx, value),
      dictList: listFormatter('dictList', dictName),
      date: (value) => dateFormat(value),
      dateTime: (value) => dateTimeFormat(value),
      byte: (value) => byteFormat(Number(value)),
      ...config.value.formatters,
    },
  }))
}

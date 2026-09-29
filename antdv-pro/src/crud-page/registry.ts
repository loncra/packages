import {type Component, computed, type ComputedRef, markRaw} from 'vue'
import {DatePicker, Input, InputNumber, Select} from 'antdv-next'
import {type DataDictionaryMetadata, getEnumName, type NameValueEnumMetadata,} from '@loncra/client/commons'
import {Editor, IconSelect, KeyValueTable, type KeyValueTableExpose} from '@loncra/antdv'
import AttachmentUpload, {type AttachmentUploadExpose} from '../attachment-upload'
import UserSelect from '../user-select'
import {useCrudConfig} from '../crud-config-provider'
import {byteFormat} from '../_util/format'
import {useDateFormat} from '../_util/crud/useDateFormat'
import type {
  FieldComponentSpec,
  FormatContext,
  PageFieldComponent,
  PageRegistry,
  PageValueFormat,
  PageValueFormatSpec,
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


/** 字典项喂给 Select：label 取 `name`、值取 `code`（字典的"值"就是 code） */
export function dictOptions(list: DataDictionaryMetadata[] | undefined): Record<string, unknown> {
  return {options: list ?? [], fieldNames: {label: 'name', value: 'code'}}
}

/** 列表型格式：值必须是数组，逐个翻译后逗号连接 */
function listFormatter(format: string, resolve: (value: unknown, ctx: FormatContext) => string): ValueFormatter {
  return (value, ctx) => {
    // 空值不是"值不是数组"：返回空串（`formatValue` 不再替内置 formatter 提前挡空值）
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

/**
 * 没声明 `format` 就原样返回（空值给空串）；**声明了就一定交给 formatter —— 空值也交**。
 *
 * 空值不提前挡掉是有意的：宿主注册的 formatter 常见形态是"列的值只是可选字段，显示要靠整条
 * 记录"（如用户列显示"头像 + 显示名"，值 `realName` / `nickname` 缺失也要出人）。挡掉就等于
 * 让这类 formatter 收不到调用、整格空白。**内置的那几个自己守空值**（见 `usePageRegistry`）。
 *
 * `format` 允许两种写法（见 `PageValueFormatSpec`）：光名字，或**名字 + `args`**。
 * `args` 原样透传给注册的 formatter —— pro **不认它的内容**（宿主的扩展点）。
 */
export function formatValue(
  format: PageValueFormat | PageValueFormatSpec | undefined,
  value: unknown,
  ctx: FormatContext,
  table: Record<string, ValueFormatter>,
): unknown {
  if (!format) {
    return value ?? ''
  }
  const name = typeof format === 'string' ? format : format.name
  const args = typeof format === 'string' ? undefined : format.args
  const formatter = table[name]
  if (!formatter) {
    throw new Error(
      `[crud-page] 字段 ${ctx.key} 声明 format: '${name}'，但没有这个 formatter（在 CrudConfig.formatters 里注册）`,
    )
  }
  return formatter(value, ctx, args)
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
      // ── 本仓自己的扩展控件（只登记"组件本体 + 提交前的机械准备"，不含任何业务） ──
      /** 富文本：`v-model:value` 直通；图片/视频上传这类宿主行为走声明 `props` */
      editor: {component: Editor},
      /** 图标选择：`options`（iconfont.json）与 `iconRender` 由声明 `props` 给，或宿主覆盖本表 */
      iconSelect: {component: IconSelect},
      /** 选人：`mode` / `query` 走声明 `props`；选项行要定制就用字段的 `slots.optionRender` */
      userSelect: {component: UserSelect},
      /**
       * 键值表：**自带标题栏 + 行内自带 `a-form-item`** ⇒ `ownFormItem`（外层不再包，包了双标题）。
       *
       * 提交前收尾还在编辑态的行（`confirmAllEditingRows()`）：它**不发 `update:value`**（行对象是
       * 原地改的，值本来就在），要的是它**逐行 `emit('change')`** —— 声明侧靠这个把派生字段写下去
       * （如 mcp 把 `envDataSource` 同步进 `metadata.client.env`），不收尾那一步就不会发生。
       */
      keyValueTable: {
        component: KeyValueTable,
        ownFormItem: true,
        beforeSubmit: (instance) =>
          (instance as KeyValueTableExpose | undefined)?.confirmAllEditingRows(),
      },
      /**
       * 附件：本地文件要在 `save` 之前 `upload()` 成 `ObjectWriteResult`，
       * 否则落库 `bucketName` / `objectName` 为空（列表与预览都出不来）。
       *
       * ⚠️ **回填不靠这里的返回值**：`upload()` 会把内部 `fileList` 换成 `ObjectWriteResult[]`
       * （`AttachmentUpload.tsx` 的 `fileList.value = results` + `await nextTick()`）⇒ 组件自己的
       * `watch(fileList)` 触发 `emit('update:value')` ⇒ 壳的 `onUpdate:value` 写回实体（`writePath`）。
       * 所以 `beforeSubmit` 只负责"催一下"；组件"传完只返回、不 emit"才需要额外写回能力（现在没有这种组件）。
       */
      attachmentUpload: {
        component: AttachmentUpload,
        beforeSubmit: async (instance) => {
          await (instance as AttachmentUploadExpose | undefined)?.upload()
        },
      },
      ...config.value.fieldComponents,
    },
    /**
     * `enum` / `enumList` 与 `dict` / `dictList` 都是**取值→名称**：用 `getEnumName`（值自带 name
     * 就出 name，裸值原样显示）；字典多一步"裸 code 回查预载的字典"（查不到也原样显示，不抛）。
     * 形状断言只剩列表型（值必须是数组）与 `date` / `dateTime` / `byte` 的转换。
     * 不够用宿主在 `CrudConfig.formatters` 里加（金额、链接…），按 key 覆盖这张表。
     *
     * **空值由这张表自己守**（`formatValue` 对声明了 `format` 的格子不再提前挡空值）：
     * `enum` / `dict` / `byte` 判空返回空串（`getEnumName(null)` 会得到字符串 `"null"`、
     * `Number(null)` 会得到 `0`），列表型在 `listFormatter` 里挡；`date` / `dateTime` 本身耐空。
     */
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

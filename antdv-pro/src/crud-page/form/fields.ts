import type {Component} from 'vue'
import type {FormItemProps} from 'antdv-next'
import type {EnumBucketsResponseBody} from '@loncra/client/resource'
import type {PageDictionaries} from '../../basic-crud-query/types'
import {componentName, dictOptions, resolveFieldSpec} from '../registry'
import type {
  PageDeclContext,
  PageFieldRenderContext,
  PageFieldsDictionary,
  PageFormField,
  PageRegistry,
} from '../types'

/**
 * 建好的表单控件描述：标签 / 组件 / props / 校验规则一次算好，模板保持"笨"
 * （与列表的 `buildListColumns` 同一个思路：声明 → 组件能吃的形状）。
 */
export interface BuiltFormField<TBody> {
  key: keyof TBody & string
  label: string
  /** 24 栅格跨度 */
  span: number
  rules?: FormItemProps['rules']
  /** 注册表解析出来的组件；`render` 逃生时为空 */
  component?: Component
  props: Record<string, unknown>
  /** 逃生：整块自绘（与 `component` 二选一），模板里用当前实体求值 */
  render?: (ctx: PageFieldRenderContext<TBody>) => unknown
}

export interface BuildFormFieldsOptions<TBody extends object, TEntity extends TBody & object> {
  declared: PageFormField<TBody>[]
  /** 字段字典：`labelKey` / `format` 与**来源**（`enumRef` / `dictId`）的唯一事实来源 */
  fields: PageFieldsDictionary<TEntity>
  /** 当前实体：`props` / `rules` 的函数形态要读它（读到的依赖由调用方的 computed 收集） */
  entity: TBody
  /** 声明级上下文（`variant` / `extra`） */
  ctx: PageDeclContext
  /** label 解析：页面声明的 `i18nResolver` > `CrudConfig.i18nResolver` > key 本身 */
  t: (key: string, named?: Record<string, unknown>) => string
  i18nPrefix: string
  registry: PageRegistry
  buckets: EnumBucketsResponseBody
  dictionaries: PageDictionaries
}

/**
 * 表单字段声明 → 渲染器需要的描述。
 *
 * 三件事在这里"解析"完（模板里不写 `component === 'x'` 分支、不判来源）：
 * 1. **label**：字段字典的 `labelKey` > `${i18nPrefix}.${key}`，都交给 `t` 翻；
 * 2. **来源 → props**：字典走字典自己的语义（label=name、value=code），枚举走组件的 `mapOptions`；
 *    声明里的 `props` **最后**求值 ⇒ 可以覆盖来源（选项由壳从 `:extra` 递进来就走这条路）；
 * 3. **函数形态的 `props` / `rules`**：拿 `PageFieldRenderContext`（含当前实体），
 *    所以实体一变，调用方的 computed 会重算（编辑态 disabled、条件必填都靠它）。
 *
 * 写错了当场抛（不静默）：`enumRef` + `dictId` 同时给、`enumRef` 但组件没有 `mapOptions`、
 * 组件吃 options 却既无来源也没在 props 里给。
 */
export function buildFormFields<TBody extends object, TEntity extends TBody & object>(
  options: BuildFormFieldsOptions<TBody, TEntity>,
): BuiltFormField<TBody>[] {
  const {declared, fields, entity, ctx, t, i18nPrefix, registry, buckets, dictionaries} = options

  return declared
    .filter((field) => !field.visible || field.visible(ctx))
    .map((field) => {
      // 与列表同一套合并：条目里写了就以条目为准（来源可以只写在字段字典里）
      const spec = fields[field.key]
      const merged: PageFormField<TBody> = {...spec, ...field}
      const enumRef = merged.enumRef
      const dictId = merged.dictId
      if (enumRef && dictId) {
        throw new Error(
          `[crud-page] 字段 ${field.key} 同时声明了 enumRef 与 dictId：选项来源只能有一个`,
        )
      }
      const options = enumRef ? buckets[enumRef.module]?.[enumRef.id] ?? [] : []
      const componentSpec = field.render
        ? undefined
        : resolveFieldSpec(field.component ?? 'input', registry.fieldComponents)
      if (enumRef && !componentSpec?.mapOptions) {
        throw new Error(
          `[crud-page] 字段 ${field.key} 声明了 enumRef，但组件 ${componentName(field.component)} 没有 mapOptions，`
            + 'options 会被丢掉：用 CrudConfig.fieldComponents 给它补 mapOptions，或者去掉 enumRef',
        )
      }
      const renderCtx: PageFieldRenderContext<TBody> = {
        entity,
        t,
        variant: ctx.variant,
        extra: ctx.extra,
      }
      const sourceProps = dictId
        ? dictOptions(dictionaries[dictId])
        : options.length > 0
          ? componentSpec?.mapOptions?.(options) ?? {}
          : {}
      const declaredProps = typeof field.props === 'function' ? field.props(renderCtx) : field.props
      const props = {...componentSpec?.defaults, ...sourceProps, ...declaredProps}
      // 组件靠 options 吃东西，却既没有来源、props 里也没给 ⇒ 今天会静默出一个空下拉。声明写错要当场知道。
      /*if (componentSpec?.mapOptions && !('options' in props)) {
        throw new Error(
          `[crud-page] 字段 ${field.key} 是 ${componentName(field.component)}（会吃 options），`
            + '但既没有 enumRef / dictId、props 里也没给 options：下拉会是空的',
        )
      }*/
      return {
        key: field.key,
        label: t(merged.labelKey ?? `${i18nPrefix}.${field.key}`),
        span: field.span ?? 12,
        rules: typeof field.rules === 'function' ? field.rules(renderCtx) : field.rules,
        component: componentSpec?.component,
        props,
        render: field.render,
      }
    })
}

import {type Component, markRaw} from 'vue'
import type {ColProps, FormItemProps} from 'antdv-next'
import type {EnumBucketsResponseBody} from '@loncra/client/resource'
import type {PageDictionaries} from '../../basic-crud-query/types'
import {componentName, resolveFieldSpec} from '../registryKinds'
import {assertMapOptions, assertSingleSource, resolveSourceProps,} from '../fieldSourcesKinds'
import {pathSegments} from '../../_util/crud/readPath'
import type {FieldComponentSpec, PageDeclContext, PageFieldsDictionary, PageRegistry} from '../types'
import type {PageFieldRenderContext, PageFormField, PageFormFieldKey} from './types'

const FORM_FIELD_DEFAULT_COL: ColProps = {
  span: 12,
  xs: 24,
  sm: 24,
  md: 12,
  lg: 12,
  xl: 12,
  xxl: 12,
  xxxl: 12,
}

export interface BuiltFormField<TBody> {
  key: PageFormFieldKey<TBody>
  name: string[]
  label?: string
  col: ColProps
  rules?: FormItemProps['rules']
  component?: Component
  props: Record<string, unknown>
  slots?: PageFormField<TBody>['slots']
  ownFormItem: boolean
  beforeSubmit?: (expose: unknown) => void | Promise<void>
  render?: (ctx: PageFieldRenderContext<TBody>) => unknown
}

export interface BuildFormFieldsOptions<TBody extends object, TEntity extends TBody & object> {
  declared: PageFormField<TBody>[]
  fields: PageFieldsDictionary<TEntity>
  entity: TBody
  ctx: PageDeclContext
  t: (key: string, named?: Record<string, unknown>) => string
  i18nPrefix: string
  registry: PageRegistry
  buckets: EnumBucketsResponseBody
  dictionaries: PageDictionaries
}

function buildRenderContext<TBody extends object>(
  entity: TBody,
  ctx: PageDeclContext,
  t: BuildFormFieldsOptions<TBody, TBody>['t'],
  buckets: EnumBucketsResponseBody,
  dictionaries: PageDictionaries,
): PageFieldRenderContext<TBody> {
  return {entity, t, buckets, dictionaries, variant: ctx.variant, extra: ctx.extra}
}

function resolveFieldComponent<TBody extends object>(
  field: PageFormField<TBody>,
  registry: PageRegistry,
): FieldComponentSpec | undefined {
  if (field.render) {
    return undefined
  }
  const spec = resolveFieldSpec(field.component ?? 'input', registry.fieldComponents)
  if (spec?.component) {
    return {...spec, component: markRaw(spec.component)}
  }
  return spec
}

function resolveFieldProps<TBody extends object>(
  field: PageFormField<TBody>,
  merged: PageFormField<TBody>,
  renderCtx: PageFieldRenderContext<TBody>,
  componentSpec: FieldComponentSpec | undefined,
  buckets: EnumBucketsResponseBody,
  dictionaries: PageDictionaries,
): Record<string, unknown> {
  const declaredProps = typeof field.props === 'function' ? field.props(renderCtx) : field.props
  return {
    ...componentSpec?.defaults,
    ...resolveSourceProps(merged, componentSpec, buckets, dictionaries),
    ...declaredProps,
  }
}

function resolveFieldLabel<TBody extends object>(
  merged: PageFormField<TBody>,
  key: PageFormFieldKey<TBody>,
  t: BuildFormFieldsOptions<TBody, TBody>['t'],
  i18nPrefix: string,
): string | undefined {
  if (merged.label === false) {
    return undefined
  }
  return t(merged.labelKey ?? `${i18nPrefix}.${key}`)
}

function buildField<TBody extends object, TEntity extends TBody & object>(
  field: PageFormField<TBody>,
  options: BuildFormFieldsOptions<TBody, TEntity>,
): BuiltFormField<TBody> {
  const {fields, entity, ctx, t, i18nPrefix, registry, buckets, dictionaries} = options
  const spec = field.key.includes('.') ? undefined : fields[field.key as keyof TEntity & string]
  const merged: PageFormField<TBody> = {...spec, ...field}
  const renderCtx = buildRenderContext(entity, ctx, t, buckets, dictionaries)
  const componentSpec = resolveFieldComponent(field, registry)

  assertSingleSource(merged)
  if (!field.render) {
    assertMapOptions(merged, componentName(field.component), componentSpec)
  }

  return {
    key: field.key,
    name: pathSegments(field.key),
    label: resolveFieldLabel(merged, field.key, t, i18nPrefix),
    col: field.col ?? FORM_FIELD_DEFAULT_COL,
    rules: typeof field.rules === 'function' ? field.rules(renderCtx) : field.rules,
    component: componentSpec?.component,
    props: resolveFieldProps(field, merged, renderCtx, componentSpec, buckets, dictionaries),
    slots: field.slots,
    ownFormItem: componentSpec?.ownFormItem ?? false,
    beforeSubmit: componentSpec?.beforeSubmit,
    render: field.render,
  }
}

export function buildFormFields<TBody extends object, TEntity extends TBody & object>(
  options: BuildFormFieldsOptions<TBody, TEntity>,
): BuiltFormField<TBody>[] {
  return options.declared
    .filter((field) => !field.visible || field.visible(options.ctx))
    .map((field) => buildField(field, options))
}

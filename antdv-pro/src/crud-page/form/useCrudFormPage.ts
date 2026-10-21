import {computed, ref, type Ref} from 'vue'
import {App, type FormInstance} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {type ModelEmit} from '@loncra/antdv'
import {isBusinessSuccess, type RestResult} from '@loncra/client/commons'
import type {EnumBucketsResponseBody} from '@loncra/client/resource'
import {useCrudConfig} from '../../crud-config-provider'
import {useStaleCheck} from '../../_util/crud/useStaleCheck'
import type {DefaultCrudEntity} from '../../_util/crud/useCollectionData'
import type {PageDictionaries} from '../../basic-crud-query/types'
import {useLocale} from '../../_util/useLocale'
import {usePageRegistry} from '../usePageRegistry'
import {collectFormSources, mergeSources} from '../sourceLoadsKinds'
import {fetchDataDictionaries, fetchEnumBuckets} from '../../basic-crud-query'
import {buildFormFields} from './fields'
import useStyle from './style'
import type {PageDeclContext} from '../types'
import type {CrudFormPageProps, FormService, PageFormContext} from './types'

const SHELL_ENTITY_KEYS = ['id', 'version', 'creationTime'] as const

function writeBackEntity(entity: Ref<DefaultCrudEntity>, value: DefaultCrudEntity): void {
  for (const key in entity.value) {
    const next = (value as Record<string, unknown>)[key]
    if (next !== undefined) {
      ;(entity.value as Record<string, unknown>)[key] = next
    }
  }
  for (const key of SHELL_ENTITY_KEYS) {
    const next = (value as Record<string, unknown>)[key]
    if (next !== undefined) {
      ;(entity.value as Record<string, unknown>)[key] = next
    }
  }
}

export function useCrudFormPage(
  props: CrudFormPageProps & {contextExtra: Record<string, unknown>},
  emit: ModelEmit,
) {
  const config = useCrudConfig()
  const locale = useLocale('Crud')
  const {message} = App.useApp()
  const antdConfig = useConfig()
  const prefixCls = computed(() =>
    antdConfig.value.getPrefixCls('crud-form-page', 'loncra-crud-form-page'),
  )
  const [hashId, cssVarCls] = useStyle(prefixCls)
  const registry = usePageRegistry()
  const buckets = ref<EnumBucketsResponseBody>({})
  const dictionaries = ref<PageDictionaries>({})

  const sources = computed(() =>
    mergeSources(collectFormSources(props.page.form.fields, props.page.fields ?? {}), {
      enums: props.page.form.enums,
      dictionaryCodes: props.page.form.dictionaryCodes,
    }),
  )

  async function loadSources(): Promise<void> {
    const [nextBuckets, nextDictionaries] = await Promise.all([
      fetchEnumBuckets(sources.value.enums),
      fetchDataDictionaries(sources.value.dictionaryCodes),
    ])
    buckets.value = nextBuckets
    dictionaries.value = nextDictionaries
  }

  const formRef = ref<FormInstance>()
  const spinning = ref(false)
  const entity = ref(props.page.form.createEntity()) as Ref<DefaultCrudEntity>
  const service = computed(() => props.page.service as unknown as FormService<DefaultCrudEntity, DefaultCrudEntity>)

  async function submitEntity(): Promise<RestResult<unknown>> {
    const submit = props.page.form.submit
    if (submit) {
      return submit(entity.value, formCtx())
    }
    if (!props.page.service) {
      throw new Error('[crud-page] 表单声明既没给 form.submit、也没给 service：提交无处可去')
    }
    return service.value.save(entity.value)
  }
  const stale = useStaleCheck({
    pageMode: props.page.staleCheck,
    defaultMode: 'prompt',
    entity,
    isDirty: () => !!formRef.value?.isFieldsTouched?.(),
    fetchRemote,
  })

  const ctx = computed<PageDeclContext>(() => ({
    variant: props.variant,
    extra: props.contextExtra,
  }))

  const t = (key: string, named?: Record<string, unknown>) =>
    props.page.i18nResolver?.(key, named) ?? config.value.i18nResolver?.(key, named) ?? key

  const formCtx = (): PageFormContext<DefaultCrudEntity> => ({
    ...ctx.value,
    entity,
    t,
    buckets: buckets.value,
    dictionaries: dictionaries.value,
  })

  const fields = computed(() =>
    buildFormFields({
      declared: props.page.form.fields,
      fields: props.page.fields ?? {},
      entity: entity.value,
      ctx: ctx.value,
      t,
      i18nPrefix: props.page.i18nPrefix,
      registry: registry.value,
      buckets: buckets.value,
      dictionaries: dictionaries.value,
    }),
  )

  const fieldInstances = new Map<string, unknown>()
  const fieldRefSetters = new Map<string, (instance: unknown) => void>()
  function fieldRef(key: string): (instance: unknown) => void {
    const cached = fieldRefSetters.get(key)
    if (cached) {
      return cached
    }
    const setter = (instance: unknown) => {
      if (instance == null) {
        fieldInstances.delete(key)
      } else {
        fieldInstances.set(key, instance)
      }
    }
    fieldRefSetters.set(key, setter)
    return setter
  }

  async function mergeRemote(data?: DefaultCrudEntity): Promise<DefaultCrudEntity> {
    const value = {...entity.value, ...(data ?? {})} as DefaultCrudEntity
    return ((await props.page.form.postGetEntity?.(value, formCtx())) ?? value) as DefaultCrudEntity
  }

  async function fetchEntity(id: unknown): Promise<DefaultCrudEntity | undefined> {
    const result = (await service.value.get(id as never)) as RestResult<DefaultCrudEntity>
    if (!isBusinessSuccess(result)) {
      message.warning(result.message)
      return
    }
    const value = await mergeRemote(result.data)
    writeBackEntity(entity, value)
    return value
  }

  async function fetchRemote(): Promise<DefaultCrudEntity | undefined> {
    if (props.id == null) {
      return
    }
    const result = (await service.value.get(props.id as never)) as RestResult<DefaultCrudEntity>
    if (!isBusinessSuccess(result)) {
      throw new Error(result.message)
    }
    return mergeRemote(result.data)
  }

  async function load(): Promise<void> {
    await loadSources()
    await props.page.form.preMounted?.(formCtx())
    if (props.id != null) {
      const value = await fetchEntity(props.id)
      if (value) {
        stale.markBaseline(value)
      }
    }
    await props.page.form.postMounted?.()
  }

  async function checkStale(): Promise<void> {
    const info = await stale.check()
    if (info) {
      emit('stale', info)
    }
  }

  async function runFieldsBeforeSubmit(): Promise<void> {
    for (const field of fields.value) {
      await field.beforeSubmit?.(fieldInstances.get(String(field.key)))
    }
  }

  async function doSubmit(): Promise<void> {
    spinning.value = true
    try {
      await runFieldsBeforeSubmit()
      await props.page.form.preSubmit?.(formCtx())
      const result = await submitEntity()
      if (!isBusinessSuccess(result)) {
        message.warning(result.message)
        return
      }
      const takenOver = await props.page.form.postSubmit?.(result, formCtx())
      stale.markBaseline(entity.value)
      if (takenOver) {
        emit('success', result)
        return
      }
      message.success(result.message)
      emit('success', result)
    } catch (error) {
      message.error(error instanceof Error ? error.message : String(error))
    } finally {
      spinning.value = false
    }
  }

  function doReset(): void {
    formRef.value?.resetFields?.()
    props.page.form.onReset?.(formCtx())
    emit('resetFields')
  }

  return {
    config,
    locale,
    message,
    prefixCls,
    hashId,
    cssVarCls,
    registry,
    buckets,
    dictionaries,
    formRef,
    spinning,
    entity,
    ctx,
    t,
    fields,
    fieldRef,
    load,
    checkStale,
    doSubmit,
    doReset,
  }
}

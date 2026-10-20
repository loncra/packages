import {computed} from 'vue'
import type {ComputedRef, Ref, SetupContext, SlotsType} from 'vue'
import type {FilterRequest, PageRequest} from '@loncra/client/commons'
import type {CrudLocale} from '../locale'
import type {
  ActionAppApis,
  ActionAuth,
  ActionResolver,
  ToolbarActionContext,
} from '../_util/crud/actions'
import {
  BUILTIN_BULK_ACTION_IDS,
  BUILTIN_RECORD_ACTION_IDS,
  buildRecordActionContext,
  buildToolbarActionContext,
  mergeDefinitionsNewFirst,
} from '../_util/crud/actions'
import {
  createDefaultBulkActions,
  createDefaultRecordActions,
  createDefaultToolbarActions,
} from '../_util/crud/defaultActions'
import type {DefaultCrudEntity} from '../_util/crud/useCollectionData'
import type {BasicCrudQueryEmits, BasicCrudQueryProps, BasicCrudQuerySlots} from './types'

type TEntity = DefaultCrudEntity
type TBody = DefaultCrudEntity
type TId = string | number

export interface UseCrudActionsOptions {
  emit: Pick<
    SetupContext<BasicCrudQueryEmits<TEntity, TId>, SlotsType<BasicCrudQuerySlots>>,
    'emit'
  >['emit']
  locale: ComputedRef<CrudLocale>
  auth: ActionAuth
  resolver: ActionResolver
  app: ActionAppApis<TEntity>
  dataSource: Ref<TEntity[]>
  selected: Ref<TEntity[]>
  query: Ref<FilterRequest | PageRequest>
}

export function useCrudActions(props: BasicCrudQueryProps, options: UseCrudActionsOptions) {
  const {emit, locale, auth, resolver, app, dataSource, selected, query} = options

  const actionContext = computed<ToolbarActionContext<TEntity>>(() =>
    buildToolbarActionContext({
      items: dataSource.value,
      selectedItems: selected.value,
      query: query.value,
      app,
    }),
  )

  const toolbarDefinitions = computed(() => {
    if (props.toolbarActions === false) {
      return []
    }
    return mergeDefinitionsNewFirst(
      [
        ...createDefaultToolbarActions<TEntity>({
          authority: props.authority,
          locale: locale.value,
          iconClass: 'align',
          onAdd: (ctx) => {
            emit('add')
            emit('action', {id: 'add', context: ctx})
          },
        }),
        ...createDefaultBulkActions<TBody, TEntity, TId>({
          authority: props.authority,
          service: props.service,
          locale: locale.value,
          remove: (records) => app.collection.remove(records),
        }),
      ],
      Array.isArray(props.toolbarActions) ? props.toolbarActions : [],
    )
  })

  const toolbarActions = computed(() =>
    resolver.resolveToolbarActions(toolbarDefinitions.value, actionContext.value, auth),
  )

  const needsBulkSelection = computed(() =>
    toolbarDefinitions.value.some(
      (def) =>
        BUILTIN_BULK_ACTION_IDS.includes(def.id as (typeof BUILTIN_BULK_ACTION_IDS)[number]) &&
        auth.can(def.permission),
    ),
  )

  const recordDefinitions = computed(() =>
    mergeDefinitionsNewFirst(
      createDefaultRecordActions<TBody, TEntity, TId>({
        authority: props.authority,
        service: props.service,
        locale: locale.value,
        remove: (records) => app.collection.remove(records),
        onEdit: (record) => emit('edit', record),
        onDetail: (record) => emit('detail', record),
      }),
      Array.isArray(props.recordActions) ? props.recordActions : [],
    ),
  )

  function recordContext(record: TEntity) {
    return buildRecordActionContext({record, app})
  }

  const resolveRecordActions = (record: TEntity) =>
    props.recordActions === false
      ? []
      : resolver.resolveRecordActions(recordDefinitions.value, recordContext(record), auth)

  function onRecordAction(id: string, record: TEntity) {
    if (BUILTIN_RECORD_ACTION_IDS.includes(id as (typeof BUILTIN_RECORD_ACTION_IDS)[number])) {
      return
    }
    emit('action', {id, context: recordContext(record)})
  }

  const hasRecordActions = computed(
    () =>
      props.recordActions !== false &&
      recordDefinitions.value.some((def) => auth.can(def.permission)),
  )

  return {toolbarActions, needsBulkSelection, resolveRecordActions, onRecordAction, hasRecordActions}
}

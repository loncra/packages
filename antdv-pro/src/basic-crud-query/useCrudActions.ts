import type {ComputedRef, Ref, SetupContext, SlotsType} from 'vue'
import {computed} from 'vue'
import type {FilterRequest, PageRequest} from '@loncra/client/commons'
import type {CrudLocale} from '../locale'
import type {ActionAppApis, ActionAuth, ActionResolver, ToolbarActionContext,} from '../_util/crud/actions'
import {
  buildRecordActionContext,
  buildToolbarActionContext,
  BUILTIN_BULK_ACTION_IDS,
  BUILTIN_RECORD_ACTION_IDS,
  mergeDefinitionsNewFirst,
} from '../_util/crud/actions'
import {
  createDefaultBulkActions,
  createDefaultRecordActions,
  createDefaultToolbarActions,
} from '../_util/crud/defaultActions'
import type {DefaultCrudEntity} from '../_util/crud/useCollectionData'
import type {BasicCrudQueryEmits, BasicCrudQueryProps, BasicCrudQuerySlots} from './types'

export interface UseCrudActionsOptions {
  emit: Pick<
    SetupContext<BasicCrudQueryEmits<DefaultCrudEntity, string | number>, SlotsType<BasicCrudQuerySlots>>,
    'emit'
  >['emit']
  locale: ComputedRef<CrudLocale>
  auth: ActionAuth
  resolver: ActionResolver
  app: ActionAppApis<DefaultCrudEntity>
  dataSource: Ref<DefaultCrudEntity[]>
  selected: Ref<DefaultCrudEntity[]>
  query: Ref<FilterRequest | PageRequest>
}

export function useCrudActions(props: BasicCrudQueryProps, options: UseCrudActionsOptions) {
  const {emit, locale, auth, resolver, app, dataSource, selected, query} = options

  const actionContext = computed<ToolbarActionContext<DefaultCrudEntity>>(() =>
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
        ...createDefaultToolbarActions<DefaultCrudEntity>({
          authority: props.authority,
          locale: locale.value,
          iconClass: 'align',
          onAdd: (ctx) => {
            emit('add')
            emit('action', {id: 'add', context: ctx})
          },
        }),
        ...createDefaultBulkActions<DefaultCrudEntity, DefaultCrudEntity, string | number>({
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
      createDefaultRecordActions<DefaultCrudEntity, DefaultCrudEntity, string | number>({
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

  function recordContext(record: DefaultCrudEntity) {
    return buildRecordActionContext({record, app})
  }

  const resolveRecordActions = (record: DefaultCrudEntity) =>
    props.recordActions === false
      ? []
      : resolver.resolveRecordActions(recordDefinitions.value, recordContext(record), auth)

  function onRecordAction(id: string, record: DefaultCrudEntity) {
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

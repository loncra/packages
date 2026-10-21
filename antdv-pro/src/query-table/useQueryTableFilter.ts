import {type Ref} from 'vue'
import type {FilterRequest, PageRequest} from '@loncra/client/commons'
import {patchQuery} from '../_util/crud/useCollectionData'
import type {SearchableColumnType} from './types'

export interface UseQueryTableFilterOptions<TEntity extends object> {
  query: Ref<FilterRequest | PageRequest>
  tableColumns: Ref<SearchableColumnType<TEntity>[]>
  fetch: () => void
}

export function useQueryTableFilter<TEntity extends object>(
  options: UseQueryTableFilterOptions<TEntity>,
) {
  const {query, tableColumns, fetch} = options

  function doSearch(
    column: SearchableColumnType<TEntity>,
    setSelectedKeys: (keys: string[]) => void,
    confirm: () => void,
  ) {
    if (column.search?.queryName) {
      const value = query.value[column.search.queryName] ?? ''
      const keys = value !== '' && value != null ? [String(value)] : []
      setSelectedKeys(keys)
    }
    confirm()
    fetch()
  }

  function updateField(column: SearchableColumnType<TEntity>, value: unknown): void {
    const queryName = column.search?.queryName
    if (queryName) {
      patchQuery(query, {[queryName]: value})
    }
  }

  function clear(confirm: () => void, setSelectedKeys: (keys: string[]) => void) {
    const patch: FilterRequest = {}
    for (const column of tableColumns.value) {
      if (!column.search?.queryName) {
        continue
      }
      patch[column.search.queryName] = ''
      column.filteredValue = null
    }
    patchQuery(query, patch)
    setSelectedKeys([])
    confirm()
    fetch()
  }

  function resetField(
    column: SearchableColumnType<TEntity>,
    setSelectedKeys: (keys: string[]) => void,
    confirm: () => void,
  ) {
    updateField(column, '')
    setSelectedKeys([])
    confirm()
    fetch()
  }

  function onFilterEnterKey(
    e: KeyboardEvent,
    column: SearchableColumnType<TEntity>,
    setSelectedKeys: (keys: string[]) => void,
    confirm: () => void,
  ) {
    if (e.key !== 'Enter' || e.shiftKey) {
      return
    }
    const el = e.target as HTMLElement | null
    if (!el || el.tagName === 'TEXTAREA' || el.isContentEditable) {
      return
    }
    if (el.closest('.ant-select') || el.closest('.ant-picker')) {
      return
    }
    const input = el.closest('input')
    if (!input) {
      return
    }
    if (['button', 'checkbox', 'radio'].includes(input.type)) {
      return
    }
    e.preventDefault()
    doSearch(column, setSelectedKeys, confirm)
  }

  return {doSearch, clear, resetField, onFilterEnterKey, updateField}
}

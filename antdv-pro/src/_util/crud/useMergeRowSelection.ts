import type {TableProps} from 'antdv-next'
import type {Key} from 'antdv-next/dist/table/interface'
import type {MaybeRef, Ref} from 'vue'
import {computed, unref} from 'vue'
import {type BasicIdMetadata, SYSTEM_CONSTANT} from '@loncra/client/commons'

type RowSelection = NonNullable<TableProps['rowSelection']>

export function useMergeRowSelection<
  TEntity extends BasicIdMetadata<TId>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
>(
  external: MaybeRef<RowSelection | false | null | undefined>,
  selectedRows: Ref<TEntity[]>,
  /** 主键字段名，跟随列表的 rowKey；缺省 id */
  idKey: keyof TEntity & string = SYSTEM_CONSTANT.ID_NAME,
) {
  const onChange: NonNullable<RowSelection>['onChange'] = (_keys, rows, info) => {
    selectedRows.value = rows as TEntity[]
    const ext = unref(external)
    if (ext && typeof ext === 'object') {
      ext.onChange?.(_keys, rows, info)
    }
  }

  const rowSelection = computed((): RowSelection | undefined => {
    const ext = unref(external)
    if (!ext) {
      return undefined
    }
    const {onChange: _ignored, selectedRowKeys, ...rest} = ext
    const keys = selectedRows.value
      // idKey 是调用方指定的主键字段（默认 id），这里按契约当 TId 用
      .map((row) => row[idKey] as TId | undefined)
      .filter((id): id is NonNullable<TId> => id != null)
    return {
      ...rest,
      selectedRowKeys: selectedRowKeys ?? (keys as Key[]),
      onChange,
    }
  })

  return {rowSelection}
}

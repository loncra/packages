import type {TableProps} from 'antdv-next'
import {SYSTEM_CONSTANT} from '@loncra/client/commons'

/**
 * 取记录的主键：`rowKey` 可以是字段名，也可以是 antd 风格的取键函数；缺省 `SYSTEM_CONSTANT.ID_NAME`。
 *
 * antd 的 Table 自己认 `rowKey`；卡片网格（以及选择态合并）需要自己做身份判断与 key，
 * 两边共用这一份规则，别各自写死 `id`。
 */
export function resolveRowKey<TEntity extends object>(
  rowKey: TableProps['rowKey'] | undefined,
  record: TEntity,
): unknown {
  if (typeof rowKey === 'function') {
    return rowKey(record)
  }
  return (record as Record<string, unknown>)[rowKey ?? SYSTEM_CONSTANT.ID_NAME]
}

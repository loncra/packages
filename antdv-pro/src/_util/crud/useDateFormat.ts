import dayjs from 'dayjs'
import {useCrudConfig} from '../../crud-config-provider'
import {dayjsFormat, type DateLike} from './dateUtils'

/**
 * 宿主不注入格式时的兜底：ISO 形态（`CrudConfigProvider.dateFormat` / `dateTimeFormat` 可覆盖）。
 * 注意这是**显示**格式；后端要的时间格式由宿主自己管，pro 不碰。
 */
export const DEFAULT_DATE_FORMAT = 'YYYY-MM-DD'
export const DEFAULT_DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss'

/** 显示用日期格式（dayjs token，如 `YYYY-MM-DD`）。宿主不注入就用上面的默认值。 */
export interface DateFormatConfig {
  /** 纯日期 */
  dateFormat?: string
  /** 日期 + 时间 */
  dateTimeFormat?: string
}

/**
 * `useDateFormat()` 的返回：两个**只做显示**的函数。
 * 入参收 `unknown`：不是日期形状（含空值）一律返回空串，单元格不会炸。
 */
export interface DateFormatApi {
  /** 纯日期 */
  dateFormat: (value: unknown) => string
  /** 日期 + 时间 */
  dateTimeFormat: (value: unknown) => string
}

/** 值是不是 dayjs 能吃的形状（空值也算：`dayjsFormat` 对空值本来就返回空串） */
function isDateLike(value: unknown): value is DateLike {
  return (
    value == null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    value instanceof Date ||
    dayjs.isDayjs(value)
  )
}

/**
 * 显示用日期格式化。格式串来自 `CrudConfigProvider`（宿主注入 `import.meta.env.VITE_APP_DATE*_FORMAT`），
 * 没挂 provider 就用默认的 ISO 形态。
 *
 * pro 只做显示：后端要的时间格式不在 pro 里，也不读 `import.meta.env`。
 */
export function useDateFormat(): DateFormatApi {
  const config = useCrudConfig()
  const format = (value: unknown, pattern: string) =>
    isDateLike(value) ? dayjsFormat(value, pattern) : ''

  return {
    dateFormat: (value: unknown) =>
      format(value, config.value.dateFormat ?? DEFAULT_DATE_FORMAT),
    dateTimeFormat: (value: unknown) =>
      format(value, config.value.dateTimeFormat ?? DEFAULT_DATE_TIME_FORMAT),
  }
}

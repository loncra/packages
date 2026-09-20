import dayjs, {type Dayjs} from 'dayjs'

/** dayjs 能吃、且 crud 页面里会遇到的日期值形状（空值也算：格式化结果是空串） */
export type DateLike = string | number | Date | Dayjs | null | undefined

/**
 * 格式化日期时间（通用函数）
 * 使用 dayjs 库将各种日期类型转换为指定格式的字符串
 *
 * @param value - 要格式化的日期值，可以是字符串、数字、Date 对象或 Dayjs 对象
 * @param format - 格式化模板字符串，例如 'YYYY-MM-DD HH:mm:ss'
 * @returns 格式化后的日期字符串，如果值为空则返回空字符串
 *
 * @example
 * ```typescript
 * dayjsFormat(new Date(), 'YYYY-MM-DD') // "2024-01-01"
 * dayjsFormat('2024-01-01', 'YYYY年MM月DD日') // "2024年01月01日"
 * ```
 */
export function dayjsFormat(value: DateLike, format: string): string {
  // 如果值为空，返回空字符串
  if (!value || value === '') {
    return ''
  }

  // 如果已经是 dayjs 对象，直接格式化
  if (dayjs.isDayjs(value)) {
    return value.format(format)
  }

  // 否则转换为 dayjs 对象后格式化
  return dayjs(value).format(format)
}

/** 日期选择器用：把早于 `targetTime` 的日期禁掉（按天比较，无效值不限制） */
export function disableDate(current: Dayjs, targetTime: Dayjs) {
  const show = targetTime
  if (show == null) return false
  const showTime = dayjs(show)
  if (!showTime.isValid()) return false
  return current.isBefore(showTime, 'day')
}

/** 时间选择器用：与 `targetTime` 同一天时，把早于它的时/分/秒禁掉 */
export function disableTime(current: Dayjs | null, targetTime: Dayjs) {
  const show = targetTime
  if (show == null || current == null) return {}
  const showTime = dayjs(show)
  if (!showTime.isValid() || !current.isSame(showTime, 'day')) {
    return {}
  }
  const h = showTime.hour()
  const m = showTime.minute()
  const s = showTime.second()
  const before = (end: number) => Array.from({length: end}, (_, i) => i)
  return {
    disabledHours: () => before(h),
    disabledMinutes: (hour: number) => {
      if (hour < h) return before(60)
      if (hour > h) return []
      return before(m)
    },
    disabledSeconds: (hour: number, minute: number) => {
      if (hour < h || minute < m) return before(60)
      if (hour > h || minute > m) return []
      return before(s)
    },
  }
}

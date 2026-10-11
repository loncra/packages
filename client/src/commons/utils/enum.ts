import {TIME_UNIT_TYPE} from '../enumerate.ts'
import type {NameValueEnumMetadata, TimeProperties} from '../domain/common.ts'

export function isNameValueEnumMetadata<TValue>(
  value: NameValueEnumMetadata<TValue> | TValue,
): value is NameValueEnumMetadata<TValue> {
  if (value === null || value === undefined) {
    return false
  }
  if (typeof value !== 'object') {
    return false
  }
  return 'value' in value && 'name' in value
}

export function getEnumValue<TValue>(value: NameValueEnumMetadata<TValue> | TValue): TValue {
  if (isNameValueEnumMetadata(value)) {
    return value.value
  }
  return value as TValue
}

export function isEnumValue<TValue>(
  value: NameValueEnumMetadata<TValue> | TValue,
  expected: TValue,
): boolean {
  return getEnumValue(value) === expected
}

export function getEnumName<TValue>(value: NameValueEnumMetadata<TValue> | TValue): string {
  if (isNameValueEnumMetadata(value)) {
    return value.name
  }
  return String(value)
}

export function timeToMs(time: TimeProperties): number {
  const value = time.value
  switch (time.unit) {
    case TIME_UNIT_TYPE.NANOSECONDS:
      return value / 1e6
    case TIME_UNIT_TYPE.MICROSECONDS:
      return value / 1e3
    case TIME_UNIT_TYPE.MILLISECONDS:
      return value
    case TIME_UNIT_TYPE.MINUTES:
      return value * 60_000
    case TIME_UNIT_TYPE.HOURS:
      return value * 3_600_000
    case TIME_UNIT_TYPE.DAYS:
      return value * 86_400_000
    default:
      return value * 1000
  }
}

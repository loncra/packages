import type {NameValueEnumMetadata} from '../domain/common.ts'

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

export function getEnumName<TValue>(value: NameValueEnumMetadata<TValue> | TValue): string {
  if (isNameValueEnumMetadata(value)) {
    return value.name
  }
  return String(value)
}

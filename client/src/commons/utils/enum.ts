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

/**
 * 值是否等于期望的枚举值 —— `getEnumValue(value) === expected` 的**判定版**。
 *
 * 后端枚举字段常是"裸值"或 `{name, value}` 两种形状（见 `getEnumValue`）⇒ 想比较就得先取值。
 * **这个判定的实现全平台只有这一份**，业务里别再写一遍 `getEnumValue(x) === CONST`。
 */
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

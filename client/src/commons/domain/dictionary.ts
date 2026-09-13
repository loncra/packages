import type {NameValueEnumMetadata} from './common.ts'

export interface DataDictionaryMetadata {
  code: string
  name: string
  parentId?: number
  value?: string | number | boolean | null
  valueType: NameValueEnumMetadata<number> | number
  level?: string
  children?: DataDictionaryMetadata[]
  metadata?: Record<string, unknown>
}

import type {DataDictionaryMetadata, NameValueEnumMetadata, VersionEntityMetadata} from '../../commons'

export interface PluginPackageMetadata extends VersionEntityMetadata {
  name: string
  packageKey: string
  summary?: string
  tags?: string[]
  additionalInformation?: string
  origin: NameValueEnumMetadata<number> | number
  status: NameValueEnumMetadata<number> | number
  type: NameValueEnumMetadata<number> | number
  icon: string
  category?: DataDictionaryMetadata
}

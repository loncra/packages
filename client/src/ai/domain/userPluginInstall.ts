import type {IdNameValueMetadata, IdValueMetadata, NameValueEnumMetadata} from '../../commons'
import type {McpPackageEntity} from './mcp.ts'
import type {SkillPackageEntity} from './skill.ts'
import type {ExecutionChannel} from '../enumerate.ts'

export interface UserPluginMetadata {
  targetType: string
  packageId: number
  scope?: NameValueEnumMetadata<number> | number
  workspaceScope?: NameValueEnumMetadata<number> | number
  workspaces?: IdValueMetadata<string, ExecutionChannel>[]
}

export interface UserPluginInstallMetadata {
  type: NameValueEnumMetadata<string> | string
}

export interface UserPluginRequestBody extends UserPluginMetadata{
  scope?: number
  workspaceScope: number
  workspaces?: IdValueMetadata<string, ExecutionChannel>[]
}

export interface UserPluginSkillMetadata extends UserPluginInstallMetadata{
  releaseVersion: string
  releaseId: number
  contentHash:string
  updatePolicy:NameValueEnumMetadata<number>| number
}

export interface UserPluginMcpMetadata extends UserPluginInstallMetadata{
  authMode:NameValueEnumMetadata<number> | number
  key:string;
}

export interface UserPluginInstallResult {
  id?: number
  targetType?: NameValueEnumMetadata<string> | string
  workspaceScope?: NameValueEnumMetadata<number> | number
  status?: NameValueEnumMetadata<number> | number
  scope:NameValueEnumMetadata<number> | number
  workspace?: IdNameValueMetadata<ExecutionChannel>
  metadata: UserPluginInstallMetadata
  pluginPackage: McpPackageEntity | SkillPackageEntity
}

export interface PluginInstallGroup {
  enterprise?: UserPluginInstallResult
  userAll?: UserPluginInstallResult
  workspaces: UserPluginInstallResult[]
}

import type {IdNameMetadata, NameValueEnumMetadata} from '../../commons'
import type {McpPackageEntity} from './mcp.ts'
import type {SkillPackageEntity} from './skill.ts'

export interface UserPluginInstallRequestBody {
  targetType: number
  packageId: number
  workspaceScope: number
  agentConversationIds?: number[]
}

export interface UserPluginInstallMetadata {
  releaseVersion?: string
  releaseId?: number
}

export interface UserPluginInstallResult {
  id?: number
  targetType?: NameValueEnumMetadata<number> | number
  packageId?: number
  workspaceScope?: NameValueEnumMetadata<number> | number
  status?: NameValueEnumMetadata<number> | number
  workspaces?: IdNameMetadata[]
  metadata?: UserPluginInstallMetadata
  pluginPackage?: McpPackageEntity | SkillPackageEntity
}

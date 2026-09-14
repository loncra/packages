import type {NameValueEnumMetadata, TimeProperties} from '../../commons'
import type {AI_SERVER_MCP_CLIENT_TYPE} from '../enumerate.ts'
import type {PluginPackageMetadata} from './plugin.ts'

export type McpClientType =
  | typeof AI_SERVER_MCP_CLIENT_TYPE.SSE
  | typeof AI_SERVER_MCP_CLIENT_TYPE.STDIO
  | typeof AI_SERVER_MCP_CLIENT_TYPE.STREAMABLE_HTTP

export interface McpToolMetadata {
  name: string
  title: string
  description: string
  annotation: ToolAnnotationMetadata
}

export interface ToolAnnotationMetadata {
  title: string
  readOnlyHint: boolean
  destructiveHint: boolean
  idempotentHint: boolean
  openWorldHint: boolean
  returnDirect: boolean
}

export interface McpClarifyToolPolicyMetadata {
  toolName: string
  maxClarifyRounds?: number | null
  enabled: NameValueEnumMetadata<number> | number
  description?: string
  annotation: ToolAnnotationMetadata
}

export interface McpClientTransportMetadata {
  type: McpClientType | string
}

export interface StdioMcpClientTransportMetadata extends McpClientTransportMetadata {
  type: typeof AI_SERVER_MCP_CLIENT_TYPE.STDIO
  command?: string
  args?: string[]
  env?: Record<string, string>
}

export interface SseMcpClientTransportMetadata extends McpClientTransportMetadata {
  type: typeof AI_SERVER_MCP_CLIENT_TYPE.SSE | typeof AI_SERVER_MCP_CLIENT_TYPE.STREAMABLE_HTTP
  baseUrl?: string
  endpoint: string
  timeout: TimeProperties
  headers?: Record<string, string[]>
  queryParams?: Record<string, string[]>
}

export interface StreamableHttpMcpClientTransportMetadata extends SseMcpClientTransportMetadata {
  type: typeof AI_SERVER_MCP_CLIENT_TYPE.STREAMABLE_HTTP
  openConnectionOnStartup?: boolean | number
  resumableStreams?: boolean | number
}

export interface McpPackageMetadata {
  client: McpClientTransportMetadata
  clarifyPolicies: McpClarifyToolPolicyMetadata[]
}

export interface McpPackageSavePayload extends PluginPackageMetadata {
  authMode: NameValueEnumMetadata<number> | number
  dynamicActivation: NameValueEnumMetadata<number> | number
  initializeTimeout: TimeProperties
  metadata: McpPackageMetadata
}

export interface McpPackageEntity extends McpPackageSavePayload {}

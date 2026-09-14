export const AI_SERVER_AGENT_CONTENT_TYPE = {
  THINK: 'think',
  TOOL: 'tool',
  ANSWER: 'answer',
  ERROR: 'error',
  AGENT_STATUS_CHANGE: 'agentStatusChange',
  TOKEN_USAGE: 'tokenUsage',
  STREAM_START: 'streamStart',
  STREAM_STOP: 'streamStop',
  STREAM_END: 'streamEnd',
  ASSISTANT: 'assistant',
  GENERATE_CONVERSATION_NAME: 'generateConversationName',
} as const

export const AI_SERVER_AGENT_CONVERSATION_TYPE = {
  DEFAULT_WORKSPACE: 10,
  CUSTOMIZE_WORKSPACE: 20,
  WORKSPACE_CONVERSATION: 30,
} as const

export const AI_SERVER_AGENT_CHAT_STATUS = {
  READY: 10,
  RUNNING: 20,
  REQUEST_STOP: 25,
  STOPPED: 30,
  COMPLETED: 35,
  FAILED: 40,
} as const

export const AI_SERVER_AGENT_BLOCK_STATUS = {
  READY: 'ready',
  PENDING: 'pending',
  RUNNING: 'running',
  DONE: 'done',
  FAILED: 'failed',
} as const

export const AI_SERVER_AGENT_TOOL_BLOCK_STATUS = {
  PENDING: 'pending',
  ASKING: 'asking',
  ALLOWED: 'allowed',
  SUBMITTED: 'submitted',
  FINISHED: 'finished',
} as const

export const AI_SERVER_MCP_CLIENT_TYPE = {
  SSE: 'sse',
  STDIO: 'stdio',
  STREAMABLE_HTTP: 'streamableHttp',
} as const

export const AI_SERVER_SKILL_SOURCE_TYPE = {
  MANUAL: 20,
  GIT: 10,
} as const

export const AI_SERVER_SKILL_UPDATE_POLICY = {
  MANUAL: 10,
  AUTOMATIC: 20,
} as const

export const AI_SERVER_MODEL_TYPE = {
  CHAT: 10,
  IMAGE: 20,
  VIDEO: 30,
  VOICE: 40,
  MUSIC: 50,
} as const

export const AI_SERVER_PACKAGE_TYPE = {
  SYSTEM: 10,
  HUB: 20,
} as const

export const AI_SERVER_PLUGIN_TARGET_TYPE = {
  SKILL: 10,
  MCP: 20,
} as const

export const AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE = {
  USER: 10,
  ORG: 20,
} as const

export const AI_SERVER_PLUGIN_INSTALL_STATUS = {
  PENDING: 10,
  ACTIVATED: 20,
  DISABLED: 30,
} as const

export const AGENT_CONTENT_TYPE = {
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

export const AGENT_CONVERSATION_TYPE = {
  DEFAULT_WORKSPACE: 10,
  CUSTOMIZE_WORKSPACE: 20,
  WORKSPACE_CONVERSATION: 30,
} as const

export const AGENT_CHAT_STATUS = {
  READY: 10,
  RUNNING: 20,
  REQUEST_STOP: 25,
  STOPPED: 30,
  COMPLETED: 35,
  FAILED: 40,
} as const

export const AGENT_BLOCK_STATUS = {
  READY: 'ready',
  PENDING: 'pending',
  RUNNING: 'running',
  DONE: 'done',
  FAILED: 'failed',
} as const

export const AGENT_TOOL_BLOCK_STATUS = {
  PENDING: 'pending',
  ASKING: 'asking',
  ALLOWED: 'allowed',
  SUBMITTED: 'submitted',
  FINISHED: 'finished',
} as const

export const MODEL_SETTING_MANUFACTURER_CODE_PREFIX = 'system.ai.model'
export const MCP_GROUP_CODE_PREFIX = 'system.ai.mcp.group'
export const SKILL_GROUP_CODE_PREFIX = 'system.ai.skill.group'

export const MODEL_DEFAULT_OPTIONS_KEY = 'options'

export const MODEL_GENERATE_OPTION_KEYS = [
  'temperature',
  'topP',
  'topK',
  'maxTokens',
  'maxCompletionTokens',
  'frequencyPenalty',
  'presencePenalty',
  'seed',
  'thinkingBudget',
  'reasoningEffort',
  'cacheControl',
  'parallelToolCalls',
  'stream',
] as const

export type ModelGenerateOptionKey = (typeof MODEL_GENERATE_OPTION_KEYS)[number]

export const MODEL_GENERATE_OPTION_NUMBER_KEYS = [
  'temperature',
  'topP',
  'topK',
  'maxTokens',
  'maxCompletionTokens',
  'frequencyPenalty',
  'presencePenalty',
  'seed',
  'thinkingBudget',
] as const satisfies ReadonlyArray<ModelGenerateOptionKey>

export const MODEL_GENERATE_OPTION_BOOLEAN_KEYS = [
  'cacheControl',
  'parallelToolCalls',
  'stream',
] as const satisfies ReadonlyArray<ModelGenerateOptionKey>

export const MODEL_GENERATE_OPTION_STRING_KEYS = [
  'reasoningEffort',
] as const satisfies ReadonlyArray<ModelGenerateOptionKey>

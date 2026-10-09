import {getEnumName} from '@loncra/client/commons'
import type {AgentTokenUsage} from './types.ts'

export type {AgentTokenUsage} from './types.ts'

type TokenField = 'inputTokens' | 'outputTokens' | 'cachedTokens'

function usages(item: {metadata?: {tokenUsage?: AgentTokenUsage[]}}): AgentTokenUsage[] {
  return item.metadata?.tokenUsage ?? []
}

export function countTokenUsage(
  item: {metadata?: {tokenUsage?: AgentTokenUsage[]}},
  field?: TokenField,
): number {
  const contents = usages(item)
  if (field) {
    return contents.reduce((acc, cur) => acc + cur[field], 0)
  }
  return contents.reduce((acc, cur) => acc + cur.inputTokens + cur.outputTokens, 0)
}

export function eachTokenUsage(
  item: {metadata?: {tokenUsage?: AgentTokenUsage[]}},
  field: TokenField,
): Array<{id: string; value: number}> {
  return usages(item).map((row) => ({id: getEnumName(row.usageType), value: row[field]}))
}

export function cacheHitRate(item: {metadata?: {tokenUsage?: AgentTokenUsage[]}}): number {
  const totalInput = countTokenUsage(item, 'inputTokens')
  const totalCached = countTokenUsage(item, 'cachedTokens')
  const denominator = totalInput + totalCached
  if (denominator === 0) {
    return 0
  }
  return Math.round((totalCached / denominator) * 100)
}

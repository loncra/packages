import {rcompare, valid} from 'semver'

export function pickLatest(options: ReadonlyArray<{value?: unknown}> | undefined): string | undefined {
  if (options == null || options.length === 0) {
    return undefined
  }
  const versions = options
    .map((item) => item.value)
    .filter((value): value is string => typeof value === 'string' && valid(value) != null)
  if (versions.length > 0) {
    return [...versions].sort(rcompare)[0]
  }
  const first = options[0]?.value
  return typeof first === 'string' ? first : undefined
}

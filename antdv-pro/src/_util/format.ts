/**
 * 用实际数量替换文案里的 `{count}` 占位符
 *
 * @param template - 含 `{count}` 占位符的文案
 * @param count - 实际数量
 */
export function withCount(template: string, count: number): string {
  return template.replace('{count}', String(count))
}

/**
 * 格式化字节大小为可读的字符串
 * 将字节数转换为合适的单位（bytes、KB、MB、GB 等）
 * 使用 1024 为进制进行计算
 *
 * @param bytes - 要格式化的字节数
 * @returns 格式化后的字符串，例如 "1.5 MB"
 *
 * @example
 * ```typescript
 * byteFormat(1024) // "1 KB"
 * byteFormat(1536) // "1.5 KB"
 * byteFormat(1048576) // "1 MB"
 * ```
 */
export function byteFormat(bytes: number): string {
  // 检查输入是否为有效数字
  if (isNaN(bytes)) {
    return ''
  }
  // 单位数组
  const symbols = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  // 计算对数值以确定使用哪个单位（以 2 为底）
  let exp = Math.floor(Math.log(bytes) / Math.log(2))
  if (exp < 1) {
    exp = 0
  }
  // 确定单位索引（每 10 位对应对数表示一个单位）
  const i = Math.floor(exp / 10)
  // 转换为对应单位的数值
  let formattedBytes = bytes / Math.pow(2, 10 * i)

  // 如果小数部分过长，保留两位小数
  if (formattedBytes.toString().length > formattedBytes.toFixed(2).toString().length) {
    formattedBytes = Number(formattedBytes.toFixed(2))
  }
  return formattedBytes + ' ' + symbols[i]
}

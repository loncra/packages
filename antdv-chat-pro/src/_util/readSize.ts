export function readSize(height?: string | number, maxHeight?: string | number): Record<string, string> {
  const sizeStyle: Record<string, string> = {}
  if (height != null && height !== '') {
    const value = typeof height === 'number' ? `${height}px` : height
    sizeStyle.height = value
    sizeStyle.minHeight = value
  }
  if (maxHeight != null && maxHeight !== '') {
    sizeStyle.maxHeight = typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight
  }
  return sizeStyle
}

export function updateSessionMessage<T extends {key: string | number}>(
  elements: T[],
  key: string | number,
  update: (item: T) => void,
): void {
  const found = elements.find((item) => item.key === key)
  if (found) {
    update(found)
  }
}

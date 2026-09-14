type TreeLike<T> = T & {children?: TreeLike<T>[]}

function hasTreeChildren<T>(node: TreeLike<T>): node is TreeLike<T> & {children: TreeLike<T>[]} {
  return node.children !== undefined
}

export function findFirstTreeNode<T>(
  predicate: (node: T) => boolean,
  data: TreeLike<T>[] = [],
): T | undefined {
  for (const node of data) {
    if (predicate(node as T)) {
      return node
    }
    if (hasTreeChildren(node)) {
      const found = findFirstTreeNode(predicate, node.children)
      if (found) {
        return found
      }
    }
  }
  return undefined
}

export function unmergeTree<T>(data: TreeLike<T>[] = []): T[] {
  const result: T[] = []
  for (const d of data) {
    const {children: _children, ...nodeWithoutChildren} = d
    result.push(nodeWithoutChildren as T)
    if (hasTreeChildren(d)) {
      result.push(...unmergeTree(d.children))
    }
  }
  return result
}

export function filterTreeDeep<T>(predicate: (node: T) => boolean, data: TreeLike<T>[]): T[] {
  function processNode(node: TreeLike<T>): T | null {
    let filteredChildren: T[] | undefined
    if (hasTreeChildren(node)) {
      filteredChildren = node.children
        .map(processNode)
        .filter((child): child is T => child !== null)
    }
    const selfMatches = predicate(node)
    const hasMatchingChildren = (filteredChildren?.length ?? 0) > 0
    if (!selfMatches && !hasMatchingChildren) {
      return null
    }
    if (hasTreeChildren(node)) {
      const {children: _omit, ...rest} = node
      return (hasMatchingChildren ? {...rest, children: filteredChildren} : {...rest}) as T
    }
    return {...node}
  }
  return data
    .filter((node) => node)
    .map(processNode)
    .filter((node): node is T => node !== null)
}

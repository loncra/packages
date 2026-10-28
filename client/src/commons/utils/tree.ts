import type {TreeSortMetadata} from '../domain/common.ts'

export type DropPosition = -1 | 0 | 1

export type TreeLike<T> = T & {
  children?: TreeLike<T>[]
}

export type Predicate<T> = (node: T) => boolean

export interface TreeNodeContext<T> {
  list: TreeLike<T>[]
  index: number
  node: TreeLike<T>
}

export function hasTreeChildren<T>(
  node: TreeLike<T>,
): node is TreeLike<T> & { children: TreeLike<T>[] } {
  return node.children !== undefined
}

export function findFirstTreeNode<T>(
  predicate: Predicate<T>,
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

export function findAllTreeNodes<T>(predicate: Predicate<T>, data: TreeLike<T>[] = []): T[] {
  const result: T[] = []

  for (const node of data) {
    if (predicate(node)) {
      const {children: _children, ...nodeWithoutChildren} = node
      result.push(nodeWithoutChildren as T)
    }

    if (hasTreeChildren(node)) {
      result.push(...findAllTreeNodes(predicate, node.children))
    }
  }

  return result
}

export function filterTreeDeep<T>(predicate: Predicate<T>, data: TreeLike<T>[]): T[] {
  function processNode(node: TreeLike<T>): T | null {
    let filteredChildren: T[] | undefined

    if (hasTreeChildren(node)) {
      filteredChildren = node.children!
        .map(processNode)
        .filter((child): child is T => child !== null)
    }

    const selfMatches = predicate(node)
    const hasMatchingChildren = (filteredChildren?.length ?? 0) > 0

    if (!selfMatches && !hasMatchingChildren) {
      return null
    }

    if (hasTreeChildren(node)) {
      const { children: _omit, ...rest } = node
      return (hasMatchingChildren
        ? { ...rest, children: filteredChildren! }
        : { ...rest }) as T
    }

    return { ...node }
  }

  return data
    .filter((node) => node)
    .map(processNode)
    .filter((node) => node !== null)
}

export function isTree(data: unknown[] = [], childrenKey = 'children'): boolean {
  for (const node of data) {
    if (!node || typeof node !== 'object') {
      continue
    }
    const record = node as Record<string, unknown>
    if (childrenKey in record) {
      return true
    }
    const children = record[childrenKey]
    if (Array.isArray(children) && isTree(children, childrenKey)) {
      return true
    }
  }
  return false
}

export function findTreeNodeContext<T>(
  id: unknown,
  tree: TreeLike<T>[],
  idKey: string,
  childrenKey = 'children',
): TreeNodeContext<T> | null {
  function walk(list: TreeLike<T>[]): TreeNodeContext<T> | null {
    for (let index = 0; index < list.length; index++) {
      const node = list[index]!
      if ((node as Record<string, unknown>)[idKey] === id) {
        return {list, index, node}
      }
      const children = (node as Record<string, unknown>)[childrenKey]
      if (Array.isArray(children) && children.length > 0) {
        const found = walk(children as TreeLike<T>[])
        if (found) {
          return found
        }
      }
    }
    return null
  }

  return walk(tree)
}

export function isTreeDescendant<T>(
  ancestorId: unknown,
  nodeId: unknown,
  tree: TreeLike<T>[],
  idKey: string,
  childrenKey = 'children',
): boolean {
  if (ancestorId === nodeId) {
    return false
  }
  const ancestorCtx = findTreeNodeContext(ancestorId, tree, idKey, childrenKey)
  if (!ancestorCtx) {
    return false
  }
  const children = (ancestorCtx.node as Record<string, unknown>)[childrenKey]
  if (!Array.isArray(children) || children.length === 0) {
    return false
  }
  return findFirstTreeNode((n) => (n as Record<string, unknown>)[idKey] === nodeId, children as TreeLike<T>[]) !== undefined
}

export function cloneTree<T>(data: TreeLike<T>[] = [], childrenKey = 'children'): TreeLike<T>[] {
  return data.map((node) => {
    const cloned = {...node} as TreeLike<T>
    const children = (node as Record<string, unknown>)[childrenKey]
    if (Array.isArray(children)) {
      ;(cloned as Record<string, unknown>)[childrenKey] = cloneTree(children as TreeLike<T>[], childrenKey)
    }
    return cloned
  })
}

function removeNodeFromTree<T>(
  tree: TreeLike<T>[],
  id: unknown,
  idKey: string,
  childrenKey: string,
): TreeLike<T> | null {
  const ctx = findTreeNodeContext(id, tree, idKey, childrenKey)
  if (!ctx) {
    return null
  }
  const [removed] = ctx.list.splice(ctx.index, 1)
  return removed ?? null
}

function insertTreeNode<T>(
  tree: TreeLike<T>[],
  targetId: unknown,
  node: TreeLike<T>,
  dropPosition: DropPosition,
  idKey: string,
  childrenKey: string,
): boolean {
  const targetCtx = findTreeNodeContext(targetId, tree, idKey, childrenKey)
  if (!targetCtx) {
    return false
  }

  if (dropPosition === 0) {
    const targetRecord = targetCtx.node as Record<string, unknown>
    if (!Array.isArray(targetRecord[childrenKey])) {
      targetRecord[childrenKey] = []
    }
    ;(targetRecord[childrenKey] as TreeLike<T>[]).push(node)
    return true
  }

  const insertIndex = targetCtx.index + (dropPosition === 1 ? 1 : 0)
  targetCtx.list.splice(insertIndex, 0, node)
  return true
}

export function moveTreeNode<T>(
  tree: TreeLike<T>[],
  dragId: unknown,
  targetId: unknown,
  dropPosition: DropPosition,
  idKey: string,
  childrenKey = 'children',
): TreeLike<T>[] | null {
  if (dragId === targetId) {
    return null
  }
  if (isTreeDescendant(dragId, targetId, tree, idKey, childrenKey)) {
    return null
  }

  const next = cloneTree(tree)
  const dragNode = removeNodeFromTree(next, dragId, idKey, childrenKey)
  if (!dragNode) {
    return null
  }
  if (!insertTreeNode(next, targetId, dragNode, dropPosition, idKey, childrenKey)) {
    return null
  }
  return next
}

export interface TreePlacement {
  parentId?: number
  sort: number
}

export function buildFlatPlacementMap<T>(
  list: T[] = [],
  idKey = 'id',
): Map<number, TreePlacement> {
  const map = new Map<number, TreePlacement>()
  list.forEach((node, sort) => {
    const id = (node as Record<string, unknown>)[idKey] as number
    map.set(id, {sort})
  })
  return map
}

export function buildTreePlacementMap<T>(
  tree: TreeLike<T>[] = [],
  idKey = 'id',
  childrenKey = 'children',
): Map<number, TreePlacement> {
  const map = new Map<number, TreePlacement>()

  function walk(nodes: TreeLike<T>[], parentId?: number) {
    nodes.forEach((node, sort) => {
      const id = (node as Record<string, unknown>)[idKey] as number
      map.set(id, {parentId, sort})
      const children = (node as Record<string, unknown>)[childrenKey]
      if (Array.isArray(children) && children.length > 0) {
        walk(children as TreeLike<T>[], id)
      }
    })
  }

  walk(tree)
  return map
}

export function diffTreePlacementIds(
  before: Map<number, TreePlacement>,
  after: Map<number, TreePlacement>,
): number[] {
  const changed: number[] = []
  for (const [id, next] of after) {
    const prev = before.get(id)
    if (!prev || prev.parentId !== next.parentId || prev.sort !== next.sort) {
      changed.push(id)
    }
  }
  return changed
}

export function buildTreeSortMetadata<TId extends string | number = number>(
  placement: Map<number, TreePlacement>,
  onlyIds?: number[],
): TreeSortMetadata<TId>[] {
  const idFilter = onlyIds ? new Set(onlyIds) : null
  const result: TreeSortMetadata<TId>[] = []
  for (const [id, place] of placement) {
    if (idFilter && !idFilter.has(id)) {
      continue
    }
    result.push({
      id: id as TId,
      parentId: place.parentId as TId | undefined,
      sort: place.sort,
    })
  }
  return result
}

import {h, type VNodeChild} from 'vue'
import {Button, Input, SpaceCompact, Tooltip} from 'antdv-next'
import type {ResolvedAction} from '@loncra/antdv-pro'
import type {MenuItemType} from 'antdv-next'
import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  FileAddOutlined,
  FolderAddOutlined,
  FormOutlined,
  SaveOutlined,
} from '@antdv-next/icons'
import {buildFilePaneContext, isTextTooLarge, resolveFilePaneKind, type FileViewNode} from '../file-view'
import type {AttachmentFileEditorLocale} from '../locale'
import AttachmentTextPane from './AttachmentTextPane'
import type {FileEditorNode, TextEditorEntry} from './types'
import type {useAttachmentWrite} from './useAttachmentWrite'

type WriteApi = ReturnType<typeof useAttachmentWrite>

export function createToolbarActions(
  locale: AttachmentFileEditorLocale,
  write: WriteApi,
): ResolvedAction[] {
  return [
    {
      id: 'uploadFile',
      label: locale.uploadFile,
      icon: h(FileAddOutlined),
      disabled: false,
      run: () => write.openUpload(false),
    },
    {
      id: 'uploadDirectory',
      label: locale.uploadDirectory,
      icon: h(FolderAddOutlined),
      disabled: false,
      run: () => write.openUpload(true),
    },
  ]
}

export function textEditable(node: FileEditorNode, readonly: boolean): boolean {
  if (readonly || node.dir) {
    return false
  }
  const kind = resolveFilePaneKind(buildFilePaneContext(node))
  return kind.id === 'text' && !isTextTooLarge(node.size || 0)
}

export function createMenuItems(
  locale: AttachmentFileEditorLocale,
  write: WriteApi,
): (node: FileViewNode) => MenuItemType[] {
  return (node) => {
    const current = node as FileEditorNode
    const items: MenuItemType[] = []
    if (current.dir) {
      items.push(
        {
          key: 'uploadFile',
          label: locale.uploadFile,
          icon: () => h(FileAddOutlined),
          onClick: () => write.openUpload(false, current),
        },
        {
          key: 'uploadDirectory',
          label: locale.uploadDirectory,
          icon: () => h(FolderAddOutlined),
          onClick: () => write.openUpload(true, current),
        },
      )
    }
    items.push(
      {
        key: 'rename',
        label: locale.rename,
        icon: () => h(FormOutlined),
        onClick: () => write.beginRename(current),
      },
      {type: 'divider', key: `${current.id}-divider`} as MenuItemType,
      {
        key: 'delete',
        label: locale.delete,
        danger: true,
        icon: () => h(DeleteOutlined),
        onClick: () => write.removeNode(current),
      },
    )
    return items
  }
}

export function createWriteSlots(options: {
  locale: AttachmentFileEditorLocale
  bucket: string
  write: WriteApi
  entries: Record<string, TextEditorEntry>
  register: (id: string, entry: TextEditorEntry | undefined) => void
  readonly: boolean
}) {
  const {locale, write, entries, register, bucket, readonly} = options
  return {
    title: ({node}: {node: FileEditorNode}): VNodeChild => {
      if (!node.editing || readonly) {
        return null
      }
      return (
        <div onClick={(event: Event) => event.stopPropagation()} onMousedown={(event: Event) => event.stopPropagation()}>
        <SpaceCompact size="small" block>
          <Input
            value={node.editName}
            onUpdate:value={(value: string) => {
              node.editName = value
            }}
            onPressEnter={() => {
              void write.commitRename(node)
            }}
          />
          <Button type="primary" onClick={() => write.commitRename(node)}>
            {{icon: () => h(CheckOutlined)}}
          </Button>
          <Button type="primary" danger onClick={() => write.cancelRename(node)}>
            {{icon: () => h(CloseOutlined)}}
          </Button>
        </SpaceCompact>
        </div>
      )
    },
    tabExtra: ({node}: {node: FileEditorNode}) => {
      const entry = entries[node.id]
      if (!entry?.dirty) {
        return null
      }
      return (
        <Tooltip title={locale.save}>
          <Button size="small" onClick={() => entry.save()}>
            {{icon: () => h(SaveOutlined)}}
          </Button>
        </Tooltip>
      )
    },
    pane: ({node}: {node: FileEditorNode}) => {
      if (!textEditable(node, readonly)) {
        return null
      }
      return <AttachmentTextPane node={node} bucket={bucket} register={register} />
    },
  }
}

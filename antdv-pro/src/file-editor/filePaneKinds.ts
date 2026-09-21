import type {LanguageSupport} from '@codemirror/language'
import type {ObjectItemInfo} from '@loncra/client/resource'
import {resolveDisplayName} from '../_util/attachmentList'
import {AUDIO_EXT, IMAGE_EXT, TEXT_MAX_BYTES, VIDEO_EXT} from './constants'
import type {FilePaneContext, ResolvedFilePaneKind} from './types'

function extOf(name: string): string {
  const base = name.replace(/\/$/, '').split('/').pop() ?? name
  const i = base.lastIndexOf('.')
  return i <= 0 ? '' : base.slice(i + 1).toLowerCase()
}

export function buildFilePaneContext(item: ObjectItemInfo): FilePaneContext {
  const name = resolveDisplayName(item)
  const mime = (item.userMetadata?.['Content-Type'] || '').toLowerCase()
  return {name, mime, ext: extOf(name), size: item.size || 0}
}

export function resolveFilePaneKind(ctx: FilePaneContext): ResolvedFilePaneKind {
  if (ctx.mime.startsWith('image/') || IMAGE_EXT.has(ctx.ext)) {
    return {id: 'image', mode: 'view'}
  }
  if (ctx.mime.startsWith('video/') || VIDEO_EXT.has(ctx.ext)) {
    return {id: 'video', mode: 'view'}
  }
  if (ctx.mime.startsWith('audio/') || AUDIO_EXT.has(ctx.ext)) {
    return {id: 'audio', mode: 'view'}
  }
  return {id: 'text', mode: 'edit'}
}

export function isTextTooLarge(size: number): boolean {
  return size > TEXT_MAX_BYTES
}

export async function loadLanguage(ext: string): Promise<LanguageSupport | undefined> {
  switch (ext) {
    case 'md':
    case 'markdown':
      return (await import('@codemirror/lang-markdown')).markdown()
    case 'json':
      return (await import('@codemirror/lang-json')).json()
    case 'js':
    case 'mjs':
    case 'cjs':
    case 'jsx':
      return (await import('@codemirror/lang-javascript')).javascript()
    case 'ts':
    case 'tsx':
      return (await import('@codemirror/lang-javascript')).javascript({typescript: true})
    case 'py':
      return (await import('@codemirror/lang-python')).python()
    case 'yml':
    case 'yaml':
      return (await import('@codemirror/lang-yaml')).yaml()
    case 'html':
    case 'htm':
    case 'vue':
      return (await import('@codemirror/lang-html')).html()
    case 'css':
      return (await import('@codemirror/lang-css')).css()
    case 'xml':
      return (await import('@codemirror/lang-xml')).xml()
    default:
      return undefined
  }
}

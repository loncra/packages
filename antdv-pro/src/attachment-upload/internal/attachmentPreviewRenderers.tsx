import {h, type Component, type VNodeChild} from 'vue'
import {
  FileImageOutlined,
  FileUnknownOutlined,
  FolderOutlined,
  PlayCircleOutlined,
} from '@antdv-next/icons'
import {BasicImage, classNames} from '@loncra/antdv'
import type {
  AttachmentFileKind,
  AttachmentPreviewRenderer,
  AttachmentPreviewRendererContext,
} from '../types'

function kindIcon(
  ctx: AttachmentPreviewRendererContext,
  icon: Component,
): VNodeChild {
  return (
    <span class={classNames(ctx.hashId, `${ctx.prefixCls}-thumb-fallback`)}>
      {ctx.itemIcon ?? h(icon, {class: classNames(ctx.hashId, `${ctx.prefixCls}-file-icon`)})}
    </span>
  )
}

function renderImage(ctx: AttachmentPreviewRendererContext): VNodeChild {
  if (ctx.file.thumbUrl) {
    return <BasicImage preview={false} {...({src: ctx.file.thumbUrl} as Record<string, unknown>)} />
  }
  return kindIcon(ctx, FileImageOutlined)
}

function renderVideo(ctx: AttachmentPreviewRendererContext): VNodeChild {
  if (ctx.file.thumbUrl) {
    return <BasicImage preview={false} {...({src: ctx.file.thumbUrl} as Record<string, unknown>)} />
  }
  return kindIcon(ctx, PlayCircleOutlined)
}

const BUILTIN_THUMB_RENDERERS = {
  image: renderImage,
  video: renderVideo,
  directory: (ctx: AttachmentPreviewRendererContext) => kindIcon(ctx, FolderOutlined),
  other: (ctx: AttachmentPreviewRendererContext) => kindIcon(ctx, FileUnknownOutlined),
} satisfies Record<AttachmentFileKind, AttachmentPreviewRenderer>

export default BUILTIN_THUMB_RENDERERS

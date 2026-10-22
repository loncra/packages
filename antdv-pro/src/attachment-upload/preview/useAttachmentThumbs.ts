import {type Ref, watch} from 'vue'
import type {ObjectWriteResult} from '@loncra/client/resource'
import type {UploadFile} from 'antdv-next/dist/upload/interface'
import {getImageBase64, getVideoThumbnail} from '../../_util/media'

/**
 * 缩略图补齐：列表变化后给没缩略图的文件补 `thumbUrl`
 * （图片有 url 直接用；本地图片走 base64；视频抽帧）。内部有 thumbUrl 早退，watch 不会无限循环。
 */
export function useAttachmentThumbs(options: {
  fileList: Ref<UploadFile<ObjectWriteResult>[]>
  enabled: () => boolean
}) {
  const {fileList, enabled} = options

  function patchFile(uid: string, patch: Partial<UploadFile<ObjectWriteResult>>): void {
    fileList.value = (fileList.value ?? []).map((f) => (f.uid === uid ? {...f, ...patch} : f))
  }

  async function ensureImageThumbUrl(file: UploadFile<ObjectWriteResult>): Promise<string | undefined> {
    if (file.url) {
      return file.url
    }
    return file.originFileObj ? await getImageBase64(file.originFileObj) : undefined
  }

  async function ensureThumbUrl(file: UploadFile<ObjectWriteResult>): Promise<void> {
    const type = file.type ?? ''
    if (type === 'directory' || file.thumbUrl) {
      return
    }
    if (type.includes('image/')) {
      const thumbUrl = await ensureImageThumbUrl(file)
      if (thumbUrl) {
        patchFile(file.uid, {thumbUrl})
      }
      return
    }
    if (type.includes('video/') && file.originFileObj) {
      const result = await getVideoThumbnail(file.originFileObj)
      patchFile(file.uid, {thumbUrl: result.base64, url: result.videoUrl})
    }
  }

  watch(
    fileList,
    () => {
      if (!enabled()) {
        return
      }
      ;(fileList.value ?? []).forEach((f) => {
        void ensureThumbUrl(f)
      })
    },
    {immediate: true, deep: true},
  )
}

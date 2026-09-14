export interface VideoThumbnailResult {
  base64: string
  videoUrl: string
}

export function getImageBase64(file: File | undefined): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject('file is undefined')
      return
    }
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

export function getVideoThumbnail(file: File): Promise<VideoThumbnailResult> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Failed to get canvas context'))
      return
    }

    video.src = url
    video.muted = true
    video.playsInline = true

    video.addEventListener('loadedmetadata', () => {
      video.currentTime = 0.1
    })

    video.addEventListener('seeked', () => {
      canvas.width = 150
      canvas.height = 150
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
      resolve({
        base64: dataUrl,
        videoUrl: url,
      })
    })

    video.addEventListener('error', reject)
  })
}

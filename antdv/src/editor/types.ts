export type EditorLocale = 'zh-CN' | 'en-US' | Record<string, string>

export type UploadFn = (file: File, onProgress: (percent: number) => void) => Promise<string>

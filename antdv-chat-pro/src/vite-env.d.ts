/// <reference types="vite/client" />

declare module 'unicode-emoji-json/data-by-group.json' {
  const data: {
    name: string
    slug: string
    emojis: {
      emoji: string
      name: string
    }[]
  }[]
  export default data
}

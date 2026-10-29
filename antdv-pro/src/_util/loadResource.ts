import type {IconfontJson} from '@loncra/antdv'

export function loadCss(id: string, href: string): Promise<HTMLLinkElement> {
  const doLoad = function (
    resolve: (value: HTMLLinkElement) => void,
    reject: (reason?: unknown) => void,
  ) {
    const query = document.querySelector(`link[id='${id}']`) as HTMLLinkElement | null
    if (query) {
      resolve(query)
      return
    }

    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.type = 'text/css'
    link.href = href
    link.onload = () => resolve(link)
    link.onerror = reject
    document.head.appendChild(link)
  }

  return new Promise(doLoad)
}

export function loadScript(id: string, src: string): Promise<HTMLScriptElement> {
  const doLoad = function (
    resolve: (value: HTMLScriptElement) => void,
    reject: (reason?: unknown) => void,
  ) {
    const query = document.querySelector(`script[id='${id}']`) as HTMLScriptElement | null
    if (query) {
      resolve(query)
      return
    }

    const script = document.createElement('script')
    script.id = id
    script.type = 'text/javascript'
    script.src = src
    script.onload = () => resolve(script)
    script.onerror = reject
    document.head.appendChild(script)
  }

  return new Promise(doLoad)
}

export async function loadIcon(href: string): Promise<IconfontJson> {
  const response = await fetch(href)
  return (await response.json()) as IconfontJson
}

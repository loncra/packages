import type {CSSProperties} from 'vue'

export const CALL_MINI_SIZE = {
  WIDTH: 280,
  HEIGHT: 158,
} as const

export const PIP_WIDTH_RATIO = 0.28
export const PIP_MAX_WIDTH_PX = 200

export const DEFAULT_VIDEO_METRICS = {width: 1280, height: 720, aspect: 16 / 9}

export const CALL_SPLIT = {
  DEFAULT: 'default',
  LEFT_RIGHT: 'leftRight',
} as const

export type CallSplit = (typeof CALL_SPLIT)[keyof typeof CALL_SPLIT]

export interface VideoMetrics {
  width: number
  height: number
  aspect: number
}

export interface LayoutConstraints {
  maxWidth: number
  maxHeight: number
}

export interface CallPanelStyle {
  width: string
  height: string
}

export interface CallLayoutSpec {
  modalWidth: number
  modalHeight: number
  local: CallPanelStyle
  remote: CallPanelStyle
}

export function layoutConstraints(fullscreen: boolean): LayoutConstraints {
  if (typeof window === 'undefined') {
    return {maxWidth: 960, maxHeight: 540}
  }
  if (fullscreen) {
    return {maxWidth: window.innerWidth, maxHeight: window.innerHeight}
  }
  return {
    maxWidth: Math.min(window.innerWidth * 0.92, 960),
    maxHeight: Math.min(window.innerHeight * 0.72, 540),
  }
}

function fitContain(video: VideoMetrics, maxW: number, maxH: number) {
  const scale = Math.min(maxW / video.width, maxH / video.height)
  return {
    width: Math.round(video.width * scale),
    height: Math.round(video.height * scale),
  }
}

function panel(width: number, height: number): CallPanelStyle {
  return {width: `${width}px`, height: `${height}px`}
}

export function computePrivateCallLayout(
  mode: CallSplit,
  metrics: {local: VideoMetrics; remote: VideoMetrics},
  constraints: LayoutConstraints,
  targetFullWindow: boolean,
): CallLayoutSpec {
  const {local, remote} = metrics
  if (mode === CALL_SPLIT.LEFT_RIGHT) {
    const panelMaxW = constraints.maxWidth / 2
    const localBox = fitContain(local, panelMaxW, constraints.maxHeight)
    const remoteBox = fitContain(remote, panelMaxW, constraints.maxHeight)
    const panelHeight = Math.max(localBox.height, remoteBox.height)
    const modalWidth = Math.round(panelMaxW * 2)
    return {
      modalWidth,
      modalHeight: panelHeight,
      local: panel(panelMaxW, panelHeight),
      remote: panel(panelMaxW, panelHeight),
    }
  }

  const main = targetFullWindow ? remote : local
  const pip = targetFullWindow ? local : remote
  const mainBox = fitContain(main, constraints.maxWidth, constraints.maxHeight)
  const pipW = Math.min(mainBox.width * PIP_WIDTH_RATIO, PIP_MAX_WIDTH_PX)
  const pipH = Math.round(pipW / pip.aspect)
  if (targetFullWindow) {
    return {
      modalWidth: mainBox.width,
      modalHeight: mainBox.height,
      local: panel(pipW, pipH),
      remote: panel(mainBox.width, mainBox.height),
    }
  }
  return {
    modalWidth: mainBox.width,
    modalHeight: mainBox.height,
    local: panel(mainBox.width, mainBox.height),
    remote: panel(pipW, pipH),
  }
}

export function panelStyle(style: CallPanelStyle | {width: string; height: string}): CSSProperties {
  return {width: style.width, height: style.height}
}

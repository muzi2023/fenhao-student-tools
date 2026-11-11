import rawSpecs from '../data/specs.json'
import type { PhotoSpec, PixelSize } from './types'

export const PHOTO_SPECS = rawSpecs as PhotoSpec[]

export function mmToPixels(mm: number, dpi: number): number {
  return Math.max(1, Math.round((mm / 25.4) * dpi))
}

export function specToPixels(spec: PhotoSpec): PixelSize {
  return {
    width: mmToPixels(spec.sizeMm.width, spec.dpi),
    height: mmToPixels(spec.sizeMm.height, spec.dpi)
  }
}

export function pxToMm(px: number, dpi: number): number {
  return (px * 25.4) / dpi
}

export function getSpec(id: string): PhotoSpec {
  return PHOTO_SPECS.find((item) => item.id === id) ?? PHOTO_SPECS[0]
}

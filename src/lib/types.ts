export type BackgroundKey = 'white' | 'blue' | 'red'

export interface PhotoSpec {
  id: string
  name: string
  sizeMm: { width: number; height: number }
  dpi: number
  backgrounds: BackgroundKey[]
  kbOptions: number[]
  headRatio: number
  source: string
}

export interface PixelSize { width: number; height: number }
export interface Point { x: number; y: number }

export interface CropFrame {
  source: HTMLCanvasElement
  pixelSize: PixelSize
  zoom: number
  offset: Point
  tolerance: number
}

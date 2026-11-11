import type { BackgroundKey, PixelSize, Point } from './types'

export const BACKGROUND_COLORS: Record<BackgroundKey, string> = {
  white: '#ffffff',
  blue: '#4389d8',
  red: '#d94b55'
}

export function parseExifOrientation(buffer: ArrayBuffer): number {
  const view = new DataView(buffer)
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return 1
  let offset = 2
  while (offset + 4 < view.byteLength) {
    if (view.getUint8(offset) !== 0xff) { offset += 1; continue }
    const marker = view.getUint8(offset + 1)
    const length = view.getUint16(offset + 2)
    if (marker === 0xe1 && offset + 10 < view.byteLength && view.getUint32(offset + 4) === 0x45786966) {
      const tiff = offset + 10
      const little = view.getUint16(tiff) === 0x4949
      const read16 = (pos: number) => view.getUint16(pos, little)
      const read32 = (pos: number) => view.getUint32(pos, little)
      const ifdOffset = tiff + read32(tiff + 4)
      const entries = read16(ifdOffset)
      for (let index = 0; index < entries; index += 1) {
        const entry = ifdOffset + 2 + index * 12
        if (read16(entry) === 0x0112) return read16(entry + 8)
      }
      return 1
    }
    offset += 2 + length
  }
  return 1
}

function drawOriented(ctx: CanvasRenderingContext2D, image: CanvasImageSource, width: number, height: number, orientation: number): void {
  const swap = orientation >= 5 && orientation <= 8
  const drawWidth = swap ? height : width
  const drawHeight = swap ? width : height
  ctx.canvas.width = drawWidth
  ctx.canvas.height = drawHeight
  ctx.save()
  switch (orientation) {
    case 2: ctx.translate(width, 0); ctx.scale(-1, 1); break
    case 3: ctx.translate(width, height); ctx.rotate(Math.PI); break
    case 4: ctx.translate(0, height); ctx.scale(1, -1); break
    case 5: ctx.rotate(0.5 * Math.PI); ctx.scale(1, -1); break
    case 6: ctx.translate(height, 0); ctx.rotate(0.5 * Math.PI); break
    case 7: ctx.translate(height, width); ctx.rotate(0.5 * Math.PI); ctx.scale(-1, 1); break
    case 8: ctx.translate(0, width); ctx.rotate(-0.5 * Math.PI); break
    default: break
  }
  ctx.drawImage(image, 0, 0, width, height)
  ctx.restore()
}

export async function loadImageCanvas(file: File): Promise<HTMLCanvasElement> {
  const buffer = await file.arrayBuffer()
  const orientation = parseExifOrientation(buffer)
  const url = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error('无法读取图片'))
      element.src = url
    })
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('浏览器不支持 Canvas')
    drawOriented(ctx, image, image.naturalWidth, image.naturalHeight, orientation)
    return canvas
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function subjectMaskCanvas(source: HTMLCanvasElement, tolerance = 34): HTMLCanvasElement {
  const mask = document.createElement('canvas')
  mask.width = source.width; mask.height = source.height
  const sourceCtx = source.getContext('2d')
  const maskCtx = mask.getContext('2d')
  if (!sourceCtx || !maskCtx) return mask
  const data = sourceCtx.getImageData(0, 0, source.width, source.height)
  const samplePoints = [[0, 0], [source.width - 1, 0], [0, source.height - 1], [source.width - 1, source.height - 1]]
  const background = samplePoints.reduce((acc, [x, y]) => {
    const index = (y * source.width + x) * 4
    acc.r += data.data[index]; acc.g += data.data[index + 1]; acc.b += data.data[index + 2]
    return acc
  }, { r: 0, g: 0, b: 0 })
  background.r /= 4; background.g /= 4; background.b /= 4
  const output = maskCtx.createImageData(source.width, source.height)
  for (let index = 0; index < data.data.length; index += 4) {
    const dr = data.data[index] - background.r
    const dg = data.data[index + 1] - background.g
    const db = data.data[index + 2] - background.b
    const distance = Math.sqrt(dr * dr + dg * dg + db * db)
    const alpha = Math.min(255, Math.max(0, (distance - tolerance) * 8))
    output.data[index] = 255; output.data[index + 1] = 255; output.data[index + 2] = 255; output.data[index + 3] = alpha
  }
  maskCtx.putImageData(output, 0, 0)
  return mask
}

export function renderIdPhoto(source: HTMLCanvasElement, mask: HTMLCanvasElement, size: PixelSize, background: string, zoom = 1, offset: Point = { x: 0, y: 0 }): HTMLCanvasElement {
  const output = document.createElement('canvas')
  output.width = size.width; output.height = size.height
  const ctx = output.getContext('2d')
  if (!ctx) return output
  ctx.fillStyle = background; ctx.fillRect(0, 0, size.width, size.height)
  const sourceRatio = source.width / source.height
  const targetRatio = size.width / size.height
  let cropWidth = source.width; let cropHeight = source.height
  if (sourceRatio > targetRatio) cropWidth = source.height * targetRatio
  else cropHeight = source.width / targetRatio
  cropWidth /= zoom; cropHeight /= zoom
  const sx = Math.max(0, Math.min(source.width - cropWidth, (source.width - cropWidth) / 2 + offset.x * source.width))
  const sy = Math.max(0, Math.min(source.height - cropHeight, (source.height - cropHeight) / 2 + offset.y * source.height))
  const temp = document.createElement('canvas'); temp.width = size.width; temp.height = size.height
  const tempCtx = temp.getContext('2d')
  if (!tempCtx) return output
  tempCtx.drawImage(source, sx, sy, cropWidth, cropHeight, 0, 0, size.width, size.height)
  const maskTemp = document.createElement('canvas'); maskTemp.width = size.width; maskTemp.height = size.height
  const maskCtx = maskTemp.getContext('2d')
  if (!maskCtx) return output
  maskCtx.drawImage(mask, sx, sy, cropWidth, cropHeight, 0, 0, size.width, size.height)
  tempCtx.globalCompositeOperation = 'destination-in'; tempCtx.drawImage(maskTemp, 0, 0); tempCtx.globalCompositeOperation = 'source-over'
  ctx.drawImage(temp, 0, 0)
  return output
}

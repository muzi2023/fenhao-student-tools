import { PDFDocument } from 'pdf-lib'

export function scanDocument(source: HTMLCanvasElement, threshold = 22, margin = 12): HTMLCanvasElement {
  const ctx = source.getContext('2d')
  if (!ctx) return source
  const { width, height } = source
  const data = ctx.getImageData(0, 0, width, height).data
  const corners = [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]]
  const bg = corners.reduce((acc, [x, y]) => { const i = (y * width + x) * 4; acc.r += data[i]; acc.g += data[i + 1]; acc.b += data[i + 2]; return acc }, { r: 0, g: 0, b: 0 })
  bg.r /= 4; bg.g /= 4; bg.b /= 4
  let minX = width, minY = height, maxX = 0, maxY = 0
  for (let y = 0; y < height; y += 2) for (let x = 0; x < width; x += 2) {
    const i = (y * width + x) * 4
    const distance = Math.hypot(data[i] - bg.r, data[i + 1] - bg.g, data[i + 2] - bg.b)
    if (distance > threshold) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y) }
  }
  if (maxX <= minX || maxY <= minY) return source
  minX = Math.max(0, minX - margin); minY = Math.max(0, minY - margin)
  maxX = Math.min(width - 1, maxX + margin); maxY = Math.min(height - 1, maxY + margin)
  const output = document.createElement('canvas'); output.width = maxX - minX + 1; output.height = maxY - minY + 1
  output.getContext('2d')!.drawImage(source, minX, minY, output.width, output.height, 0, 0, output.width, output.height)
  return output
}

export function suggestFileName(text: string, fallback = '扫描文档'): string {
  const firstLine = text.split(/\r?\n/).map(line => line.replace(/[^\p{L}\p{N}《》：:·()（）\- ]/gu, '').trim()).find(line => line.length >= 2)
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '')
  return `${(firstLine || fallback).slice(0, 28)}_${stamp}`
}

export async function recognizeText(image: Blob, onProgress?: (value: number) => void): Promise<string> {
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('eng', 1, { logger: message => { if (message.status === 'recognizing text') onProgress?.(Math.round((message.progress || 0) * 100)) } })
  try { const result = await worker.recognize(image); return result.data.text.trim() } finally { await worker.terminate() }
}

export async function buildScanPdf(pages: string[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  for (const dataUrl of pages) {
    const page = pdf.addPage([595.28, 841.89])
    const bytes = Uint8Array.from(atob(dataUrl.split(',')[1]), char => char.charCodeAt(0))
    const image = await pdf.embedJpg(bytes)
    const margin = 28; const maxW = 595.28 - margin * 2; const maxH = 841.89 - margin * 2
    const scale = Math.min(maxW / image.width, maxH / image.height)
    page.drawImage(image, { x: (595.28 - image.width * scale) / 2, y: (841.89 - image.height * scale) / 2, width: image.width * scale, height: image.height * scale })
  }
  return pdf.save()
}

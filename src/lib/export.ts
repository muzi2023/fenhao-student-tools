import { PDFDocument, rgb } from 'pdf-lib'
import type { PhotoSpec } from './types'

export const A4_POINTS = { width: 595.28, height: 841.89 }

export function bytesToKb(bytes: number): number { return bytes / 1024 }

export function sanitizeFilePart(value: string): string {
  return value.trim().replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '') || 'photo'
}

export function buildFileName(spec: PhotoSpec, background: string, targetKb: number): string {
  return `fenhao-${sanitizeFilePart(spec.name)}-${background}-${targetKb}kb.jpg`
}

export function qualityForTarget(targetKb: number, sourceBytes: number): number {
  if (sourceBytes <= targetKb * 1024) return 0.92
  const ratio = (targetKb * 1024) / sourceBytes
  return Math.min(0.92, Math.max(0.35, 0.42 + ratio * 0.5))
}

export function canvasToJpeg(canvas: HTMLCanvasElement, targetKb: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const attempt = (quality: number, iteration: number) => {
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error('浏览器无法生成 JPG')); return }
        if (blob.size <= targetKb * 1024 || iteration >= 7 || quality <= 0.32) {
          resolve(blob)
          return
        }
        attempt(Math.max(0.32, quality - 0.08), iteration + 1)
      }, 'image/jpeg', quality)
    }
    attempt(0.92, 0)
  })
}

export interface A4Placement { x: number; y: number; width: number; height: number }

export function buildA4Layout(spec: PhotoSpec, margin = 24, gap = 8): A4Placement[] {
  const width = (spec.sizeMm.width / 25.4) * 72
  const height = (spec.sizeMm.height / 25.4) * 72
  const cols = Math.max(1, Math.floor((A4_POINTS.width - margin * 2 + gap) / (width + gap)))
  const rows = Math.max(1, Math.floor((A4_POINTS.height - margin * 2 + gap) / (height + gap)))
  const placements: A4Placement[] = []
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      placements.push({ x: margin + col * (width + gap), y: A4_POINTS.height - margin - height - row * (height + gap), width, height })
    }
  }
  return placements
}

export async function createA4Pdf(jpegBytes: Uint8Array, spec: PhotoSpec): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([A4_POINTS.width, A4_POINTS.height])
  const image = await pdf.embedJpg(jpegBytes)
  const placements = buildA4Layout(spec)
  placements.forEach((placement) => {
    page.drawImage(image, { ...placement })
  })
  page.drawText(`Fenhao photo · ${spec.id} · ${spec.dpi} DPI`, {
    x: 24, y: 12, size: 7, color: rgb(0.38, 0.36, 0.33)
  })
  return pdf.save()
}

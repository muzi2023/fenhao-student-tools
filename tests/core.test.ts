import { describe, expect, it } from 'vitest'
import { PHOTO_SPECS, mmToPixels, specToPixels } from '../src/lib/specs'
import { buildA4Layout, buildFileName, createA4Pdf, qualityForTarget } from '../src/lib/export'

const oneInch = PHOTO_SPECS.find((spec) => spec.id === 'one-inch')!

function tinyJpeg(): Uint8Array {
  const base64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAH/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAEFAqf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/AX//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/AX//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAY/Aqf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/IV//2gAMAwEAAgADAAAAEP/EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQMBAT8QH//EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQIBAT8QH//EABQQAQAAAAAAAAAAAAAAAAAAABD/2gAIAQEAAT8QH//Z'
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0))
}

describe('证件照规格与导出核心', () => {
  it('converts mm to 300 DPI pixels', () => {
    expect(mmToPixels(25, 300)).toBe(295)
    expect(mmToPixels(35, 300)).toBe(413)
    expect(specToPixels(oneInch)).toEqual({ width: 295, height: 413 })
  })

  it('keeps compression quality in a safe range', () => {
    expect(qualityForTarget(200, 100 * 1024)).toBeGreaterThan(0.35)
    expect(qualityForTarget(20, 1000 * 1024)).toBeGreaterThanOrEqual(0.35)
    expect(qualityForTarget(200, 10 * 1024)).toBe(0.92)
  })

  it('creates stable Chinese-safe filenames', () => {
    expect(buildFileName(oneInch, 'white', 50)).toBe('fenhao-一寸-white-50kb.jpg')
  })

  it('lays out repeated photos on an A4 sheet', () => {
    const placements = buildA4Layout(oneInch)
    expect(placements.length).toBeGreaterThan(20)
    expect(placements[0].x).toBe(24)
    expect(placements.every((item) => item.width > 0 && item.height > 0)).toBe(true)
  })

  it('generates a readable PDF byte stream', async () => {
    const pdf = await createA4Pdf(tinyJpeg(), oneInch)
    expect(new TextDecoder().decode(pdf.slice(0, 5))).toBe('%PDF-')
    expect(pdf.length).toBeGreaterThan(800)
  })
})

import { useEffect, useMemo, useRef, useState } from 'react'
import { PHOTO_SPECS, getSpec, specToPixels } from './lib/specs'
import { BACKGROUND_COLORS, loadImageCanvas, renderIdPhoto, subjectMaskCanvas } from './lib/image'
import { buildFileName, canvasToJpeg, createA4Pdf } from './lib/export'
import type { BackgroundKey } from './lib/types'
import { buildScanPdf, recognizeText, scanDocument, suggestFileName } from './lib/scanner'
import './styles.css'

const backgroundLabels: Record<BackgroundKey, string> = { white: '白底', blue: '蓝底', red: '红底' }

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = fileName; link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function App() {
  const [specId, setSpecId] = useState(PHOTO_SPECS[0].id)
  const spec = useMemo(() => getSpec(specId), [specId])
  const [background, setBackground] = useState<BackgroundKey>('white')
  const [targetKb, setTargetKb] = useState(50)
  const [source, setSource] = useState<HTMLCanvasElement | null>(null)
  const [mask, setMask] = useState<HTMLCanvasElement | null>(null)
  const [preview, setPreview] = useState<string>('')
  const [fileLabel, setFileLabel] = useState('尚未选择照片')
  const [tolerance, setTolerance] = useState(34)
  const [zoom, setZoom] = useState(1)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState('')
  const [scanPages, setScanPages] = useState<string[]>([])
  const [scanName, setScanName] = useState('扫描文档')
  const [scanMessage, setScanMessage] = useState('')
  const scanInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const pixels = useMemo(() => specToPixels(spec), [spec])

  useEffect(() => {
    if (!spec.backgrounds.includes(background)) setBackground(spec.backgrounds[0])
    if (!spec.kbOptions.includes(targetKb)) setTargetKb(spec.kbOptions[0])
  }, [spec, background, targetKb])

  useEffect(() => {
    if (!source || !mask) { setPreview(''); return }
    const output = renderIdPhoto(source, mask, pixels, BACKGROUND_COLORS[background], zoom, { x: offsetX, y: offsetY })
    setPreview(output.toDataURL('image/png'))
  }, [source, mask, pixels, background, zoom, offsetX, offsetY])

  async function handleFile(file: File | undefined): Promise<void> {
    if (!file) return
    setBusy(true); setMessage('正在读取照片…')
    try {
      const nextSource = await loadImageCanvas(file)
      setSource(nextSource)
      setMask(subjectMaskCanvas(nextSource, tolerance))
      setFileLabel(file.name)
      setMessage('照片已载入。请检查裁切与底色，再导出。')
      setZoom(1); setOffsetX(0); setOffsetY(0)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '照片读取失败，请换一张 JPG/PNG。')
    } finally { setBusy(false) }
  }

  async function handleScanFiles(files: FileList | null | undefined): Promise<void> {
    if (!files?.length) return
    setBusy(true); setScanMessage('正在自动裁边…')
    try {
      const pages: string[] = []
      for (const file of Array.from(files)) pages.push(scanDocument(await loadImageCanvas(file)).toDataURL('image/jpeg', 0.9))
      setScanPages(pages); setScanName('扫描文档'); setScanMessage(`已处理 ${pages.length} 页。可 OCR 自动命名或直接导出。`)
    } catch (error) { setScanMessage(error instanceof Error ? error.message : '扫描失败，请换一张图片。') }
    finally { setBusy(false) }
  }

  async function runScanOcr(): Promise<void> {
    if (!scanPages.length) return
    setBusy(true); setScanMessage('正在本地 OCR 识别…')
    try { const response = await fetch(scanPages[0]); const text = await recognizeText(await response.blob()); setScanName(suggestFileName(text)); setScanMessage(text ? '已根据第一页首行文字生成文件名，可手动修改。' : '未识别到标题，请手动填写文件名。') }
    catch (error) { setScanMessage(error instanceof Error ? error.message : 'OCR 暂不可用，请手动填写文件名。') }
    finally { setBusy(false) }
  }

  async function exportScanPdf(): Promise<void> {
    if (!scanPages.length) return
    setBusy(true); setScanMessage('正在生成多页 PDF…')
    try { const bytes = await buildScanPdf(scanPages); downloadBlob(new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }), `${scanName || '扫描文档'}.pdf`); setScanMessage(`已生成 ${scanPages.length} 页 PDF。`) }
    catch (error) { setScanMessage(error instanceof Error ? error.message : 'PDF 生成失败。') }
    finally { setBusy(false) }
  }

  function recut(): void {
    if (!source) return
    setMask(subjectMaskCanvas(source, tolerance))
    setMessage('已重新计算抠图。边缘仍需人工修整时，可调整下方容差与位置。')
  }

  async function exportJpg(): Promise<void> {
    if (!source || !mask) { setMessage('请先上传或拍摄一张照片。'); return }
    setBusy(true); setMessage('正在压缩 JPG…')
    try {
      const output = renderIdPhoto(source, mask, pixels, BACKGROUND_COLORS[background], zoom, { x: offsetX, y: offsetY })
      const blob = await canvasToJpeg(output, targetKb)
      downloadBlob(blob, buildFileName(spec, background, targetKb))
      setMessage(`JPG 已生成（${Math.round(blob.size / 1024)} KB，目标 ≤ ${targetKb} KB）。`)
    } catch (error) { setMessage(error instanceof Error ? error.message : 'JPG 导出失败。') }
    finally { setBusy(false) }
  }

  async function exportPdf(): Promise<void> {
    if (!source || !mask) { setMessage('请先上传或拍摄一张照片。'); return }
    setBusy(true); setMessage('正在排版 A4 打印稿…')
    try {
      const output = renderIdPhoto(source, mask, pixels, BACKGROUND_COLORS[background], zoom, { x: offsetX, y: offsetY })
      const jpg = await canvasToJpeg(output, targetKb)
      const bytes = new Uint8Array(await jpg.arrayBuffer())
      const pdfBytes = await createA4Pdf(bytes, spec)
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' })
      setPdfPreviewUrl((current) => { if (current) URL.revokeObjectURL(current); return URL.createObjectURL(pdfBlob) })
      downloadBlob(pdfBlob, `fenhao-${spec.id}-a4.pdf`)
      setMessage('A4 PDF 已生成，可直接打印或在打印预览中检查。')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'PDF 导出失败。') }
    finally { setBusy(false) }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark" aria-label="分号">；</div>
        <div>
          <p className="eyebrow">学生工具 · 第一期</p>
          <h1>证件照制作</h1>
        </div>
        <span className="local-badge">本地处理</span>
      </header>

      <section className="hero-copy">
        <p className="hero-kicker">拍一张，按要求导出</p>
        <h2>把证件照做得刚刚好。</h2>
        <p>照片留在当前浏览器里处理，不上传服务器。默认不美颜、不改变五官。</p>
      </section>

      <section className="workspace" aria-label="证件照制作工作区">
        <div className="preview-card">
          <div className="preview-toolbar"><span>预览</span><span>{pixels.width} × {pixels.height}px · {spec.dpi} DPI</span></div>
          <div className="photo-stage">
            {preview ? <img src={preview} alt={`${spec.name}${backgroundLabels[background]}预览`} /> : <div className="empty-preview"><span className="empty-icon">◎</span><strong>先上传一张正面照片</strong><small>建议光线均匀、肩膀自然、背景简单</small></div>}
          </div>
          <div className="preview-caption"><span>{fileLabel}</span><span>{spec.sizeMm.width} × {spec.sizeMm.height} mm</span></div>
        </div>

        <div className="control-stack">
          <section className="control-card upload-card">
            <div className="section-heading"><span className="step-number">01</span><div><h3>上传 / 拍照</h3><p>支持 JPG、PNG；手机可直接打开相机</p></div></div>
            <div className="upload-actions">
              <button className="primary-button" type="button" onClick={() => fileInputRef.current?.click()} disabled={busy}>选择照片</button>
              <button className="secondary-button" type="button" onClick={() => cameraInputRef.current?.click()} disabled={busy}>打开相机</button>
            </div>
            <input ref={fileInputRef} className="visually-hidden" type="file" accept="image/jpeg,image/png" onChange={(event) => void handleFile(event.target.files?.[0])} />
            <input ref={cameraInputRef} className="visually-hidden" type="file" accept="image/*" capture="environment" onChange={(event) => void handleFile(event.target.files?.[0])} />
          </section>

          <section className="control-card">
            <div className="section-heading"><span className="step-number">02</span><div><h3>选择规格</h3><p>规格来自可配置 JSON，可继续扩展</p></div></div>
            <label className="field-label" htmlFor="spec">证件类型</label>
            <select id="spec" value={spec.id} onChange={(event) => setSpecId(event.target.value)}>
              {PHOTO_SPECS.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.sizeMm.width}×{item.sizeMm.height} mm</option>)}
            </select>
            <p className="source-note">{spec.source}</p>
          </section>

          <section className="control-card">
            <div className="section-heading"><span className="step-number">03</span><div><h3>选择底色</h3><p>先看预览，再决定导出颜色</p></div></div>
            <div className="swatches" role="radiogroup" aria-label="底色">
              {spec.backgrounds.map((key) => <button key={key} className={`swatch ${key} ${background === key ? 'selected' : ''}`} type="button" onClick={() => setBackground(key)} role="radio" aria-checked={background === key}><span />{backgroundLabels[key]}</button>)}
            </div>
          </section>

          <section className="control-card adjust-card">
            <div className="adjust-heading"><div><h3>重新抠图与微调</h3><p>当前为轻量本地抠图适配层，复杂发丝建议换更干净的原图。</p></div><button className="text-button" type="button" onClick={recut} disabled={!source || busy}>重新抠图</button></div>
            <label className="range-label" htmlFor="tolerance"><span>边缘容差</span><output>{tolerance}</output></label>
            <input id="tolerance" type="range" min="10" max="70" value={tolerance} onChange={(event) => setTolerance(Number(event.target.value))} />
            <div className="range-grid">
              <label htmlFor="zoom">缩放 <output>{zoom.toFixed(2)}×</output><input id="zoom" type="range" min="1" max="1.5" step="0.01" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /></label>
              <label htmlFor="offsetY">上下 <output>{offsetY > 0 ? '+' : ''}{Math.round(offsetY * 100)}%</output><input id="offsetY" type="range" min="-0.15" max="0.15" step="0.01" value={offsetY} onChange={(event) => setOffsetY(Number(event.target.value))} /></label>
              <label htmlFor="offsetX">左右 <output>{offsetX > 0 ? '+' : ''}{Math.round(offsetX * 100)}%</output><input id="offsetX" type="range" min="-0.15" max="0.15" step="0.01" value={offsetX} onChange={(event) => setOffsetX(Number(event.target.value))} /></label>
            </div>
          </section>

          <section className="control-card export-card">
            <div className="section-heading"><span className="step-number">04</span><div><h3>导出</h3><p>JPG 按目标大小压缩；PDF 自动排版到 A4</p></div></div>
            <label className="field-label" htmlFor="kb">JPG 大小上限</label>
            <select id="kb" value={targetKb} onChange={(event) => setTargetKb(Number(event.target.value))}>
              {spec.kbOptions.map((kb) => <option key={kb} value={kb}>{kb} KB</option>)}
            </select>
            <div className="export-actions"><button className="primary-button" type="button" onClick={() => void exportJpg()} disabled={busy || !source}>下载 JPG</button><button className="secondary-button" type="button" onClick={() => void exportPdf()} disabled={busy || !source}>下载 A4 PDF</button></div>
            <p className="notice">具体报名要求以主管部门 / 学校公告为准。请在提交前核对尺寸、底色与文件大小。</p>
            {pdfPreviewUrl && <a className="pdf-preview-link" href={pdfPreviewUrl} target="_blank" rel="noreferrer">在新标签页查看 A4 PDF 预览 ↗</a>}
          </section>
        </div>
      </section>
      <section className="scan-workspace" aria-label="文档扫描工作区">
        <div className="scan-heading"><span className="step-number">05</span><div><h2>文档扫描</h2><p>拍照或选择多页图片，自动裁边后生成 PDF。目录默认关闭，不替你分类。</p></div></div>
        <div className="scan-card"><button className="primary-button" type="button" onClick={() => scanInputRef.current?.click()} disabled={busy}>拍照 / 选择多页图片</button><input ref={scanInputRef} className="visually-hidden" type="file" accept="image/jpeg,image/png" capture="environment" multiple onChange={(event) => void handleScanFiles(event.target.files)} /><p className="source-note">图片只在当前浏览器处理，不上传服务器。</p></div>
        {scanPages.length > 0 && <><div className="scan-grid">{scanPages.map((page, index) => <figure key={page}><img src={page} alt={`扫描第 ${index + 1} 页`} /><figcaption>第 {index + 1} 页</figcaption></figure>)}</div><div className="scan-card"><label className="field-label" htmlFor="scan-name">文件名</label><input id="scan-name" value={scanName} onChange={(event) => setScanName(event.target.value)} /><div className="export-actions"><button className="secondary-button" type="button" onClick={() => void runScanOcr()} disabled={busy}>OCR 自动命名</button><button className="primary-button" type="button" onClick={() => void exportScanPdf()} disabled={busy}>下载扫描 PDF</button></div><p className="notice">{scanMessage || '文件名可手动修改；不创建目录、不自动分类。'}</p></div></>}
      </section>
      <p className="status" role="status" aria-live="polite">{busy ? '处理中…' : message}</p>
      <footer><span>分号学生工具</span><span>浏览器本地处理 · PWA 预留</span></footer>
    </main>
  )
}

import type { Metadata } from 'next'
import DocumentScanner from '@/components/document-scanner/DocumentScanner'

export const metadata: Metadata = {
  title: '文档扫描 · 多页 PDF 导出 | Pixfit',
  description: '在浏览器本地拍照扫描普通纸张，自动校正透视，OCR 并导出多页 PDF。',
}

export default async function DocumentScannerPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return <DocumentScanner locale={locale} />
}

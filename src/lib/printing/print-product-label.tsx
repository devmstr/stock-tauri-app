import QRCode from 'qrcode'
import type { Exhaust } from '@/types/exhaust'
import { buildDesignation } from '../utils/designation'

export type ProductLabelData = {
  designation: string
  dateText: string
  barcodeText: string
  hashText: string
  qrDataUrl: string
}

/**
 * Build all data needed for preview + printing.
 */
export async function buildProductLabelData(
  exhaust: Exhaust
): Promise<ProductLabelData> {
  const designation = buildDesignation(exhaust)
  const qrValue = (exhaust.hash ?? exhaust.barcode ?? '').trim()
  const qrDataUrl = await QRCode.toDataURL(qrValue, { margin: 0, width: 180 })

  const barcodeText = (exhaust.barcode ?? '').trim()
  const hashText = (exhaust.hash ?? '').trim()
  const dateText = formatDate(exhaust.createdAt ?? exhaust.updatedAt ?? null)

  return { designation, dateText, barcodeText, hashText, qrDataUrl }
}

/**
 * Minimal label printing helper.
 * - Generates QR
 * - Uses a hidden iframe to trigger the native print dialog (avoids popup blockers).
 */
export async function printProductLabel(exhaust: Exhaust) {
  const data = await buildProductLabelData(exhaust)
  const html = buildPrintHtml(data)

  // Use a hidden iframe instead of window.open to avoid popup blockers and be more reliable
  const iframeId = 'print-label-iframe'
  let iframe = document.getElementById(iframeId) as HTMLIFrameElement
  if (!iframe) {
    iframe = document.createElement('iframe')
    iframe.id = iframeId
    iframe.style.position = 'absolute'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = 'none'
    document.body.appendChild(iframe)
  }

  const doc = iframe.contentWindow?.document
  if (!doc) return

  doc.open()
  doc.write(html)
  doc.close()

  // The script inside the HTML (window.print()) will handle the printing.
  // We can also trigger it from here if needed, but the onload in buildPrintHtml is cleaner.
}

export function ProductLabelPreview({ data }: { data: ProductLabelData }) {
  // Use mm to match the printer size visually.
  return (
    <div
      className="rounded-md border border-border bg-white text-black shadow-sm"
      style={{ width: '80mm', height: '40mm', padding: '3mm' }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: '3mm',
          height: '100%',
          alignItems: 'center'
        }}
      >
        <div style={{ display: 'grid', gap: '2mm' }}>
          <div style={{ fontWeight: 700, fontSize: '11pt', lineHeight: 1.1 }}>
            {data.designation}
          </div>

          <div style={{ fontSize: '8.5pt', display: 'flex', gap: '6mm' }}>
            <div>{data.dateText}</div>
            {data.hashText ? <div>Ref: {data.hashText}</div> : null}
          </div>

          <div style={{ fontSize: '9pt', letterSpacing: '0.5px' }}>
            {data.barcodeText ? `Code-barres: ${data.barcodeText}` : ''}
          </div>
        </div>

        <div>
          <img
            src={data.qrDataUrl}
            alt="QR"
            style={{
              display: 'block',
              width: '26mm',
              height: '26mm',
              objectFit: 'contain'
            }}
          />
        </div>
      </div>
    </div>
  )
}

function buildPrintHtml(data: ProductLabelData) {
  const html = `
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Impression étiquette</title>
  <style>
    @page { size: 80mm 40mm; margin: 0; }
    html, body { height: 100%; }
    body {
      margin: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
      color: #111;
    }
    .label {
      box-sizing: border-box;
      width: 80mm;
      height: 40mm;
      padding: 3mm;
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 3mm;
      align-items: center;
    }
    .left { display: grid; gap: 2mm; }
    .designation { font-weight: 700; font-size: 11pt; line-height: 1.1; }
    .meta { font-size: 8.5pt; display: flex; gap: 6mm; }
    .barcode { font-size: 9pt; letter-spacing: 0.5px; }
    img { display: block; width: 26mm; height: 26mm; object-fit: contain; }
  </style>
</head>
<body>
  <div class="label">
    <div class="left">
      <div class="designation">${escapeHtml(data.designation)}</div>
      <div class="meta">
        <div>${escapeHtml(data.dateText)}</div>
        ${data.hashText ? `<div>Ref: ${escapeHtml(data.hashText)}</div>` : ''}
      </div>
      <div class="barcode">${data.barcodeText ? 'Code-barres: ' + escapeHtml(data.barcodeText) : ''}</div>
    </div>
    <div class="right">
      <img src="${data.qrDataUrl}" alt="QR" />
    </div>
  </div>

  <script>
    window.onload = () => {
      setTimeout(() => {
        window.print();
        window.close();
      }, 60);
    };
  </script>
</body>
</html>
`
  return html
}

function formatDate(dateIso: string | null) {
  if (!dateIso) return ''
  const d = new Date(dateIso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('fr-DZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d)
}

function escapeHtml(str: string) {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

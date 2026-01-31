import QRCode from "qrcode"
import type { Exhaust } from "@/types/exhaust"
import { buildDesignation } from "./designation"

/**
 * Minimal label printing helper.
 * - Generates a QR code (qrcode -> png data url)
 * - Opens a temporary window and triggers `window.print()`.
 *
 * You can later replace the HTML/CSS with your exact label format / printer size.
 */
export async function printProductLabel(exhaust: Exhaust) {
  const designation = buildDesignation(exhaust)
  const qrValue = (exhaust.qrcode ?? exhaust.barcode ?? exhaust.hash).trim()
  const qrDataUrl = await QRCode.toDataURL(qrValue, { margin: 0, width: 180 })

  const barcodeText = (exhaust.barcode ?? "").trim()
  const dateText = formatDate(exhaust.createdAt ?? exhaust.updatedAt ?? null)

  const html = `
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Impression étiquette</title>
  <style>
    /* Label size: tweak for your printer (example: 80mm x 40mm) */
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
      <div class="designation">${escapeHtml(designation)}</div>
      <div class="meta">
        <div>${escapeHtml(dateText)}</div>
      </div>
      <div class="barcode">${barcodeText ? "Code-barres: " + escapeHtml(barcodeText) : ""}</div>
    </div>
    <div class="right">
      <img src="${qrDataUrl}" alt="QR" />
    </div>
  </div>

  <script>
    // wait for image render
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

  const win = window.open("", "_blank", "noopener,noreferrer,width=520,height=360")
  if (!win) {
    // If popups are blocked, fallback to current window print
    console.warn("Popup blocked. Unable to open print window.")
    return
  }
  win.document.open()
  win.document.write(html)
  win.document.close()
}

function formatDate(dateIso: string | null) {
  if (!dateIso) return ""
  const d = new Date(dateIso)
  if (Number.isNaN(d.getTime())) return ""
  return new Intl.DateTimeFormat("fr-DZ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d)
}

function escapeHtml(str: string) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

import { toPng } from 'html-to-image'

async function waitForImages(root: HTMLElement) {
  const imgs = Array.from(root.querySelectorAll('img'))
  await Promise.all(
    imgs.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((res) => {
            img.addEventListener('load', () => res(), { once: true })
            img.addEventListener('error', () => res(), { once: true })
          })
    )
  )
}

export async function printLabelNode100x60mm(node: HTMLElement) {
  // 1. Ensure fonts/images are loaded before capture
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (document as any).fonts?.ready?.catch(() => {})
  await waitForImages(node)

  // 2. Capture the label exactly as rendered
  const pngDataUrl = await toPng(node, {
    pixelRatio: 4, // High quality but not overkill to keep iframe light
    cacheBust: true,
    backgroundColor: '#ffffff'
  })

  // 3. Create a temporary hidden iframe for the print operation
  const iframeId = 'label-print-iframe'
  let iframe = document.getElementById(iframeId) as HTMLIFrameElement
  if (!iframe) {
    iframe = document.createElement('iframe')
    iframe.id = iframeId
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = 'none'
    iframe.style.visibility = 'hidden'
    document.body.appendChild(iframe)
  }

  const doc = iframe.contentWindow?.document
  if (!doc) throw new Error('Could not access iframe document')

  // 4. Inject matching 100x60mm print styles and the PNG image
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { 
      size: 100mm 60mm; 
      margin: 0; 
    }
    html, body { 
      margin: 0; 
      padding: 0; 
      width: 100mm; 
      height: 60mm; 
      overflow: hidden; 
    }
    img { 
      width: 100mm; 
      height: 60mm; 
      display: block; 
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <img src="${pngDataUrl}" alt="label" />
  <script>
    window.onload = () => {
      setTimeout(() => {
        window.print();
      }, 250);
    };
  </script>
</body>
</html>`

  doc.open()
  doc.write(html)
  doc.close()
}

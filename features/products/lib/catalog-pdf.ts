import type { CatalogExportRow } from '@/features/products/actions/product.actions'
import { Dates } from '@/shared/lib/dates'
import type { jsPDF } from 'jspdf'

// ---------------------------------------------------------------------------
// Catálogo visual en PDF (client-side, jsPDF bajo demanda) — tarjetas con
// imagen, nombre, marca, precio y oferta, al estilo de la tienda. Pensado
// para compartir por WhatsApp: sin stock interno, solo estado.
// ---------------------------------------------------------------------------

// Paleta (RGB sobre fondo blanco)
const NAVY: [number, number, number] = [11, 22, 40]
const CYAN: [number, number, number] = [0, 140, 190]
const GRAY: [number, number, number] = [120, 130, 145]
const LIGHT: [number, number, number] = [226, 232, 240]
const RED: [number, number, number] = [225, 60, 60]
const BLUE: [number, number, number] = [80, 100, 240]

// Layout A4 (mm)
const PAGE_W = 210
const PAGE_H = 297
const MARGIN = 12
const HEADER_H = 30
const COLS = 3
const GAP = 5
const CARD_W = (PAGE_W - MARGIN * 2 - GAP * (COLS - 1)) / COLS
const CARD_H = 76
const IMG_BOX_H = 42

interface NormalizedImage {
  data: string
  width: number
  height: number
}

/** Redimensiona y convierte cualquier formato a JPEG vía canvas */
function normalizeImage(dataUrl: string, maxPx = 640): Promise<NormalizedImage | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      try {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
        const width = Math.max(1, Math.round(img.width * scale))
        const height = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) return resolve(null)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)
        resolve({ data: canvas.toDataURL('image/jpeg', 0.82), width, height })
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = dataUrl
  })
}

function money(n: number): string {
  return `S/ ${n.toFixed(2)}`
}

function drawPageHeader(doc: jsPDF, today: string) {
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, PAGE_W, 22, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(19)
  doc.setTextColor(255, 255, 255)
  doc.text('MIRA', MARGIN, 14.5)
  doc.setTextColor(0, 200, 255)
  doc.text('NA', MARGIN + doc.getTextWidth('MIRA'), 14.5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(180, 195, 210)
  doc.text(`Catálogo de productos — ${today}`, PAGE_W - MARGIN, 14.5, { align: 'right' })
}

function drawPageFooter(doc: jsPDF) {
  const page = doc.getCurrentPageInfo().pageNumber
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...GRAY)
  doc.text(`Página ${page}`, PAGE_W - MARGIN, PAGE_H - 7, { align: 'right' })
}

function drawBadge(
  doc: jsPDF,
  x: number,
  y: number,
  label: string,
  color: [number, number, number],
) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6)
  const w = doc.getTextWidth(label) + 3.5
  doc.setFillColor(...color)
  doc.rect(x, y, w, 4.6, 'F')
  doc.setTextColor(255, 255, 255)
  doc.text(label, x + 1.75, y + 3.2)
}

function drawCard(doc: jsPDF, row: CatalogExportRow, img: NormalizedImage | null, x: number, y: number) {
  // Marco
  doc.setDrawColor(...LIGHT)
  doc.setLineWidth(0.25)
  doc.roundedRect(x, y, CARD_W, CARD_H, 1.5, 1.5, 'S')

  // Imagen (contain, centrada) o placeholder
  const boxX = x + 2.5
  const boxY = y + 2.5
  const boxW = CARD_W - 5
  if (img) {
    const ratio = Math.min(boxW / img.width, IMG_BOX_H / img.height)
    const w = img.width * ratio
    const h = img.height * ratio
    doc.addImage(img.data, 'JPEG', boxX + (boxW - w) / 2, boxY + (IMG_BOX_H - h) / 2, w, h)
  } else {
    doc.setFillColor(242, 246, 250)
    doc.rect(boxX, boxY, boxW, IMG_BOX_H, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...GRAY)
    doc.text('MIRANA', x + CARD_W / 2, boxY + IMG_BOX_H / 2 + 1.2, { align: 'center' })
  }

  // Badge: agotado > preventa > descuento
  const discountPct =
    row.salePrice != null && row.salePrice < row.price
      ? Math.round((1 - row.salePrice / row.price) * 100)
      : 0
  if (row.status === 'SOLD_OUT') drawBadge(doc, boxX + 1, boxY + 1, 'AGOTADO', GRAY)
  else if (row.status === 'PREORDER') drawBadge(doc, boxX + 1, boxY + 1, 'PREVENTA', BLUE)
  else if (row.status === 'COMING_SOON') drawBadge(doc, boxX + 1, boxY + 1, 'PRÓXIMAMENTE', BLUE)
  else if (discountPct > 0) drawBadge(doc, boxX + 1, boxY + 1, `-${discountPct}%`, RED)

  // Categoría
  let textY = y + IMG_BOX_H + 7
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5.8)
  doc.setTextColor(...GRAY)
  doc.text(row.category.toUpperCase(), boxX, textY)

  // Nombre (máx. 2 líneas)
  textY += 3.6
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.2)
  doc.setTextColor(...NAVY)
  const nameLines = (doc.splitTextToSize(row.name, boxW) as string[]).slice(0, 2)
  doc.text(nameLines, boxX, textY)
  textY += nameLines.length * 3.5

  // Marca
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(...GRAY)
  doc.text(row.brand, boxX, textY + 0.6)

  // Precios — anclados al fondo de la tarjeta
  const priceY = y + CARD_H - 4.5
  const hasSale = row.salePrice != null && row.salePrice < row.price
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(...CYAN)
  const mainPrice = money(hasSale ? row.salePrice! : row.price)
  doc.text(mainPrice, boxX, priceY)

  if (hasSale) {
    const oldPrice = money(row.price)
    const mainW = doc.getTextWidth(mainPrice)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...GRAY)
    const oldX = boxX + mainW + 2.5
    doc.text(oldPrice, oldX, priceY)
    const oldW = doc.getTextWidth(oldPrice)
    doc.setDrawColor(...GRAY)
    doc.setLineWidth(0.25)
    doc.line(oldX - 0.3, priceY - 0.9, oldX + oldW + 0.3, priceY - 0.9)
  }
}

export async function generateCatalogPdf(rows: CatalogExportRow[]): Promise<void> {
  const { jsPDF } = await import('jspdf')

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const today = Dates.format(Dates.now())

  // Normaliza todas las imágenes primero (canvas → JPEG liviano)
  const images = await Promise.all(
    rows.map((r) => (r.imageDataUrl ? normalizeImage(r.imageDataUrl) : Promise.resolve(null))),
  )

  const perPage = COLS * Math.floor((PAGE_H - HEADER_H - 10) / (CARD_H + GAP))

  rows.forEach((row, i) => {
    const indexInPage = i % perPage
    if (indexInPage === 0) {
      if (i > 0) doc.addPage()
      drawPageHeader(doc, today)
      drawPageFooter(doc)
    }
    const col = indexInPage % COLS
    const rowIdx = Math.floor(indexInPage / COLS)
    const x = MARGIN + col * (CARD_W + GAP)
    const y = HEADER_H + rowIdx * (CARD_H + GAP)
    drawCard(doc, row, images[i], x, y)
  })

  doc.save(`catalogo-mirana-${Dates.format(Dates.now(), 'yyyy-MM-dd')}.pdf`)
}

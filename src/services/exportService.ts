import type { Workbook } from 'exceljs'
import type { jsPDF } from 'jspdf'
import {
  CATEGORIAS,
  ESTADO_META,
  ESTADOS,
  PRIORIDAD_META,
  PRIORIDADES,
  type FilterState,
  type Pedido,
} from '../types'

// ════════════════════════════════════════════════════════════════════
//  Exportación con formato ejecutivo — Excel (exceljs) · PDF (jspdf) · CSV
//
//  `construir*` son ISOMÓRFICAS (navegador y Node); `exportTo*` envuelven
//  la descarga. Columnas en un solo lugar: Excel/CSV completo, PDF escaneable.
// ════════════════════════════════════════════════════════════════════

export function filterPedidos(pedidos: Pedido[], f: FilterState): Pedido[] {
  const q = f.texto.trim().toLowerCase()
  return pedidos
    .filter((p) => {
      if (f.persona && (p.persona_solicita ?? '') !== f.persona) return false
      if (f.prioridad && p.prioridad !== f.prioridad) return false
      if (f.estado && p.estado !== f.estado) return false
      if (f.categoria && !p.categorias.includes(f.categoria)) return false
      if (q) {
        const blob = [
          p.descripcion,
          p.persona_solicita ?? '',
          p.tipo ?? '',
          p.notas ?? '',
          p.categorias.join(' '),
        ]
          .join(' ')
          .toLowerCase()
        if (!blob.includes(q)) return false
      }
      return true
    })
    .sort((a, b) => {
      const pr = PRIORIDAD_META[a.prioridad].rank - PRIORIDAD_META[b.prioridad].rank
      if (pr !== 0) return pr
      return b.created_at.localeCompare(a.created_at)
    })
}

export function personasUnicas(pedidos: Pedido[]): string[] {
  const set = new Set<string>()
  for (const p of pedidos) if (p.persona_solicita) set.add(p.persona_solicita)
  return [...set].sort((a, b) => a.localeCompare(b, 'es'))
}

export function formatFecha(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function selloArchivo(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`
}

// ── Columnas (una sola fuente de verdad) ─────────────────────────────

type ColTipo = 'prioridad' | 'estado'
interface Col {
  h: string
  get: (p: Pedido) => string
  xlW: number
  pdfW?: number | 'auto'
  center?: boolean
  wrap?: boolean
  tipo?: ColTipo
}

const C: Record<string, Col> = {
  fecha: { h: 'Creado', get: (p) => formatFecha(p.created_at), xlW: 17 },
  prioridad: {
    h: 'Prioridad',
    get: (p) => PRIORIDAD_META[p.prioridad].label,
    xlW: 11,
    pdfW: 56,
    center: true,
    tipo: 'prioridad',
  },
  estado: {
    h: 'Estado',
    get: (p) => ESTADO_META[p.estado].label,
    xlW: 13,
    pdfW: 70,
    center: true,
    tipo: 'estado',
  },
  descripcion: { h: 'Descripción', get: (p) => p.descripcion, xlW: 50, pdfW: 226, wrap: true },
  solicita: { h: 'Solicita', get: (p) => p.persona_solicita ?? '', xlW: 14, pdfW: 64 },
  tipo: { h: 'Tipo de gestión', get: (p) => p.tipo ?? '', xlW: 22, pdfW: 112 },
  categorias: { h: 'Categorías', get: (p) => p.categorias.join(', '), xlW: 18, pdfW: 'auto' },
  notas: { h: 'Notas', get: (p) => p.notas ?? '', xlW: 36, wrap: true },
}

const COLS_XL: Col[] = [
  C.fecha, C.prioridad, C.estado, C.descripcion, C.solicita, C.tipo, C.categorias, C.notas,
]
const COLS_PDF: Col[] = [
  C.prioridad, C.estado, C.descripcion, C.solicita, C.tipo, C.categorias,
]

// ── Resumen ejecutivo / KPIs ─────────────────────────────────────────

export interface Kpis {
  total: number
  altaPendiente: number
  enProgreso: number
  completados: number
  nuevos: number
  avance: number
}

export function kpis(pedidos: Pedido[]): Kpis {
  const total = pedidos.length
  const nuevos = pedidos.filter((p) => p.estado === 'nuevo').length
  const enProgreso = pedidos.filter((p) => p.estado === 'en_progreso').length
  const completados = pedidos.filter((p) => p.estado === 'completado').length
  const altaPendiente = pedidos.filter(
    (p) => p.prioridad === 'alta' && p.estado !== 'completado',
  ).length
  const avance = total ? Math.round((completados / total) * 100) : 0
  return { total, altaPendiente, enProgreso, completados, nuevos, avance }
}

export function resumen(pedidos: Pedido[]): {
  porEstado: [string, number][]
  porPrioridad: [string, number][]
  porCategoria: [string, number][]
} {
  const cuenta = <T extends string>(keys: T[], pick: (p: Pedido) => T | T[]) => {
    const m = new Map<string, number>(keys.map((k) => [k, 0]))
    for (const p of pedidos) {
      const v = pick(p)
      for (const k of Array.isArray(v) ? v : [v]) m.set(k, (m.get(k) ?? 0) + 1)
    }
    return [...m.entries()]
  }
  const porEstado = cuenta(
    ESTADOS.map((e) => ESTADO_META[e].label),
    (p) => ESTADO_META[p.estado].label,
  )
  const porPrioridad = cuenta(
    PRIORIDADES.map((p) => PRIORIDAD_META[p].label),
    (p) => PRIORIDAD_META[p.prioridad].label,
  )
  const cats = [...CATEGORIAS, 'Sin categoría']
  const porCategoria = cuenta(cats, (p) =>
    p.categorias.length ? p.categorias : ['Sin categoría'],
  )
  return { porEstado, porPrioridad, porCategoria }
}

// ════════════════════════════════════════════════════════════════════
//  CSV
// ════════════════════════════════════════════════════════════════════

function celdaCSV(v: string): string {
  return /[",\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function construirCsv(pedidos: Pedido[]): string {
  const lineas = [
    COLS_XL.map((c) => c.h).join(';'),
    ...pedidos.map((p) => COLS_XL.map((c) => celdaCSV(c.get(p))).join(';')),
  ]
  return '﻿' + lineas.join('\r\n') // BOM UTF-8
}

// ════════════════════════════════════════════════════════════════════
//  EXCEL
// ════════════════════════════════════════════════════════════════════

const XL = {
  brand: 'FF003DA5',
  brandSoft: 'FFE8F2FC',
  ink: 'FF1E293B',
  gris: 'FF64748B',
  rojo: 'FFC81E1E',
  zebra: 'FFEDF2F8',
  borde: 'FFE2E8F0',
}
const XL_PRIORIDAD: Record<string, { bg: string; fg: string }> = {
  Alta: { bg: 'FFFBDDDD', fg: 'FFC81E1E' },
  Normal: { bg: 'FFFCEACB', fg: 'FF7A4E00' },
  Baja: { bg: 'FFE6F5EC', fg: 'FF15803D' },
}
const XL_ESTADO: Record<string, { bg: string; fg: string }> = {
  Nuevo: { bg: 'FFE7F1FB', fg: 'FF1B6CB0' },
  'En progreso': { bg: 'FFEFE9FB', fg: 'FF6D28D9' },
  Completado: { bg: 'FFE6F5EC', fg: 'FF15803D' },
}

export async function construirWorkbook(pedidos: Pedido[]): Promise<Workbook> {
  const mod = await import('exceljs')
  const ExcelJS = (mod as { default?: typeof import('exceljs') }).default ?? mod
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Agenda R. Garibay'
  wb.created = new Date()

  const k = kpis(pedidos)
  const N = COLS_XL.length

  const ws = wb.addWorksheet('Pedidos', {
    views: [{ state: 'frozen', ySplit: 4 }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  })
  ws.columns = COLS_XL.map((c) => ({ width: c.xlW }))

  ws.mergeCells(1, 1, 1, N)
  const t = ws.getCell(1, 1)
  t.value = 'AGENDA R. GARIBAY — Pedidos de mantenimiento'
  t.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } }
  t.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.brand } }
  t.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  ws.getRow(1).height = 30

  ws.mergeCells(2, 1, 2, N)
  const sub = ws.getCell(2, 1)
  sub.value = {
    richText: [
      {
        text: `Generado ${formatFecha(new Date().toISOString())}   ·   ${k.total} pedido(s)   ·   Avance ${k.avance}%   ·   `,
        font: { name: 'Calibri', size: 10, color: { argb: XL.gris } },
      },
      {
        text: `Alta pendientes: ${k.altaPendiente}`,
        font: { name: 'Calibri', size: 10, bold: true, color: { argb: XL.rojo } },
      },
    ],
  }
  sub.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.brandSoft } }
  sub.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  ws.getRow(2).height = 18
  ws.getRow(3).height = 6

  const head = ws.getRow(4)
  COLS_XL.forEach((c, i) => {
    const cell = head.getCell(i + 1)
    cell.value = c.h
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.brand } }
    cell.alignment = { vertical: 'middle', horizontal: c.center ? 'center' : 'left', indent: 1 }
  })
  head.height = 22

  pedidos.forEach((p, idx) => {
    const r = ws.addRow(COLS_XL.map((c) => c.get(p)))
    const lineas = Math.max(
      1,
      Math.ceil((p.descripcion?.length ?? 0) / 50),
      Math.ceil((p.notas?.length ?? 0) / 36),
    )
    r.height = 15 * lineas + 10
    const zebra = idx % 2 === 1
    COLS_XL.forEach((c, ci) => {
      const cell = r.getCell(ci + 1)
      cell.font = { name: 'Calibri', size: 10, color: { argb: XL.ink } }
      cell.alignment = {
        vertical: 'middle',
        horizontal: c.center ? 'center' : 'left',
        wrapText: c.wrap,
        indent: 1,
      }
      cell.border = { bottom: { style: 'hair', color: { argb: XL.borde } } }
      if (zebra) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.zebra } }
      if (c.tipo === 'prioridad') {
        const m = XL_PRIORIDAD[PRIORIDAD_META[p.prioridad].label]
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: m.bg } }
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: m.fg } }
      } else if (c.tipo === 'estado') {
        const m = XL_ESTADO[ESTADO_META[p.estado].label]
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: m.bg } }
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: m.fg } }
      }
    })
  })

  if (pedidos.length === 0) {
    const r = ws.addRow(['(sin pedidos para los filtros actuales)'])
    ws.mergeCells(r.number, 1, r.number, N)
    r.getCell(1).font = { italic: true, color: { argb: XL.gris } }
    r.getCell(1).alignment = { horizontal: 'center' }
  }

  ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: N } }

  // ── Hoja Resumen ──
  const rs = wb.addWorksheet('Resumen', { pageSetup: { orientation: 'portrait' } })
  rs.columns = [20, 20, 20, 20].map((width) => ({ width }))

  rs.mergeCells(1, 1, 1, 4)
  const rt = rs.getCell(1, 1)
  rt.value = 'RESUMEN EJECUTIVO'
  rt.font = { size: 15, bold: true, color: { argb: 'FFFFFFFF' } }
  rt.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.brand } }
  rt.alignment = { vertical: 'middle', indent: 1 }
  rs.getRow(1).height = 28

  const tarjetas: [string, string | number, string][] = [
    ['Total', k.total, XL.brand],
    ['Alta · pend.', k.altaPendiente, 'FFC81E1E'],
    ['En progreso', k.enProgreso, 'FF6D28D9'],
    ['Avance', `${k.avance}%`, 'FF15803D'],
  ]
  tarjetas.forEach(([label, val, color], i) => {
    const col = i + 1
    const lc = rs.getCell(3, col)
    lc.value = label
    lc.font = { size: 9, bold: true, color: { argb: XL.gris } }
    lc.alignment = { horizontal: 'center' }
    const vc = rs.getCell(4, col)
    vc.value = val
    vc.font = { size: 20, bold: true, color: { argb: color } }
    vc.alignment = { horizontal: 'center', vertical: 'middle' }
    vc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.brandSoft } }
    vc.border = { bottom: { style: 'medium', color: { argb: color } } }
  })
  rs.getRow(4).height = 32

  const r = resumen(pedidos)
  let fila0 = 6
  const bloque = (
    titulo: string,
    datos: [string, number][],
    colMap?: Record<string, { bg: string; fg: string }>,
  ) => {
    rs.mergeCells(fila0, 1, fila0, 2)
    const h = rs.getCell(fila0, 1)
    h.value = titulo
    h.font = { size: 11, bold: true, color: { argb: 'FFFFFFFF' } }
    h.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.gris } }
    h.alignment = { indent: 1 }
    fila0++
    for (const [k2, v] of datos) {
      const a = rs.getCell(fila0, 1)
      a.value = k2
      a.font = { size: 10, color: { argb: XL.ink } }
      a.alignment = { indent: 1 }
      const b = rs.getCell(fila0, 2)
      b.value = v
      b.font = { size: 10, bold: true, color: { argb: XL.ink } }
      b.alignment = { horizontal: 'center' }
      if (colMap?.[k2]) {
        a.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colMap[k2].bg } }
        a.font = { size: 10, bold: true, color: { argb: colMap[k2].fg } }
      }
      fila0++
    }
    fila0++
  }
  bloque('Por estado', r.porEstado, XL_ESTADO)
  bloque('Por prioridad', r.porPrioridad, XL_PRIORIDAD)
  bloque('Por circuito', r.porCategoria)

  return wb
}

// ════════════════════════════════════════════════════════════════════
//  PDF
// ════════════════════════════════════════════════════════════════════

const PDF_PRIORIDAD: Record<string, { bg: [number, number, number]; fg: [number, number, number] }> = {
  Alta: { bg: [248, 209, 209], fg: [185, 28, 28] },
  Normal: { bg: [252, 233, 201], fg: [138, 82, 0] },
  Baja: { bg: [224, 242, 231], fg: [21, 128, 61] },
}
const PDF_ESTADO: Record<string, { bg: [number, number, number]; fg: [number, number, number] }> = {
  Nuevo: { bg: [231, 241, 251], fg: [27, 108, 176] },
  'En progreso': { bg: [239, 233, 251], fg: [109, 40, 217] },
  Completado: { bg: [230, 245, 236], fg: [21, 128, 61] },
}

export async function construirPdf(pedidos: Pedido[]): Promise<jsPDF> {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const M = 40
  const k = kpis(pedidos)

  doc.setFillColor(0, 61, 165)
  doc.rect(0, 0, W, 56, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(17)
  doc.text('Agenda R. Garibay', M, 30)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.text('Pedidos de mantenimiento mecánico · Planta de Beneficio SHP', M, 46)
  doc.setFontSize(9)
  doc.text(`${k.total} pedido(s)  ·  ${formatFecha(new Date().toISOString())}`, W - M, 30, {
    align: 'right',
  })

  const tarjetas: [string, string, [number, number, number]][] = [
    ['TOTAL', String(k.total), [0, 61, 165]],
    ['ALTA · PENDIENTES', String(k.altaPendiente), [200, 30, 30]],
    ['EN PROGRESO', String(k.enProgreso), [109, 40, 217]],
    ['AVANCE', `${k.avance}%`, [21, 128, 61]],
  ]
  const gap = 12
  const cardW = (W - M * 2 - gap * 3) / 4
  const cardY = 70
  const cardH = 50
  tarjetas.forEach(([label, val, color], i) => {
    const x = M + i * (cardW + gap)
    doc.setFillColor(247, 250, 253)
    doc.roundedRect(x, cardY, cardW, cardH, 6, 6, 'F')
    doc.setFillColor(color[0], color[1], color[2])
    doc.roundedRect(x, cardY, 5, cardH, 2, 2, 'F')
    doc.setTextColor(100, 116, 139)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.text(label, x + 14, cardY + 18)
    doc.setTextColor(color[0], color[1], color[2])
    doc.setFontSize(20)
    doc.text(val, x + 14, cardY + 40)
  })

  const idxPrioridad = COLS_PDF.findIndex((c) => c.tipo === 'prioridad')
  const idxEstado = COLS_PDF.findIndex((c) => c.tipo === 'estado')

  const columnStyles: Record<number, { cellWidth: number | 'auto'; halign?: 'center'; fontStyle?: 'bold' }> = {}
  COLS_PDF.forEach((c, i) => {
    columnStyles[i] = {
      cellWidth: c.pdfW ?? 'auto',
      ...(c.center ? { halign: 'center' as const } : {}),
      ...(c.tipo ? { fontStyle: 'bold' as const } : {}),
    }
  })

  autoTable(doc, {
    startY: cardY + cardH + 14,
    head: [COLS_PDF.map((c) => c.h)],
    body: pedidos.map((p) => COLS_PDF.map((c) => c.get(p))),
    styles: {
      fontSize: 8,
      cellPadding: 4,
      overflow: 'linebreak',
      valign: 'middle',
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
    },
    headStyles: { fillColor: [0, 61, 165], textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
    alternateRowStyles: { fillColor: [247, 250, 253] },
    columnStyles,
    margin: { left: M, right: M },
    didParseCell: (data) => {
      if (data.section !== 'body') return
      const raw = String(data.cell.raw ?? '')
      if (data.column.index === idxPrioridad && PDF_PRIORIDAD[raw]) {
        data.cell.styles.fillColor = PDF_PRIORIDAD[raw].bg
        data.cell.styles.textColor = PDF_PRIORIDAD[raw].fg
      } else if (data.column.index === idxEstado && PDF_ESTADO[raw]) {
        data.cell.styles.fillColor = PDF_ESTADO[raw].bg
        data.cell.styles.textColor = PDF_ESTADO[raw].fg
      }
    },
  })

  const paginas = doc.getNumberOfPages()
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i)
    const H = doc.internal.pageSize.getHeight()
    doc.setDrawColor(226, 232, 240)
    doc.line(M, H - 26, W - M, H - 26)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(148, 163, 184)
    doc.text('Agenda R. Garibay · Alianza Lima × Shougang Hierro Perú', M, H - 14)
    doc.text(`Página ${i} de ${paginas}`, W - M, H - 14, { align: 'right' })
  }

  return doc
}

// ════════════════════════════════════════════════════════════════════
//  Descargas (navegador)
// ════════════════════════════════════════════════════════════════════

function descargar(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportToExcel(pedidos: Pedido[]): Promise<void> {
  const wb = await construirWorkbook(pedidos)
  const buf = await wb.xlsx.writeBuffer()
  descargar(
    new Blob([buf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    `agenda-r-garibay_${selloArchivo()}.xlsx`,
  )
}

export async function exportToPDF(pedidos: Pedido[]): Promise<void> {
  const doc = await construirPdf(pedidos)
  doc.save(`agenda-r-garibay_${selloArchivo()}.pdf`)
}

export function exportToCSV(pedidos: Pedido[]): void {
  descargar(
    new Blob([construirCsv(pedidos)], { type: 'text/csv;charset=utf-8;' }),
    `agenda-r-garibay_${selloArchivo()}.csv`,
  )
}

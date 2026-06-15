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
//  Diseño: las funciones `construir*` son ISOMÓRFICAS (navegador y Node)
//  y solo arman el artefacto. Las funciones `exportTo*` envuelven la
//  descarga en el navegador. Así un script puede generar hojas reales
//  para que agentes visuales las auditen.
// ════════════════════════════════════════════════════════════════════

// ── Filtro y utilidades de datos ─────────────────────────────────────

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
          p.notas ?? '',
          p.reunion ?? '',
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

const ENCABEZADOS = [
  'Fecha',
  'Solicita',
  'Descripción',
  'Prioridad',
  'Categorías',
  'Estado',
  'Reunión',
  'Notas',
]

function fila(p: Pedido): string[] {
  return [
    formatFecha(p.created_at),
    p.persona_solicita ?? '—',
    p.descripcion,
    PRIORIDAD_META[p.prioridad].label,
    p.categorias.join(', '),
    ESTADO_META[p.estado].label,
    p.reunion ?? '',
    p.notas ?? '',
  ]
}

// ── Resumen ejecutivo ────────────────────────────────────────────────

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
//  CSV  (texto plano: limpio y listo para reimportar)
// ════════════════════════════════════════════════════════════════════

function celdaCSV(v: string): string {
  return /[",\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function construirCsv(pedidos: Pedido[]): string {
  // Para CSV (reimportable) los vacíos van en blanco, sin el '—' de display.
  const filaCsv = (p: Pedido): string[] => [
    formatFecha(p.created_at),
    p.persona_solicita ?? '',
    p.descripcion,
    PRIORIDAD_META[p.prioridad].label,
    p.categorias.join(', '),
    ESTADO_META[p.estado].label,
    p.reunion ?? '',
    p.notas ?? '',
  ]
  const lineas = [
    ENCABEZADOS.join(';'),
    ...pedidos.map((p) => filaCsv(p).map(celdaCSV).join(';')),
  ]
  return '﻿' + lineas.join('\r\n') // BOM UTF-8: Excel respeta los acentos
}

// ════════════════════════════════════════════════════════════════════
//  EXCEL  (exceljs — estilos reales: marca, color por prioridad/estado)
// ════════════════════════════════════════════════════════════════════

// Paleta ARGB (relleno suave + texto oscuro para contraste legible)
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
  const NCOL = ENCABEZADOS.length

  // ───────────────────────── Hoja: Pedidos ─────────────────────────
  const ws = wb.addWorksheet('Pedidos', {
    views: [{ state: 'frozen', ySplit: 4 }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  })
  ws.columns = [
    { width: 17 },
    { width: 12 },
    { width: 50 },
    { width: 11 },
    { width: 20 },
    { width: 14 },
    { width: 22 },
    { width: 38 },
  ]

  // Título (fila 1) + metadatos (fila 2)
  ws.mergeCells(1, 1, 1, NCOL)
  const t = ws.getCell(1, 1)
  t.value = 'AGENDA R. GARIBAY — Pedidos de mantenimiento'
  t.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } }
  t.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.brand } }
  t.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  ws.getRow(1).height = 30

  ws.mergeCells(2, 1, 2, NCOL)
  const sub = ws.getCell(2, 1)
  // "Alta pendientes" resaltado en rojo: es el dato de acción del gerente.
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
  ws.getRow(3).height = 6 // respiro

  // Encabezados (fila 4)
  const head = ws.getRow(4)
  ENCABEZADOS.forEach((h, i) => {
    const c = head.getCell(i + 1)
    c.value = h
    c.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.brand } }
    c.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
    c.border = { bottom: { style: 'thin', color: { argb: XL.brand } } }
  })
  head.height = 22

  // Datos
  pedidos.forEach((p, idx) => {
    const r = ws.addRow(fila(p))
    // Alto según el texto más largo (descripción/notas) para que no se corte.
    const lineas = Math.max(
      1,
      Math.ceil((p.descripcion?.length ?? 0) / 46),
      Math.ceil((p.notas?.length ?? 0) / 34),
    )
    r.height = 15 * lineas + 10
    const zebra = idx % 2 === 1
    r.eachCell({ includeEmpty: true }, (cell, col) => {
      cell.font = { name: 'Calibri', size: 10, color: { argb: XL.ink } }
      cell.alignment = {
        vertical: 'middle',
        horizontal: col === 1 || col === 4 || col === 6 ? 'center' : 'left',
        wrapText: col === 3 || col === 8,
        indent: 1,
      }
      cell.border = {
        bottom: { style: 'hair', color: { argb: XL.borde } },
      }
      if (zebra) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.zebra } }
    })
    // Prioridad (col 4) y Estado (col 6): color semántico
    const pc = r.getCell(4)
    const pm = XL_PRIORIDAD[PRIORIDAD_META[p.prioridad].label]
    pc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pm.bg } }
    pc.font = { name: 'Calibri', size: 10, bold: true, color: { argb: pm.fg } }
    const ec = r.getCell(6)
    const em = XL_ESTADO[ESTADO_META[p.estado].label]
    ec.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: em.bg } }
    ec.font = { name: 'Calibri', size: 10, bold: true, color: { argb: em.fg } }
  })

  if (pedidos.length === 0) {
    const r = ws.addRow(['(sin pedidos para los filtros actuales)'])
    ws.mergeCells(r.number, 1, r.number, NCOL)
    r.getCell(1).font = { italic: true, color: { argb: XL.gris } }
    r.getCell(1).alignment = { horizontal: 'center' }
  }

  ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: NCOL } }

  // ───────────────────────── Hoja: Resumen ─────────────────────────
  const rs = wb.addWorksheet('Resumen', {
    pageSetup: { orientation: 'portrait' },
  })
  rs.columns = [{ width: 26 }, { width: 14 }, { width: 4 }, { width: 26 }, { width: 14 }]

  rs.mergeCells(1, 1, 1, 5)
  const rt = rs.getCell(1, 1)
  rt.value = 'RESUMEN EJECUTIVO'
  rt.font = { size: 15, bold: true, color: { argb: 'FFFFFFFF' } }
  rt.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.brand } }
  rt.alignment = { vertical: 'middle', indent: 1 }
  rs.getRow(1).height = 28

  // Tarjetas KPI (fila 3-4): etiqueta arriba, número grande abajo
  const tarjetas: [string, string | number, string][] = [
    ['Total de pedidos', k.total, XL.brand],
    ['Alta · pendientes', k.altaPendiente, 'FFC81E1E'],
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
    vc.font = { size: 22, bold: true, color: { argb: color } }
    vc.alignment = { horizontal: 'center', vertical: 'middle' }
    vc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.brandSoft } }
    vc.border = { bottom: { style: 'medium', color: { argb: color } } }
  })
  rs.getRow(4).height = 34

  // Bloques de desglose
  const r = resumen(pedidos)
  let fila0 = 6
  const bloque = (titulo: string, datos: [string, number][], colMap?: Record<string, { bg: string; fg: string }>) => {
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
      if (colMap && colMap[k2]) {
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
//  PDF  (jspdf + autotable — banda de marca, tira de KPIs, tabla)
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

  // Banda de marca
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
  doc.text(
    `${k.total} pedido(s)  ·  ${formatFecha(new Date().toISOString())}`,
    W - M,
    30,
    { align: 'right' },
  )

  // Tira de KPIs (tarjetas)
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

  // Tabla
  autoTable(doc, {
    startY: cardY + cardH + 14,
    head: [ENCABEZADOS],
    body: pedidos.map(fila),
    styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak', valign: 'middle', lineColor: [226, 232, 240], lineWidth: 0.5 },
    headStyles: { fillColor: [0, 61, 165], textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
    alternateRowStyles: { fillColor: [247, 250, 253] },
    columnStyles: {
      0: { cellWidth: 76 },
      1: { cellWidth: 54 },
      2: { cellWidth: 198 },
      3: { cellWidth: 50, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 88 },
      5: { cellWidth: 64, halign: 'center', fontStyle: 'bold' },
      7: { cellWidth: 'auto' },
    },
    margin: { left: M, right: M },
    didParseCell: (data) => {
      if (data.section !== 'body') return
      const raw = String(data.cell.raw ?? '')
      if (data.column.index === 3 && PDF_PRIORIDAD[raw]) {
        data.cell.styles.fillColor = PDF_PRIORIDAD[raw].bg
        data.cell.styles.textColor = PDF_PRIORIDAD[raw].fg
      }
      if (data.column.index === 5 && PDF_ESTADO[raw]) {
        data.cell.styles.fillColor = PDF_ESTADO[raw].bg
        data.cell.styles.textColor = PDF_ESTADO[raw].fg
      }
    },
  })

  // Pie con paginación
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

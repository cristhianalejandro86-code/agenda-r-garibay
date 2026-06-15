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
//  Filtro y export (Excel / PDF / CSV)
// ════════════════════════════════════════════════════════════════════

/** Aplica todos los filtros activos y ordena (prioridad ↓, luego fecha ↓). */
export function filterPedidos(
  pedidos: Pedido[],
  f: FilterState,
): Pedido[] {
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

/** Personas únicas presentes en los datos (para el select de filtros). */
export function personasUnicas(pedidos: Pedido[]): string[] {
  const set = new Set<string>()
  for (const p of pedidos) {
    if (p.persona_solicita) set.add(p.persona_solicita)
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'es'))
}

// ── Formato ──────────────────────────────────────────────────────────

export function formatFecha(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`
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

// ── Resumen estadístico (para hoja 2 del Excel) ──────────────────────

export function resumen(pedidos: Pedido[]): {
  total: number
  porEstado: Record<string, number>
  porPrioridad: Record<string, number>
  porCategoria: Record<string, number>
} {
  const porEstado: Record<string, number> = {}
  const porPrioridad: Record<string, number> = {}
  const porCategoria: Record<string, number> = {}

  for (const e of ESTADOS) porEstado[ESTADO_META[e].label] = 0
  for (const pr of PRIORIDADES) porPrioridad[PRIORIDAD_META[pr].label] = 0
  for (const c of CATEGORIAS) porCategoria[c] = 0
  porCategoria['Sin categoría'] = 0

  for (const p of pedidos) {
    porEstado[ESTADO_META[p.estado].label]++
    porPrioridad[PRIORIDAD_META[p.prioridad].label]++
    if (p.categorias.length === 0) porCategoria['Sin categoría']++
    else
      for (const c of p.categorias) {
        porCategoria[c] = (porCategoria[c] ?? 0) + 1
      }
  }
  return { total: pedidos.length, porEstado, porPrioridad, porCategoria }
}

// ── Excel (2 hojas) ──────────────────────────────────────────────────

export async function exportToExcel(pedidos: Pedido[]): Promise<void> {
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()

  // Hoja 1: datos
  const datos = [ENCABEZADOS, ...pedidos.map(fila)]
  const ws1 = XLSX.utils.aoa_to_sheet(datos)
  ws1['!cols'] = [
    { wch: 17 },
    { wch: 12 },
    { wch: 48 },
    { wch: 10 },
    { wch: 18 },
    { wch: 13 },
    { wch: 20 },
    { wch: 34 },
  ]
  XLSX.utils.book_append_sheet(wb, ws1, 'Pedidos')

  // Hoja 2: resumen
  const r = resumen(pedidos)
  const aoa: (string | number)[][] = [
    ['Agenda R. Garibay — Resumen'],
    ['Generado', formatFecha(new Date().toISOString())],
    ['Total de pedidos', r.total],
    [],
    ['Por estado'],
    ...Object.entries(r.porEstado).map(([k, v]) => [k, v]),
    [],
    ['Por prioridad'],
    ...Object.entries(r.porPrioridad).map(([k, v]) => [k, v]),
    [],
    ['Por categoría'],
    ...Object.entries(r.porCategoria).map(([k, v]) => [k, v]),
  ]
  const ws2 = XLSX.utils.aoa_to_sheet(aoa)
  ws2['!cols'] = [{ wch: 22 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(wb, ws2, 'Resumen')

  XLSX.writeFile(wb, `agenda-r-garibay_${selloArchivo()}.xlsx`)
}

// ── PDF (tabla) ──────────────────────────────────────────────────────

export async function exportToPDF(pedidos: Pedido[]): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })

  // Encabezado de marca
  doc.setFillColor(0, 61, 165) // alianza blue
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 54, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('Agenda R. Garibay', 40, 34)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(
    `Pedidos de mantenimiento · ${pedidos.length} registro(s) · ${formatFecha(
      new Date().toISOString(),
    )}`,
    doc.internal.pageSize.getWidth() - 40,
    34,
    { align: 'right' },
  )

  autoTable(doc, {
    startY: 70,
    head: [ENCABEZADOS],
    body: pedidos.map(fila),
    styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak' },
    headStyles: { fillColor: [0, 61, 165], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [240, 246, 252] },
    columnStyles: {
      0: { cellWidth: 78 },
      2: { cellWidth: 200 },
      7: { cellWidth: 150 },
    },
    margin: { left: 40, right: 40 },
  })

  doc.save(`agenda-r-garibay_${selloArchivo()}.pdf`)
}

// ── CSV (nativo) ─────────────────────────────────────────────────────

function celdaCSV(v: string): string {
  if (/[",\n;]/.test(v)) return `"${v.replace(/"/g, '""')}"`
  return v
}

export function exportToCSV(pedidos: Pedido[]): void {
  const lineas = [
    ENCABEZADOS.join(';'),
    ...pedidos.map((p) => fila(p).map(celdaCSV).join(';')),
  ]
  // BOM para que Excel respete los acentos en UTF-8
  const blob = new Blob(['﻿' + lineas.join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `agenda-r-garibay_${selloArchivo()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

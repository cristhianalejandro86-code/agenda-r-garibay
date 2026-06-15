import type { Estado } from '../types'

// ════════════════════════════════════════════════════════════════════
//  Utilidades de fecha de vencimiento (trabaja con fechas YYYY-MM-DD,
//  comparando como texto para evitar desfases de zona horaria).
// ════════════════════════════════════════════════════════════════════

/** Hoy en formato YYYY-MM-DD (hora local). */
export function hoyISO(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** 'dd/mm/yyyy' a partir de 'YYYY-MM-DD', o '—' si no hay fecha. */
export function formatVence(iso: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

/** Un pedido está vencido si tiene fecha pasada y no está completado. */
export function esVencido(p: {
  fecha_vencimiento: string | null
  estado: Estado
}): boolean {
  if (!p.fecha_vencimiento || p.estado === 'completado') return false
  return p.fecha_vencimiento < hoyISO()
}

/**
 * Días desde hoy hasta la fecha (negativo = vencido, 0 = hoy).
 * null si no hay fecha.
 */
export function diasParaVencer(iso: string | null): number | null {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  const venc = new Date(y, m - 1, d)
  const hoy = new Date()
  const h0 = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  return Math.round((venc.getTime() - h0.getTime()) / 86_400_000)
}

/** Texto humano corto del vencimiento: "Vencido 3d", "Hoy", "en 5d". */
export function etiquetaVence(iso: string | null): string {
  const dias = diasParaVencer(iso)
  if (dias === null) return '—'
  if (dias < 0) return `Vencido ${Math.abs(dias)}d`
  if (dias === 0) return 'Vence hoy'
  if (dias === 1) return 'Vence mañana'
  return `en ${dias}d`
}

// ════════════════════════════════════════════════════════════════════
//  Tipos de dominio — Agenda R. Garibay
// ════════════════════════════════════════════════════════════════════

export type Prioridad = 'alta' | 'normal' | 'baja'
export type Estado = 'nuevo' | 'en_progreso' | 'completado'

/** Circuitos de la planta usados como categorías de un pedido. */
export type Categoria = 'HPGR' | 'Filtros' | 'Magnética' | 'Relaves' | 'Gestión'

/** Fila de la tabla `public.pedidos` en Supabase. */
export interface Pedido {
  id: string
  user_id: string
  persona_solicita: string | null
  descripcion: string
  prioridad: Prioridad
  categorias: string[]
  estado: Estado
  notas: string | null
  reunion: string | null
  /** Fecha límite (YYYY-MM-DD) o null si sin fecha. */
  fecha_vencimiento: string | null
  /** A quién se asigna la ejecución (distinto de persona_solicita). */
  responsable: string | null
  /** Equipo/TAG afectado (ej. 034-001, FP-02). */
  equipo: string | null
  /** Tipo de gestión (texto libre). */
  tipo: string | null
  created_at: string
  updated_at: string
}

/** Campos editables al crear un pedido (el resto los pone la BD). */
export interface NuevoPedido {
  persona_solicita: string | null
  descripcion: string
  prioridad: Prioridad
  categorias: string[]
  estado: Estado
  notas: string | null
  reunion: string | null
  fecha_vencimiento: string | null
  responsable: string | null
  equipo: string | null
  /** Tipo de gestión (texto libre). */
  tipo: string | null
}

/** Resultado del parseo del texto libre del input. */
export interface ParsedInput {
  persona_solicita: string | null
  descripcion: string
  prioridad: Prioridad
  categorias: Categoria[]
}

/** Estado del panel de filtros. */
export interface FilterState {
  texto: string
  persona: string // '' = todas
  prioridad: Prioridad | '' // '' = todas
  estado: Estado | '' // '' = todos
  categoria: Categoria | '' // '' = todas
}

export const FILTROS_VACIOS: FilterState = {
  texto: '',
  persona: '',
  prioridad: '',
  estado: '',
  categoria: '',
}

export type ExportFormat = 'excel' | 'pdf' | 'csv'

export interface ExportOptions {
  formato: ExportFormat
  pedidos: Pedido[]
}

// ── Configuración visual (etiquetas, colores, orden) ─────────────────

export const PRIORIDADES: Prioridad[] = ['alta', 'normal', 'baja']
export const ESTADOS: Estado[] = ['nuevo', 'en_progreso', 'completado']
export const CATEGORIAS: Categoria[] = ['HPGR', 'Filtros', 'Magnética', 'Relaves', 'Gestión']

export const PRIORIDAD_META: Record<
  Prioridad,
  { label: string; emoji: string; color: string; rank: number }
> = {
  alta: { label: 'Alta', emoji: '🔴', color: '#DC2626', rank: 0 },
  normal: { label: 'Normal', emoji: '🟡', color: '#F59E0B', rank: 1 },
  baja: { label: 'Baja', emoji: '🟢', color: '#16A34A', rank: 2 },
}

export const ESTADO_META: Record<
  Estado,
  { label: string; color: string; siguiente: Estado | null; previo: Estado | null }
> = {
  nuevo: { label: 'Nuevo', color: '#5BA4E6', siguiente: 'en_progreso', previo: null },
  en_progreso: {
    label: 'En progreso',
    color: '#7C3AED',
    siguiente: 'completado',
    previo: 'nuevo',
  },
  completado: {
    label: 'Completado',
    color: '#16A34A',
    siguiente: null,
    previo: 'en_progreso',
  },
}

export const CATEGORIA_META: Record<Categoria, { color: string }> = {
  HPGR: { color: '#003DA5' },
  Filtros: { color: '#0E7490' },
  Magnética: { color: '#7C3AED' },
  Relaves: { color: '#B45309' },
  'Gestión': { color: '#64748B' },
}


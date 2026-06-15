import { supabase } from './supabaseClient'
import type {
  Categoria,
  NuevoPedido,
  ParsedInput,
  Pedido,
  Prioridad,
} from '../types'

// ════════════════════════════════════════════════════════════════════
//  parseInput — convierte el texto libre del input en un pedido tipado
// ════════════════════════════════════════════════════════════════════

const PRIORIDAD_POR_EMOJI: Record<string, Prioridad> = {
  '🔴': 'alta',
  '🟢': 'baja',
  '🟡': 'normal',
}

/** Palabras clave por categoría (circuito de planta). */
const KEYWORDS_CATEGORIA: Record<Categoria, string[]> = {
  HPGR: ['hpgr', 'ball mill', 'molino', '034', '025'],
  Filtros: ['filtro', 'filtros', 'filter', 'prensa'],
  Magnética: ['magnética', 'magnetica', 'magnetic', 'mag', 'separador'],
  Relaves: ['relave', 'relaves', 'tailings', 'espesador', 'thickener'],
}

// Regex de persona: "Nombre: descripción". Soporta tildes y nombres
// romanizados (Shi, Wan). Limitamos el nombre para no tragarnos frases.
const RE_PERSONA = /^([A-Za-zÀ-ÿ\s]+?):\s*(.+)$/

function escaparRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function detectarCategorias(descripcion: string): Categoria[] {
  const encontradas: Categoria[] = []
  for (const [cat, keywords] of Object.entries(KEYWORDS_CATEGORIA) as [
    Categoria,
    string[],
  ][]) {
    const hit = keywords.some((kw) =>
      new RegExp(`\\b${escaparRegex(kw)}\\b`, 'i').test(descripcion),
    )
    if (hit) encontradas.push(cat)
  }
  return encontradas
}

/**
 * Parsea el texto del input a un objeto estructurado.
 * Ej: "🔴 Shi: revisar grease ball mill 034-001"
 *   → prioridad 'alta', persona 'Shi',
 *     descripción 'revisar grease ball mill 034-001', categorías ['HPGR'].
 */
export function parseInput(textoCrudo: string): ParsedInput {
  let texto = textoCrudo.trim()

  // 1) Prioridad por emoji inicial
  let prioridad: Prioridad = 'normal'
  for (const [emoji, p] of Object.entries(PRIORIDAD_POR_EMOJI)) {
    if (texto.startsWith(emoji)) {
      prioridad = p
      texto = texto.slice(emoji.length).trim()
      break
    }
  }

  // 2) Persona (texto antes de ":") + descripción
  let persona_solicita: string | null = null
  let descripcion = texto

  const m = texto.match(RE_PERSONA)
  if (m) {
    const posibleNombre = m[1].trim()
    const palabras = posibleNombre.split(/\s+/)
    // Un nombre real: pocas palabras y corto (evita tratar "revisar" como persona).
    if (palabras.length <= 4 && posibleNombre.length <= 40) {
      persona_solicita = posibleNombre
      descripcion = m[2].trim()
    }
  }

  // 3) Categorías por palabras clave
  const categorias = detectarCategorias(descripcion)

  return { persona_solicita, descripcion, prioridad, categorias }
}

/** Convierte el resultado del parseo en un pedido listo para guardar. */
export function parsedToNuevoPedido(parsed: ParsedInput): NuevoPedido {
  return {
    persona_solicita: parsed.persona_solicita,
    descripcion: parsed.descripcion,
    prioridad: parsed.prioridad,
    categorias: parsed.categorias,
    estado: 'nuevo',
    notas: null,
    reunion: null,
    fecha_vencimiento: null,
    responsable: null,
    equipo: null,
    tipo: null,
  }
}

// ════════════════════════════════════════════════════════════════════
//  Repositorio — contrato común para Supabase y modo demostración
// ════════════════════════════════════════════════════════════════════

export interface PedidosRepo {
  fetch(userId: string): Promise<Pedido[]>
  create(userId: string, nuevo: NuevoPedido): Promise<Pedido>
  update(id: string, patch: Partial<Pedido>): Promise<Pedido>
  remove(id: string): Promise<void>
  /** Suscripción realtime. Devuelve función para desuscribir. */
  subscribe(userId: string, onChange: () => void): () => void
}

// ── Implementación Supabase ──────────────────────────────────────────

const COLUMNAS =
  'id,user_id,persona_solicita,descripcion,prioridad,categorias,estado,notas,reunion,fecha_vencimiento,responsable,equipo,tipo,created_at,updated_at'

export const supabaseRepo: PedidosRepo = {
  async fetch(userId) {
    if (!supabase) return []
    const { data, error } = await supabase
      .from('pedidos')
      .select(COLUMNAS)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as Pedido[]
  },

  async create(userId, nuevo) {
    if (!supabase) throw new Error('Supabase no configurado')
    const { data, error } = await supabase
      .from('pedidos')
      .insert({ ...nuevo, user_id: userId })
      .select(COLUMNAS)
      .single()
    if (error) throw error
    return data as Pedido
  },

  async update(id, patch) {
    if (!supabase) throw new Error('Supabase no configurado')
    const { data, error } = await supabase
      .from('pedidos')
      .update(patch)
      .eq('id', id)
      .select(COLUMNAS)
      .single()
    if (error) throw error
    return data as Pedido
  },

  async remove(id) {
    if (!supabase) throw new Error('Supabase no configurado')
    const { error } = await supabase.from('pedidos').delete().eq('id', id)
    if (error) throw error
  },

  subscribe(userId, onChange) {
    const sb = supabase
    if (!sb) return () => {}
    const canal = sb
      .channel(`pedidos:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pedidos',
          filter: `user_id=eq.${userId}`,
        },
        () => onChange(),
      )
      .subscribe()
    return () => {
      sb.removeChannel(canal)
    }
  },
}

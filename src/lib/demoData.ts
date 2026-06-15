import type { NuevoPedido, Pedido } from '../types'
import type { PedidosRepo } from '../services/pedidosService'

// ════════════════════════════════════════════════════════════════════
//  Modo demostración — repositorio en memoria + localStorage.
//  Permite ver la app completa (CRUD, filtros, stats, export) sin
//  configurar Supabase. NO sincroniza entre dispositivos.
// ════════════════════════════════════════════════════════════════════

const CLAVE = 'agenda_demo_pedidos'
const USER_DEMO = 'demo-user'

function id(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return 'demo-' + Math.random().toString(36).slice(2, 11)
}

/** ISO de una fecha relativa a ahora (para sembrar histórico/tendencia). */
function hace(dias: number, horas = 0): string {
  const t = Date.now() - dias * 86_400_000 - horas * 3_600_000
  return new Date(t).toISOString()
}

function semilla(): Pedido[] {
  const base: Array<Omit<Pedido, 'id' | 'user_id' | 'updated_at'>> = [
    {
      persona_solicita: 'Shi',
      descripcion: 'revisar grease ball mill 034-001, ruido en piñón',
      prioridad: 'alta',
      categorias: ['HPGR'],
      estado: 'en_progreso',
      notas: 'Coordinar parada con operaciones',
      reunion: 'Reunión diaria 06:00',
      created_at: hace(0, 2),
    },
    {
      persona_solicita: 'Wan',
      descripcion: 'cambio de telas filtro prensa FP-02',
      prioridad: 'alta',
      categorias: ['Filtros'],
      estado: 'nuevo',
      notas: null,
      reunion: 'Reunión diaria 06:00',
      created_at: hace(0, 4),
    },
    {
      persona_solicita: 'Quispe',
      descripcion: 'inspección separador magnético, vibración alta',
      prioridad: 'normal',
      categorias: ['Magnética'],
      estado: 'nuevo',
      notas: null,
      reunion: 'Comité semanal',
      created_at: hace(1, 3),
    },
    {
      persona_solicita: 'Mendoza',
      descripcion: 'fuga en espesador de relaves, sello de eje',
      prioridad: 'alta',
      categorias: ['Relaves'],
      estado: 'en_progreso',
      notas: 'Repuesto solicitado a almacén',
      reunion: 'Comité semanal',
      created_at: hace(2, 1),
    },
    {
      persona_solicita: 'Shi',
      descripcion: 'alinear motor molino 025, lectura láser',
      prioridad: 'normal',
      categorias: ['HPGR'],
      estado: 'completado',
      notas: 'Alineamiento dentro de tolerancia',
      reunion: null,
      created_at: hace(3, 5),
    },
    {
      persona_solicita: 'Rojas',
      descripcion: 'lubricación rodamientos faja transportadora',
      prioridad: 'baja',
      categorias: [],
      estado: 'completado',
      notas: null,
      reunion: 'Reunión diaria 06:00',
      created_at: hace(3, 8),
    },
    {
      persona_solicita: 'Wan',
      descripcion: 'limpieza de tailings en línea de bombeo, thickener',
      prioridad: 'normal',
      categorias: ['Relaves'],
      estado: 'nuevo',
      notas: null,
      reunion: null,
      created_at: hace(4, 2),
    },
    {
      persona_solicita: 'Garibay',
      descripcion: 'programar overhaul HPGR para parada de planta',
      prioridad: 'alta',
      categorias: ['HPGR'],
      estado: 'en_progreso',
      notas: 'Definir alcance con contratista',
      reunion: 'Comité semanal',
      created_at: hace(5, 1),
    },
    {
      persona_solicita: 'Quispe',
      descripcion: 'revisar bobina separador magnético mag-3',
      prioridad: 'normal',
      categorias: ['Magnética'],
      estado: 'completado',
      notas: 'OK tras reemplazo de fusible',
      reunion: null,
      created_at: hace(6, 4),
    },
    {
      persona_solicita: 'Mendoza',
      descripcion: 'cambio de aceite reductor filtro prensa FP-01',
      prioridad: 'baja',
      categorias: ['Filtros'],
      estado: 'completado',
      notas: null,
      reunion: 'Reunión diaria 06:00',
      created_at: hace(7, 3),
    },
    {
      persona_solicita: null,
      descripcion: 'pedir EPP para cuadrilla de relaves',
      prioridad: 'baja',
      categorias: ['Relaves'],
      estado: 'nuevo',
      notas: null,
      reunion: null,
      created_at: hace(8, 6),
    },
    {
      persona_solicita: 'Shi',
      descripcion: 'termografía a tablero eléctrico ball mill',
      prioridad: 'normal',
      categorias: ['HPGR'],
      estado: 'completado',
      notas: 'Sin puntos calientes',
      reunion: 'Comité semanal',
      created_at: hace(10, 2),
    },
  ]

  return base.map((b) => ({
    ...b,
    id: id(),
    user_id: USER_DEMO,
    updated_at: b.created_at,
  }))
}

function leer(): Pedido[] {
  try {
    const raw = localStorage.getItem(CLAVE)
    if (raw) return JSON.parse(raw) as Pedido[]
  } catch {
    /* ignora JSON corrupto */
  }
  const inicial = semilla()
  guardar(inicial)
  return inicial
}

function guardar(pedidos: Pedido[]): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(pedidos))
  } catch {
    /* almacenamiento lleno o no disponible */
  }
}

export const demoRepo: PedidosRepo = {
  async fetch() {
    return leer().sort((a, b) => b.created_at.localeCompare(a.created_at))
  },

  async create(userId, nuevo: NuevoPedido) {
    const ahora = new Date().toISOString()
    const pedido: Pedido = {
      ...nuevo,
      id: id(),
      user_id: userId || USER_DEMO,
      created_at: ahora,
      updated_at: ahora,
    }
    const todos = [pedido, ...leer()]
    guardar(todos)
    return pedido
  },

  async update(idPedido, patch) {
    const todos = leer()
    const i = todos.findIndex((p) => p.id === idPedido)
    if (i === -1) throw new Error('Pedido no encontrado (demo)')
    todos[i] = { ...todos[i], ...patch, updated_at: new Date().toISOString() }
    guardar(todos)
    return todos[i]
  },

  async remove(idPedido) {
    guardar(leer().filter((p) => p.id !== idPedido))
  },

  subscribe() {
    // Sin realtime en demo. Devuelve no-op.
    return () => {}
  },
}

/** Reinicia los datos de demostración a la semilla original. */
export function reiniciarDemo(): void {
  guardar(semilla())
}

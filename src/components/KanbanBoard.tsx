import { ChevronLeft, ChevronRight, Trash2, Clock, Wrench } from 'lucide-react'
import {
  ESTADO_META,
  ESTADOS,
  PRIORIDAD_META,
  type Estado,
  type Pedido,
} from '../types'
import { CategoriaChip } from './ui/Badges'
import { formatFecha } from '../services/exportService'

interface KanbanBoardProps {
  pedidos: Pedido[]
  onCambiarEstado: (id: string, estado: Estado) => void
  onEliminar: (id: string) => void
}

function Tarjeta({
  p,
  onCambiarEstado,
  onEliminar,
}: {
  p: Pedido
  onCambiarEstado: (id: string, estado: Estado) => void
  onEliminar: (id: string) => void
}) {
  const meta = ESTADO_META[p.estado]
  const prio = PRIORIDAD_META[p.prioridad]
  return (
    <article
      className="tarjeta tarjeta-hover animate-fade-in-up p-3"
      style={{ borderLeft: `4px solid ${prio.color}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="chip" style={{ backgroundColor: `${prio.color}1F`, color: prio.color }}>
          {prio.emoji} {prio.label}
        </span>
        <button
          onClick={() => onEliminar(p.id)}
          className="rounded p-1 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500"
          title="Eliminar"
          aria-label="Eliminar pedido"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <p className="mt-2 text-sm font-medium leading-snug text-slate-800">
        {p.descripcion}
      </p>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {p.persona_solicita && (
          <span className="chip bg-slate-100 text-slate-600">👤 {p.persona_solicita}</span>
        )}
        {p.tipo && (
          <span className="chip bg-slate-100 text-slate-600">
            <Wrench size={11} />
            {p.tipo}
          </span>
        )}
        {p.categorias.map((c) => (
          <CategoriaChip key={c} categoria={c} />
        ))}
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
          <Clock size={11} />
          {formatFecha(p.created_at)}
        </span>
        <div className="flex items-center gap-1">
          {meta.previo && (
            <button
              onClick={() => onCambiarEstado(p.id, meta.previo!)}
              className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              title={`Regresar a ${ESTADO_META[meta.previo].label}`}
              aria-label="Regresar estado"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          {meta.siguiente && (
            <button
              onClick={() => onCambiarEstado(p.id, meta.siguiente!)}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-semibold transition-colors"
              style={{ color: ESTADO_META[meta.siguiente].color }}
              title={`Avanzar a ${ESTADO_META[meta.siguiente].label}`}
            >
              {ESTADO_META[meta.siguiente].label}
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

export function KanbanBoard({
  pedidos,
  onCambiarEstado,
  onEliminar,
}: KanbanBoardProps) {
  const columnas = ESTADOS.map((estado) => ({
    estado,
    items: pedidos
      .filter((p) => p.estado === estado)
      .sort(
        (a, b) =>
          PRIORIDAD_META[a.prioridad].rank - PRIORIDAD_META[b.prioridad].rank ||
          b.created_at.localeCompare(a.created_at),
      ),
  }))

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {columnas.map(({ estado, items }) => {
        const meta = ESTADO_META[estado]
        return (
          <div key={estado} className="flex flex-col">
            <div
              className="mb-3 flex items-center justify-between rounded-input px-3 py-2"
              style={{ backgroundColor: `${meta.color}14` }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: meta.color }}
                />
                <h3 className="text-sm font-bold" style={{ color: meta.color }}>
                  {meta.label}
                </h3>
              </div>
              <span
                className="rounded-full px-2 py-0.5 text-xs font-bold"
                style={{ backgroundColor: `${meta.color}24`, color: meta.color }}
              >
                {items.length}
              </span>
            </div>

            <div className="flex-1 space-y-3">
              {items.length === 0 ? (
                <div className="rounded-card border-2 border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                  Sin pedidos
                </div>
              ) : (
                items.map((p) => (
                  <Tarjeta
                    key={p.id}
                    p={p}
                    onCambiarEstado={onCambiarEstado}
                    onEliminar={onEliminar}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

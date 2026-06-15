import { useState } from 'react'
import {
  ChevronRight,
  Trash2,
  Pencil,
  Check,
  X,
  StickyNote,
  Wrench,
} from 'lucide-react'
import { ESTADO_META, PRIORIDAD_META, type Estado, type Pedido } from '../types'
import { CategoriaChip, EstadoBadge, PrioridadBadge } from './ui/Badges'
import { formatFecha } from '../services/exportService'

interface PedidosTableProps {
  pedidos: Pedido[]
  onCambiarEstado: (id: string, estado: Estado) => void
  onActualizar: (id: string, patch: Partial<Pedido>) => void
  onEliminar: (id: string) => void
}

/** Meta: tipo de gestión (si está presente). */
function MetaPedido({ pedido }: { pedido: Pedido }) {
  if (!pedido.tipo) return null
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
      <Wrench size={11} />
      {pedido.tipo}
    </span>
  )
}

/** Botón para avanzar al siguiente estado del flujo. */
function AvanzarEstado({
  pedido,
  onCambiarEstado,
}: {
  pedido: Pedido
  onCambiarEstado: (id: string, estado: Estado) => void
}) {
  const sig = ESTADO_META[pedido.estado].siguiente
  if (!sig) return null
  return (
    <button
      onClick={() => onCambiarEstado(pedido.id, sig)}
      className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-1 text-xs font-semibold transition-colors hover:bg-slate-100"
      style={{ color: ESTADO_META[sig].color }}
      title={`Avanzar a ${ESTADO_META[sig].label}`}
    >
      {ESTADO_META[sig].label}
      <ChevronRight size={14} />
    </button>
  )
}

/** Edición inline de la nota. */
function NotaEditable({
  pedido,
  onActualizar,
}: {
  pedido: Pedido
  onActualizar: (id: string, patch: Partial<Pedido>) => void
}) {
  const [editando, setEditando] = useState(false)
  const [draft, setDraft] = useState(pedido.notas ?? '')

  function guardar() {
    onActualizar(pedido.id, { notas: draft.trim() || null })
    setEditando(false)
  }

  if (editando) {
    return (
      <div className="flex items-start gap-1">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          autoFocus
          className="input-base min-w-[10rem] resize-y py-1.5 text-sm"
          placeholder="Escribe una nota…"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) guardar()
            if (e.key === 'Escape') setEditando(false)
          }}
        />
        <button
          onClick={guardar}
          className="rounded p-1 text-green-600 hover:bg-green-50"
          title="Guardar (⌘⏎)"
        >
          <Check size={15} />
        </button>
        <button
          onClick={() => setEditando(false)}
          className="rounded p-1 text-slate-400 hover:bg-slate-100"
          title="Cancelar (Esc)"
        >
          <X size={15} />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => {
        setDraft(pedido.notas ?? '')
        setEditando(true)
      }}
      className="group flex max-w-[14rem] items-start gap-1.5 text-left text-sm text-slate-600 hover:text-alianza-blue"
      title="Editar nota"
    >
      {pedido.notas ? (
        <span className="line-clamp-2">{pedido.notas}</span>
      ) : (
        <span className="inline-flex items-center gap-1 italic text-slate-400 group-hover:text-alianza-blue">
          <StickyNote size={13} /> añadir nota
        </span>
      )}
      <Pencil
        size={12}
        className="mt-0.5 shrink-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100"
      />
    </button>
  )
}

export function PedidosTable({
  pedidos,
  onCambiarEstado,
  onActualizar,
  onEliminar,
}: PedidosTableProps) {
  return (
    <>
      {/* ── Tabla (escritorio) ── */}
      <div className="hidden overflow-hidden rounded-section border border-slate-200/80 bg-white shadow-n2 md:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-semibold">Prioridad</th>
                <th className="px-4 py-3 font-semibold">Descripción</th>
                <th className="px-4 py-3 font-semibold">Solicita</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Creado</th>
                <th className="px-4 py-3 font-semibold">Notas</th>
                <th className="px-4 py-3 text-right font-semibold">·</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-slate-100 align-top transition-colors last:border-0 hover:bg-alianza-celeste-soft/40"
                >
                  <td className="px-4 py-3">
                    <PrioridadBadge prioridad={p.prioridad} />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{p.descripcion}</p>
                    {(p.categorias.length > 0 || p.tipo) && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <MetaPedido pedido={p} />
                        {p.categorias.map((c) => (
                          <CategoriaChip key={c} categoria={c} />
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {p.persona_solicita ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-1">
                      <EstadoBadge estado={p.estado} />
                      <AvanzarEstado pedido={p} onCambiarEstado={onCambiarEstado} />
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                    {formatFecha(p.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <NotaEditable pedido={p} onActualizar={onActualizar} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onEliminar(p.id)}
                      className="rounded-md p-1.5 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500"
                      title="Eliminar pedido"
                      aria-label="Eliminar pedido"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Tarjetas (móvil) ── */}
      <div className="space-y-3 md:hidden">
        {pedidos.map((p) => (
          <article
            key={p.id}
            className="tarjeta animate-fade-in-up p-4"
            style={{ borderLeft: `4px solid ${PRIORIDAD_META[p.prioridad].color}` }}
          >
            <div className="flex items-start justify-between gap-2">
              <PrioridadBadge prioridad={p.prioridad} />
              <button
                onClick={() => onEliminar(p.id)}
                className="rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-500"
                aria-label="Eliminar pedido"
              >
                <Trash2 size={15} />
              </button>
            </div>
            <p className="mt-2 font-medium text-slate-800">{p.descripcion}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              {p.persona_solicita && (
                <span className="chip bg-slate-100 text-slate-600">
                  👤 {p.persona_solicita}
                </span>
              )}
              {p.categorias.map((c) => (
                <CategoriaChip key={c} categoria={c} />
              ))}
              <MetaPedido pedido={p} />
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
              <div className="flex items-center gap-2">
                <EstadoBadge estado={p.estado} />
                <AvanzarEstado pedido={p} onCambiarEstado={onCambiarEstado} />
              </div>
              <span className="text-[11px] text-slate-400">{formatFecha(p.created_at)}</span>
            </div>
            <div className="mt-2">
              <NotaEditable pedido={p} onActualizar={onActualizar} />
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

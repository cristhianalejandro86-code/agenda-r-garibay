import {
  CATEGORIA_META,
  ESTADO_META,
  PRIORIDAD_META,
  type Categoria,
  type Estado,
  type Prioridad,
} from '../../types'
import { tinte } from '../../lib/color'

export function PrioridadBadge({ prioridad }: { prioridad: Prioridad }) {
  const m = PRIORIDAD_META[prioridad]
  return (
    <span
      className="chip"
      style={{ backgroundColor: tinte(m.color, 0.12), color: m.color }}
    >
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: m.color }}
        aria-hidden
      />
      {m.label}
    </span>
  )
}

export function EstadoBadge({ estado }: { estado: Estado }) {
  const m = ESTADO_META[estado]
  return (
    <span
      className="chip"
      style={{ backgroundColor: tinte(m.color, 0.14), color: m.color }}
    >
      {m.label}
    </span>
  )
}

export function CategoriaChip({ categoria }: { categoria: string }) {
  const meta = CATEGORIA_META[categoria as Categoria]
  const color = meta?.color ?? '#64748B'
  return (
    <span
      className="chip"
      style={{
        backgroundColor: tinte(color, 0.1),
        color,
        boxShadow: `inset 0 0 0 1px ${tinte(color, 0.25)}`,
      }}
    >
      {categoria}
    </span>
  )
}

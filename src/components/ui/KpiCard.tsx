import type { LucideIcon } from 'lucide-react'
import { tinte } from '../../lib/color'

interface KpiCardProps {
  icono: LucideIcon
  etiqueta: string
  valor: string | number
  color: string
  subtitulo?: string
  /** Barra de progreso 0–100 opcional (ej. % de avance). */
  progreso?: number
}

export function KpiCard({
  icono: Icono,
  etiqueta,
  valor,
  color,
  subtitulo,
  progreso,
}: KpiCardProps) {
  return (
    <div className="tarjeta group relative overflow-hidden p-4 transition-transform duration-300 ease-suave hover:-translate-y-0.5 hover:shadow-n3 sm:p-5">
      {/* Acento lateral */}
      <span
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-3 pl-1.5">
        <div className="min-w-0">
          <p className="etiqueta truncate">{etiqueta}</p>
          <p className="mt-1 text-3xl font-extrabold leading-none tracking-tight text-slate-900">
            {valor}
          </p>
          {subtitulo && (
            <p className="mt-1.5 text-xs font-medium text-slate-500">{subtitulo}</p>
          )}
        </div>
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-btn"
          style={{ backgroundColor: tinte(color, 0.12), color }}
        >
          <Icono size={22} strokeWidth={2.2} />
        </span>
      </div>

      {typeof progreso === 'number' && (
        <div className="mt-4 pl-1.5">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all duration-700 ease-suave"
              style={{
                width: `${Math.max(0, Math.min(100, progreso))}%`,
                backgroundColor: color,
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

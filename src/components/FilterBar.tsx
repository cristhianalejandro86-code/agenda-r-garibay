import { Search, X, SlidersHorizontal } from 'lucide-react'
import {
  CATEGORIAS,
  ESTADO_META,
  ESTADOS,
  FILTROS_VACIOS,
  PRIORIDAD_META,
  PRIORIDADES,
  type FilterState,
} from '../types'

interface FilterBarProps {
  filtros: FilterState
  setFiltros: (f: FilterState) => void
  personas: string[]
  totalFiltrado: number
  total: number
}

export function FilterBar({
  filtros,
  setFiltros,
  personas,
  totalFiltrado,
  total,
}: FilterBarProps) {
  const set = <K extends keyof FilterState>(k: K, v: FilterState[K]) =>
    setFiltros({ ...filtros, [k]: v })

  const activos: Array<{ k: keyof FilterState; etiqueta: string }> = []
  if (filtros.texto) activos.push({ k: 'texto', etiqueta: `"${filtros.texto}"` })
  if (filtros.persona) activos.push({ k: 'persona', etiqueta: filtros.persona })
  if (filtros.prioridad)
    activos.push({ k: 'prioridad', etiqueta: PRIORIDAD_META[filtros.prioridad].label })
  if (filtros.estado)
    activos.push({ k: 'estado', etiqueta: ESTADO_META[filtros.estado].label })
  if (filtros.categoria) activos.push({ k: 'categoria', etiqueta: filtros.categoria })

  const hayFiltros = activos.length > 0

  const selectClase =
    'input-base h-10 cursor-pointer py-0 text-sm appearance-none bg-[length:1rem] bg-[right_0.6rem_center] bg-no-repeat pr-8'
  const flecha = {
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
  }

  return (
    <section className="seccion p-3 sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        {/* Búsqueda */}
        <div className="relative flex-1">
          <Search
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={filtros.texto}
            onChange={(e) => set('texto', e.target.value)}
            placeholder="Buscar por texto, persona, nota…"
            className="input-base h-10 pl-10"
            aria-label="Buscar"
          />
        </div>

        {/* Selects */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <select
            value={filtros.persona}
            onChange={(e) => set('persona', e.target.value)}
            className={selectClase}
            style={flecha}
            aria-label="Filtrar por persona"
          >
            <option value="">Persona</option>
            {personas.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <select
            value={filtros.prioridad}
            onChange={(e) => set('prioridad', e.target.value as FilterState['prioridad'])}
            className={selectClase}
            style={flecha}
            aria-label="Filtrar por prioridad"
          >
            <option value="">Prioridad</option>
            {PRIORIDADES.map((p) => (
              <option key={p} value={p}>
                {PRIORIDAD_META[p].label}
              </option>
            ))}
          </select>

          <select
            value={filtros.estado}
            onChange={(e) => set('estado', e.target.value as FilterState['estado'])}
            className={selectClase}
            style={flecha}
            aria-label="Filtrar por estado"
          >
            <option value="">Estado</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {ESTADO_META[e].label}
              </option>
            ))}
          </select>

          <select
            value={filtros.categoria}
            onChange={(e) => set('categoria', e.target.value as FilterState['categoria'])}
            className={selectClase}
            style={flecha}
            aria-label="Filtrar por categoría"
          >
            <option value="">Categoría</option>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Badges de filtros activos + contador */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <SlidersHorizontal size={14} />
          {totalFiltrado === total
            ? `${total} pedido(s)`
            : `${totalFiltrado} de ${total}`}
        </span>

        {activos.map(({ k, etiqueta }) => (
          <button
            key={k}
            onClick={() => set(k, '' as FilterState[typeof k])}
            className="chip bg-alianza-celeste-soft text-alianza-blue hover:bg-alianza-celeste/30"
            title="Quitar filtro"
          >
            {etiqueta}
            <X size={12} />
          </button>
        ))}

        {hayFiltros && (
          <button
            onClick={() => setFiltros(FILTROS_VACIOS)}
            className="ml-auto text-xs font-semibold text-slate-500 underline-offset-2 hover:text-alianza-blue hover:underline"
          >
            Limpiar todo
          </button>
        )}
      </div>
    </section>
  )
}

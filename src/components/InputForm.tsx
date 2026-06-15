import { useMemo, useRef, useState } from 'react'
import {
  Plus,
  Sparkles,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  SlidersHorizontal,
  User,
  Wrench,
  Tag,
  Users,
  StickyNote,
} from 'lucide-react'
import { parseInput } from '../services/pedidosService'
import { CategoriaChip } from './ui/Badges'
import { hoyISO } from '../lib/fechas'
import {
  CATEGORIAS,
  PRIORIDADES,
  PRIORIDAD_META,
  TIPOS,
  type Categoria,
  type NuevoPedido,
  type Prioridad,
  type TipoPedido,
} from '../types'

interface InputFormProps {
  onAgregar: (nuevo: NuevoPedido) => Promise<void>
  /** Personas conocidas (para autocompletar Solicita y Responsable). */
  personas: string[]
}

function isoEnDias(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  const p = (x: number) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function InputForm({ onAgregar, personas }: InputFormProps) {
  const [descripcion, setDescripcion] = useState('')
  const [prioridad, setPrioridad] = useState<Prioridad>('normal')
  const [persona, setPersona] = useState('')
  const [vence, setVence] = useState('') // '' = sin fecha
  const [responsable, setResponsable] = useState('')
  const [equipo, setEquipo] = useState('')
  const [tipo, setTipo] = useState<TipoPedido | ''>('')
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [reunion, setReunion] = useState('')
  const [notas, setNotas] = useState('')

  // El usuario puede sobrescribir lo que detecta el parseo; respetamos su elección.
  const [tocado, setTocado] = useState({ prioridad: false, persona: false, categorias: false })
  const [detalles, setDetalles] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [ok, setOk] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const preview = useMemo(() => (descripcion.trim() ? parseInput(descripcion) : null), [descripcion])

  function onDescripcion(v: string) {
    setDescripcion(v)
    const p = parseInput(v)
    if (!tocado.prioridad) setPrioridad(p.prioridad)
    if (!tocado.persona && p.persona_solicita) setPersona(p.persona_solicita)
    if (!tocado.categorias && p.categorias.length) setCategorias(p.categorias)
  }

  function toggleCategoria(c: Categoria) {
    setTocado((t) => ({ ...t, categorias: true }))
    setCategorias((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))
  }

  async function enviar() {
    const limpio = descripcion.trim()
    if (!limpio || enviando) return
    setEnviando(true)
    try {
      await onAgregar({
        descripcion: limpio,
        prioridad,
        persona_solicita: persona.trim() || null,
        categorias,
        estado: 'nuevo',
        notas: notas.trim() || null,
        reunion: reunion.trim() || null,
        fecha_vencimiento: vence || null,
        responsable: responsable.trim() || null,
        equipo: equipo.trim() || null,
        tipo: tipo || null,
      })
      // Reset, conservando contexto de la reunión (persona/responsable/reunión)
      setDescripcion('')
      setPrioridad('normal')
      setCategorias([])
      setVence('')
      setEquipo('')
      setTipo('')
      setNotas('')
      setTocado({ prioridad: false, persona: false, categorias: false })
      setOk(`Pedido agregado${persona ? ` · ${persona}` : ''}`)
      window.setTimeout(() => setOk(null), 2600)
      inputRef.current?.focus()
    } finally {
      setEnviando(false)
    }
  }

  const presetVence: [string, string | null][] = [
    ['Hoy', hoyISO()],
    ['+3d', isoEnDias(3)],
    ['+1 sem', isoEnDias(7)],
    ['Sin fecha', null],
  ]

  return (
    <section className="seccion overflow-hidden">
      <div className="bg-gradient-alianza px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2 text-white">
          <Sparkles size={18} className="text-alianza-celeste" />
          <h2 className="text-sm font-bold tracking-tight sm:text-base">Captura rápida de pedido</h2>
        </div>
        <p className="mt-0.5 text-xs text-alianza-celeste">
          Ej: <span className="font-mono">🔴 Shi: revisar grease ball mill 034-001</span>
        </p>
      </div>

      <div className="p-4 sm:p-5">
        {/* Descripción + Agregar */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              value={descripcion}
              onChange={(e) => onDescripcion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void enviar()
                }
              }}
              placeholder="¿Qué hay que hacer? Escribe y presiona Enter…"
              className="input-base h-12 pr-12 text-base"
              aria-label="Descripción del pedido"
              autoComplete="off"
              enterKeyHint="send"
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:block">
              ⌘⏎
            </kbd>
          </div>
          <button onClick={() => void enviar()} disabled={!descripcion.trim() || enviando} className="btn-primario h-12 px-6">
            <Plus size={18} />
            {enviando ? 'Agregando…' : 'Agregar'}
          </button>
        </div>

        {/* Detectado (preview no intrusivo) */}
        {preview && (preview.persona_solicita || preview.categorias.length > 0) && (
          <p className="mt-2 text-xs text-slate-400">
            Detectado del texto: {preview.persona_solicita ? `👤 ${preview.persona_solicita}  ` : ''}
            {preview.categorias.join(', ')} — ajusta abajo si hace falta.
          </p>
        )}

        {/* Rápidos siempre visibles: prioridad · solicita · vence */}
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {/* Prioridad */}
          <div>
            <span className="etiqueta">Prioridad</span>
            <div className="mt-1.5 flex gap-1.5">
              {PRIORIDADES.map((p) => {
                const m = PRIORIDAD_META[p]
                const activo = prioridad === p
                return (
                  <button
                    key={p}
                    onClick={() => {
                      setPrioridad(p)
                      setTocado((t) => ({ ...t, prioridad: true }))
                    }}
                    className="flex-1 rounded-btn border px-2 py-2 text-sm font-semibold transition-all"
                    style={
                      activo
                        ? { backgroundColor: m.color, borderColor: m.color, color: '#fff' }
                        : { borderColor: '#e2e8f0', color: '#64748b' }
                    }
                    aria-pressed={activo}
                  >
                    {m.emoji} {m.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Solicita */}
          <div>
            <span className="etiqueta">Solicita</span>
            <div className="relative mt-1.5">
              <User size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={persona}
                onChange={(e) => {
                  setPersona(e.target.value)
                  setTocado((t) => ({ ...t, persona: true }))
                }}
                list="lista-personas"
                placeholder="¿Quién lo pide?"
                className="input-base h-10 pl-9"
                aria-label="Quién solicita"
              />
            </div>
          </div>

          {/* Vence */}
          <div>
            <span className="etiqueta">Vence</span>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {presetVence.map(([label, val]) => {
                const activo = (val ?? '') === vence
                return (
                  <button
                    key={label}
                    onClick={() => setVence(val ?? '')}
                    className={
                      'rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ' +
                      (activo
                        ? 'bg-alianza-blue text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200')
                    }
                  >
                    {label}
                  </button>
                )
              })}
              <div className="relative">
                <CalendarClock size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={vence}
                  onChange={(e) => setVence(e.target.value)}
                  className="input-base h-9 w-[9.5rem] pl-8 text-sm"
                  aria-label="Fecha de vencimiento"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Más detalles */}
        <button
          onClick={() => setDetalles((v) => !v)}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-alianza-blue hover:underline"
          aria-expanded={detalles}
        >
          <SlidersHorizontal size={15} />
          Más detalles
          <ChevronDown size={15} className={`transition-transform ${detalles ? 'rotate-180' : ''}`} />
        </button>

        {detalles && (
          <div className="mt-3 grid gap-4 rounded-input border border-dashed border-slate-200 bg-slate-50/60 p-3.5 animate-fade-in-up md:grid-cols-2">
            {/* Responsable */}
            <div>
              <span className="etiqueta">Responsable (ejecuta)</span>
              <div className="relative mt-1.5">
                <Users size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={responsable}
                  onChange={(e) => setResponsable(e.target.value)}
                  list="lista-personas"
                  placeholder="¿A quién se asigna?"
                  className="input-base h-10 pl-9"
                  aria-label="Responsable"
                />
              </div>
            </div>

            {/* Equipo */}
            <div>
              <span className="etiqueta">Equipo / TAG</span>
              <div className="relative mt-1.5">
                <Tag size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={equipo}
                  onChange={(e) => setEquipo(e.target.value)}
                  placeholder="Ej. 034-001, FP-02"
                  className="input-base h-10 pl-9"
                  aria-label="Equipo o TAG"
                />
              </div>
            </div>

            {/* Tipo */}
            <div>
              <span className="etiqueta">Tipo</span>
              <div className="relative mt-1.5">
                <Wrench size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as TipoPedido | '')}
                  className="input-base h-10 cursor-pointer pl-9"
                  aria-label="Tipo de mantenimiento"
                >
                  <option value="">Tipo de mantenimiento…</option>
                  {TIPOS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reunión */}
            <div>
              <span className="etiqueta">Reunión</span>
              <div className="relative mt-1.5">
                <CalendarClock size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={reunion}
                  onChange={(e) => setReunion(e.target.value)}
                  placeholder="Ej. Reunión diaria 06:00"
                  className="input-base h-10 pl-9"
                  aria-label="Reunión"
                />
              </div>
            </div>

            {/* Categorías */}
            <div className="md:col-span-2">
              <span className="etiqueta">Circuito / categoría</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {CATEGORIAS.map((c) => {
                  const activo = categorias.includes(c)
                  return (
                    <button
                      key={c}
                      onClick={() => toggleCategoria(c)}
                      className={
                        'rounded-full px-3 py-1.5 text-xs font-semibold transition-all ' +
                        (activo
                          ? 'bg-alianza-blue text-white'
                          : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:ring-alianza-celeste')
                      }
                      aria-pressed={activo}
                    >
                      {c}
                    </button>
                  )
                })}
                {categorias.length > 0 && (
                  <span className="ml-1 flex items-center gap-1">
                    {categorias.map((c) => (
                      <CategoriaChip key={c} categoria={c} />
                    ))}
                  </span>
                )}
              </div>
            </div>

            {/* Notas */}
            <div className="md:col-span-2">
              <span className="etiqueta">Notas</span>
              <div className="relative mt-1.5">
                <StickyNote size={15} className="pointer-events-none absolute left-3 top-3 text-slate-400" />
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows={2}
                  placeholder="Contexto, acuerdos, repuestos necesarios…"
                  className="input-base resize-y py-2 pl-9"
                  aria-label="Notas"
                />
              </div>
            </div>
          </div>
        )}

        {ok && (
          <div className="mt-3 flex items-center gap-2 rounded-input bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 animate-fade-in-up">
            <CheckCircle2 size={16} />
            {ok}
          </div>
        )}
      </div>

      {/* Datalist compartido para Solicita y Responsable */}
      <datalist id="lista-personas">
        {personas.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
    </section>
  )
}

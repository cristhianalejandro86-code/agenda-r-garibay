import { useMemo, useRef, useState } from 'react'
import {
  Plus,
  Sparkles,
  CheckCircle2,
  User,
  Wrench,
  StickyNote,
  AlertCircle,
} from 'lucide-react'
import { parseInput } from '../services/pedidosService'
import { CategoriaChip } from './ui/Badges'
import {
  CATEGORIAS,
  PRIORIDADES,
  PRIORIDAD_META,
  type Categoria,
  type NuevoPedido,
  type Prioridad,
} from '../types'

interface InputFormProps {
  onAgregar: (nuevo: NuevoPedido) => Promise<void>
  /** Personas conocidas (para autocompletar Solicita). */
  personas: string[]
}

export function InputForm({ onAgregar, personas }: InputFormProps) {
  const [descripcion, setDescripcion] = useState('')
  const [prioridad, setPrioridad] = useState<Prioridad>('normal')
  const [persona, setPersona] = useState('')
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [tipoGestion, setTipoGestion] = useState('')
  const [notas, setNotas] = useState('')

  // El parseo pre-llena, pero si el usuario edita un campo, manda su elección.
  const [tocado, setTocado] = useState({ prioridad: false, persona: false, categorias: false })
  const [enviando, setEnviando] = useState(false)
  const [ok, setOk] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const preview = useMemo(() => (descripcion.trim() ? parseInput(descripcion) : null), [descripcion])

  // Todo es obligatorio para poder agregar.
  const faltan: string[] = []
  if (!descripcion.trim()) faltan.push('descripción')
  if (!persona.trim()) faltan.push('solicita')
  if (categorias.length === 0) faltan.push('categoría')
  if (!tipoGestion.trim()) faltan.push('tipo de gestión')
  const completo = faltan.length === 0

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
    if (!completo || enviando) return
    setEnviando(true)
    try {
      await onAgregar({
        descripcion: descripcion.trim(),
        prioridad,
        persona_solicita: persona.trim(),
        categorias,
        estado: 'nuevo',
        notas: notas.trim() || null,
        tipo: tipoGestion.trim(),
        // Campos retirados del registro:
        reunion: null,
        fecha_vencimiento: null,
        responsable: null,
        equipo: null,
      })
      setDescripcion('')
      setPrioridad('normal')
      setPersona('')
      setCategorias([])
      setTipoGestion('')
      setNotas('')
      setTocado({ prioridad: false, persona: false, categorias: false })
      setOk('Pedido agregado')
      window.setTimeout(() => setOk(null), 2600)
      inputRef.current?.focus()
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="seccion overflow-hidden">
      <div className="relative overflow-hidden bg-gradient-alianza px-4 py-3 sm:px-5">
        <span className="rayas" />
        <div className="relative">
          <div className="flex items-center gap-2 text-white">
            <Sparkles size={18} className="text-alianza-celeste" />
            <h2 className="text-sm font-bold tracking-tight sm:text-base">Registrar pedido</h2>
          </div>
          <p className="mt-0.5 text-xs text-alianza-celeste">
            Completa todos los campos. Ej:{' '}
            <span className="font-mono">🔴 Shi: revisar grease ball mill 034-001</span>
          </p>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        {/* Descripción */}
        <div>
          <span className="etiqueta">Descripción *</span>
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
            placeholder="¿Qué hay que hacer?"
            className="input-base mt-1.5 h-12 text-base"
            aria-label="Descripción del pedido"
            autoComplete="off"
          />
          {preview && (preview.persona_solicita || preview.categorias.length > 0) && (
            <p className="mt-1 text-xs text-slate-400">
              Detectado del texto:{' '}
              {preview.persona_solicita ? `👤 ${preview.persona_solicita}  ` : ''}
              {preview.categorias.join(', ')} — ajusta abajo si hace falta.
            </p>
          )}
        </div>

        {/* Prioridad · Solicita · Tipo de gestión */}
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <span className="etiqueta">Prioridad *</span>
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

          <div>
            <span className="etiqueta">Solicita *</span>
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

          <div>
            <span className="etiqueta">Tipo de gestión *</span>
            <div className="relative mt-1.5">
              <Wrench size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={tipoGestion}
                onChange={(e) => setTipoGestion(e.target.value)}
                placeholder="Ej. compra de repuesto, coordinación…"
                className="input-base h-10 pl-9"
                aria-label="Tipo de gestión"
              />
            </div>
          </div>
        </div>

        {/* Categoría */}
        <div>
          <span className="etiqueta">Circuito / categoría *</span>
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
        <div>
          <span className="etiqueta">Notas (opcional)</span>
          <div className="relative mt-1.5">
            <StickyNote size={15} className="pointer-events-none absolute left-3 top-3 text-slate-400" />
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              placeholder="Contexto, acuerdos, detalle…"
              className="input-base resize-y py-2 pl-9"
              aria-label="Notas"
            />
          </div>
        </div>

        {/* Acción + validación */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {!completo ? (
            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600">
              <AlertCircle size={14} />
              Falta: {faltan.join(', ')}
            </p>
          ) : (
            <span className="text-xs text-slate-400">Todo listo para registrar.</span>
          )}
          <button
            onClick={() => void enviar()}
            disabled={!completo || enviando}
            className="btn-primario h-11 px-6"
          >
            <Plus size={18} />
            {enviando ? 'Agregando…' : 'Agregar pedido'}
          </button>
        </div>

        {ok && (
          <div className="flex items-center gap-2 rounded-input bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 animate-fade-in-up">
            <CheckCircle2 size={16} />
            {ok}
          </div>
        )}
      </div>

      <datalist id="lista-personas">
        {personas.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
    </section>
  )
}

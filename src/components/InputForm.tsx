import { useMemo, useRef, useState } from 'react'
import { Plus, Sparkles, CalendarDays, CheckCircle2 } from 'lucide-react'
import { parseInput } from '../services/pedidosService'
import { PrioridadBadge, CategoriaChip } from './ui/Badges'
import type { ParsedInput } from '../types'

interface InputFormProps {
  onCapturar: (texto: string, reunion: string | null) => Promise<ParsedInput | null>
}

export function InputForm({ onCapturar }: InputFormProps) {
  const [texto, setTexto] = useState('')
  const [reunion, setReunion] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [ok, setOk] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Previsualización en vivo del parseo
  const preview = useMemo<ParsedInput | null>(
    () => (texto.trim() ? parseInput(texto) : null),
    [texto],
  )

  async function enviar() {
    const limpio = texto.trim()
    if (!limpio || enviando) return
    setEnviando(true)
    try {
      const parsed = await onCapturar(limpio, reunion.trim() || null)
      setTexto('')
      if (parsed) {
        setOk(
          `Pedido agregado${parsed.persona_solicita ? ` · ${parsed.persona_solicita}` : ''}`,
        )
        window.setTimeout(() => setOk(null), 2600)
      }
      inputRef.current?.focus()
    } finally {
      setEnviando(false)
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // Enter envía; Ctrl/Cmd+Enter también (atajo del spec)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void enviar()
    }
  }

  return (
    <section className="seccion overflow-hidden">
      <div className="bg-gradient-alianza px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2 text-white">
          <Sparkles size={18} className="text-alianza-celeste" />
          <h2 className="text-sm font-bold tracking-tight sm:text-base">
            Captura rápida de pedido
          </h2>
        </div>
        <p className="mt-0.5 text-xs text-alianza-celeste">
          Ej: <span className="font-mono">🔴 Shi: revisar grease ball mill 034-001</span>
        </p>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Escribe el pedido y presiona Enter…"
              className="input-base h-12 pr-12 text-base"
              aria-label="Texto del pedido"
              autoComplete="off"
              enterKeyHint="send"
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:block">
              ⌘⏎
            </kbd>
          </div>
          <button
            onClick={() => void enviar()}
            disabled={!texto.trim() || enviando}
            className="btn-primario h-12 px-6"
          >
            <Plus size={18} />
            {enviando ? 'Agregando…' : 'Agregar'}
          </button>
        </div>

        {/* Campo reunión opcional */}
        <div className="mt-3 flex items-center gap-2">
          <CalendarDays size={16} className="shrink-0 text-slate-400" />
          <input
            value={reunion}
            onChange={(e) => setReunion(e.target.value)}
            placeholder="Reunión (opcional) — ej. Reunión diaria 06:00"
            className="input-base h-9 py-1.5 text-sm"
            aria-label="Reunión (opcional)"
          />
        </div>

        {/* Previsualización en vivo */}
        {preview && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-input border border-dashed border-slate-200 bg-slate-50/60 p-2.5 text-sm animate-fade-in-up">
            <span className="etiqueta">Detectado:</span>
            <PrioridadBadge prioridad={preview.prioridad} />
            {preview.persona_solicita && (
              <span className="chip bg-slate-200/70 text-slate-700">
                👤 {preview.persona_solicita}
              </span>
            )}
            {preview.categorias.map((c) => (
              <CategoriaChip key={c} categoria={c} />
            ))}
            {preview.categorias.length === 0 && (
              <span className="text-xs italic text-slate-400">sin categoría</span>
            )}
          </div>
        )}

        {/* Confirmación */}
        {ok && (
          <div className="mt-3 flex items-center gap-2 rounded-input bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 animate-fade-in-up">
            <CheckCircle2 size={16} />
            {ok}
          </div>
        )}
      </div>
    </section>
  )
}

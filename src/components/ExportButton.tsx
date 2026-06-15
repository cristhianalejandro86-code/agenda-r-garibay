import { useEffect, useRef, useState } from 'react'
import {
  Download,
  FileSpreadsheet,
  FileText,
  FileType2,
  ChevronDown,
  Loader2,
} from 'lucide-react'
import {
  exportToCSV,
  exportToExcel,
  exportToPDF,
} from '../services/exportService'
import type { ExportFormat, Pedido } from '../types'

interface ExportButtonProps {
  pedidos: Pedido[]
}

const OPCIONES: {
  formato: ExportFormat
  label: string
  icono: typeof FileText
  desc: string
}[] = [
  { formato: 'excel', label: 'Excel', icono: FileSpreadsheet, desc: '.xlsx · datos + resumen' },
  { formato: 'pdf', label: 'PDF', icono: FileText, desc: '.pdf · tabla con marca' },
  { formato: 'csv', label: 'CSV', icono: FileType2, desc: '.csv · texto plano' },
]

export function ExportButton({ pedidos }: ExportButtonProps) {
  const [abierto, setAbierto] = useState(false)
  const [confirmar, setConfirmar] = useState<ExportFormat | null>(null)
  const [exportando, setExportando] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function fuera(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false)
    }
    document.addEventListener('mousedown', fuera)
    return () => document.removeEventListener('mousedown', fuera)
  }, [])

  async function ejecutar(formato: ExportFormat) {
    setExportando(true)
    try {
      if (formato === 'excel') await exportToExcel(pedidos)
      else if (formato === 'pdf') await exportToPDF(pedidos)
      else exportToCSV(pedidos)
    } finally {
      setExportando(false)
      setConfirmar(null)
    }
  }

  const labelConfirmar = OPCIONES.find((o) => o.formato === confirmar)?.label ?? ''

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setAbierto((v) => !v)}
        disabled={pedidos.length === 0}
        className="btn-secundario h-10"
      >
        <Download size={16} />
        Exportar
        <ChevronDown
          size={14}
          className={`transition-transform ${abierto ? 'rotate-180' : ''}`}
        />
      </button>

      {abierto && (
        <div className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-card border border-slate-200 bg-white shadow-n4 animate-fade-in-up">
          {OPCIONES.map((o) => (
            <button
              key={o.formato}
              onClick={() => {
                setConfirmar(o.formato)
                setAbierto(false)
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-alianza-celeste-soft"
            >
              <o.icono size={20} className="shrink-0 text-alianza-blue" />
              <div>
                <p className="text-sm font-semibold text-slate-800">{o.label}</p>
                <p className="text-xs text-slate-500">{o.desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Diálogo de confirmación */}
      {confirmar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-alianza-blue-deep/40 p-4 backdrop-blur-sm animate-fade-in-up"
          onClick={() => setConfirmar(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-sm rounded-section bg-white p-6 shadow-n4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 grid h-12 w-12 place-items-center rounded-btn bg-alianza-celeste-soft text-alianza-blue">
              <Download size={22} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Exportar a {labelConfirmar}
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Se exportarán{' '}
              <span className="font-bold text-alianza-blue">{pedidos.length}</span>{' '}
              pedido(s) con los filtros actuales. ¿Continuar?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmar(null)}
                disabled={exportando}
                className="btn-fantasma"
              >
                Cancelar
              </button>
              <button
                onClick={() => void ejecutar(confirmar)}
                disabled={exportando}
                className="btn-primario"
              >
                {exportando ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Download size={16} />
                )}
                Descargar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

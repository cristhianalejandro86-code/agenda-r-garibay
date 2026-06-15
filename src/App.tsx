import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  LayoutDashboard,
  KanbanSquare,
  Table2,
  Inbox,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import {
  getAuthSession,
  isSupabaseConfigured,
  signOut,
  supabase,
} from './services/supabaseClient'
import { usePedidos } from './hooks/usePedidos'
import { filterPedidos, personasUnicas } from './services/exportService'
import { FILTROS_VACIOS, type FilterState } from './types'
import { Auth } from './components/Auth'
import { Header } from './components/Header'
import { InputForm } from './components/InputForm'
import { FilterBar } from './components/FilterBar'
import { ExportButton } from './components/ExportButton'

// Vistas con carga diferida: recharts (dashboard) y demás solo se
// descargan cuando se usan, aligerando el arranque.
const StatsSummary = lazy(() =>
  import('./components/StatsSummary').then((m) => ({ default: m.StatsSummary })),
)
const KanbanBoard = lazy(() =>
  import('./components/KanbanBoard').then((m) => ({ default: m.KanbanBoard })),
)
const PedidosTable = lazy(() =>
  import('./components/PedidosTable').then((m) => ({ default: m.PedidosTable })),
)

type Vista = 'dashboard' | 'tablero' | 'tabla'

const VISTAS: { id: Vista; label: string; icono: typeof Table2 }[] = [
  { id: 'dashboard', label: 'Dashboard', icono: LayoutDashboard },
  { id: 'tablero', label: 'Tablero', icono: KanbanSquare },
  { id: 'tabla', label: 'Tabla', icono: Table2 },
]

const DEMO_KEY = 'agenda_demo_entered'

export default function App() {
  // ── Sesión ──
  const [session, setSession] = useState<Session | null>(null)
  const [demoEntrado, setDemoEntrado] = useState<boolean>(
    () => localStorage.getItem(DEMO_KEY) === '1',
  )
  const [cargandoSesion, setCargandoSesion] = useState<boolean>(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return
    void getAuthSession().then((s) => {
      setSession(s)
      setCargandoSesion(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const autenticado = isSupabaseConfigured ? !!session : demoEntrado
  const userId = isSupabaseConfigured ? (session?.user.id ?? '') : 'demo-user'
  const email = isSupabaseConfigured ? (session?.user.email ?? null) : 'Demostración'

  function entrarDemo() {
    localStorage.setItem(DEMO_KEY, '1')
    setDemoEntrado(true)
  }
  async function salir() {
    if (isSupabaseConfigured) await signOut()
    else {
      localStorage.removeItem(DEMO_KEY)
      setDemoEntrado(false)
    }
  }

  if (cargandoSesion) {
    return (
      <div className="grid min-h-dvh place-items-center bg-gradient-alianza text-white">
        <Loader2 size={32} className="animate-spin" />
      </div>
    )
  }

  if (!autenticado) {
    return (
      <Auth modo={isSupabaseConfigured ? 'realtime' : 'demo'} onEntrarDemo={entrarDemo} />
    )
  }

  return <AppAutenticado userId={userId} email={email} onSalir={salir} />
}

function AppAutenticado({
  userId,
  email,
  onSalir,
}: {
  userId: string
  email: string | null
  onSalir: () => void
}) {
  const {
    pedidos,
    loading,
    error,
    sincronizando,
    modo,
    agregarPedido,
    cambiarEstado,
    actualizarPedido,
    eliminarPedido,
  } = usePedidos(userId)

  const [vista, setVista] = useState<Vista>(
    () => (localStorage.getItem('agenda_vista') as Vista) || 'dashboard',
  )
  const [filtros, setFiltros] = useState<FilterState>(FILTROS_VACIOS)

  useEffect(() => {
    localStorage.setItem('agenda_vista', vista)
  }, [vista])

  const filtrados = useMemo(() => filterPedidos(pedidos, filtros), [pedidos, filtros])
  const personas = useMemo(() => personasUnicas(pedidos), [pedidos])

  const sinDatos = !loading && pedidos.length === 0

  return (
    <div className="min-h-dvh">
      <Header
        modo={modo}
        sincronizando={sincronizando}
        email={email}
        onSignOut={onSalir}
      />

      <main className="mx-auto max-w-7xl space-y-4 px-4 py-5 sm:px-6 sm:py-6">
        <InputForm onAgregar={agregarPedido} personas={personas} />

        {error && (
          <div className="flex items-center gap-2 rounded-input border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {sinDatos ? (
          <EmptyState />
        ) : (
          <>
            {/* Barra de herramientas: conmutador de vista + export */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex rounded-btn border border-slate-200 bg-white p-1 shadow-n1">
                {VISTAS.map((v) => {
                  const activa = vista === v.id
                  return (
                    <button
                      key={v.id}
                      onClick={() => setVista(v.id)}
                      className={
                        'inline-flex items-center gap-1.5 rounded-[9px] px-3 py-1.5 text-sm font-semibold transition-all duration-300 ease-suave ' +
                        (activa
                          ? 'bg-gradient-alianza text-white shadow-n1'
                          : 'text-slate-500 hover:text-alianza-blue')
                      }
                      aria-pressed={activa}
                    >
                      <v.icono size={16} />
                      <span className="hidden sm:inline">{v.label}</span>
                    </button>
                  )
                })}
              </div>

              <ExportButton pedidos={filtrados} />
            </div>

            <FilterBar
              filtros={filtros}
              setFiltros={setFiltros}
              personas={personas}
              totalFiltrado={filtrados.length}
              total={pedidos.length}
            />

            {loading ? (
              <div className="grid place-items-center py-20 text-slate-400">
                <Loader2 size={28} className="animate-spin" />
              </div>
            ) : filtrados.length === 0 ? (
              <div className="tarjeta p-10 text-center text-slate-400">
                Ningún pedido coincide con los filtros.
              </div>
            ) : (
              <div className="animate-fade-in-up">
                <Suspense
                  fallback={
                    <div className="grid place-items-center py-20 text-slate-300">
                      <Loader2 size={26} className="animate-spin" />
                    </div>
                  }
                >
                  {vista === 'dashboard' && <StatsSummary pedidos={filtrados} />}
                  {vista === 'tablero' && (
                    <KanbanBoard
                      pedidos={filtrados}
                      onCambiarEstado={cambiarEstado}
                      onEliminar={eliminarPedido}
                    />
                  )}
                  {vista === 'tabla' && (
                    <PedidosTable
                      pedidos={filtrados}
                      onCambiarEstado={cambiarEstado}
                      onActualizar={actualizarPedido}
                      onEliminar={eliminarPedido}
                    />
                  )}
                </Suspense>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-8 pt-2 text-center text-xs text-slate-400 sm:px-6">
        Agenda R. Garibay · Mantenimiento mecánico · Alianza Lima × Shougang Hierro Perú
      </footer>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="seccion grid place-items-center px-6 py-16 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-alianza-celeste-soft text-alianza-blue">
        <Inbox size={30} />
      </span>
      <h2 className="mt-4 text-lg font-bold text-alianza-blue">Aún no hay pedidos</h2>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        Escribe el primero arriba. Por ejemplo:{' '}
        <span className="font-mono text-slate-600">🔴 Shi: revisar ball mill 034-001</span>
      </p>
    </div>
  )
}

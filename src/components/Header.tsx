import { LogOut, Wifi, WifiOff } from 'lucide-react'
import { Shield } from './ui/Shield'

interface HeaderProps {
  modo: 'realtime' | 'demo'
  sincronizando: boolean
  email: string | null
  onSignOut: () => void
}

export function Header({ modo, sincronizando, email, onSignOut }: HeaderProps) {
  const enVivo = modo === 'realtime'
  return (
    <header className="sticky top-0 z-30 overflow-hidden bg-gradient-alianza text-white shadow-n3">
      {/* Franjas verticales tipo camiseta */}
      <span className="rayas" />
      {/* Resplandor celeste */}
      <div className="pointer-events-none absolute -top-3/4 right-[2%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(91,164,230,.4),transparent_70%)]" />
      {/* Línea inferior con destello que recorre */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 overflow-hidden">
        <div className="h-full w-2/5 animate-sheen bg-gradient-to-r from-transparent via-alianza-celeste-bright to-transparent" />
      </div>

      <div className="relative mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
        {/* Escudo RG */}
        <Shield size={38} className="shrink-0 drop-shadow-[0_4px_10px_rgba(2,12,35,.5)]" />

        {/* Título */}
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-2xl font-extrabold uppercase leading-none tracking-wide">
            Agenda R. Garibay
          </h1>
          <p className="hidden truncate text-xs text-alianza-celeste sm:block">
            Pedidos de mantenimiento mecánico · Planta de Beneficio SHP
          </p>
        </div>

        {/* Indicador de sincronización */}
        <div
          className="hidden shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur sm:flex"
          title={
            enVivo
              ? 'Sincronización en tiempo real con Supabase'
              : 'Modo demostración: datos locales, sin sincronización'
          }
        >
          {enVivo ? (
            <>
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className={
                    'absolute inline-flex h-full w-full rounded-full bg-green-400 ' +
                    (sincronizando ? 'animate-ping' : 'animate-pulse-sync')
                  }
                />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-400" />
              </span>
              <Wifi size={14} />
              <span>{sincronizando ? 'Sincronizando…' : 'En vivo'}</span>
            </>
          ) : (
            <>
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
              <WifiOff size={14} />
              <span>Demo</span>
            </>
          )}
        </div>

        {/* Usuario / salir */}
        {email && (
          <button
            onClick={onSignOut}
            className="ml-1 inline-flex shrink-0 items-center gap-1.5 rounded-btn border border-white/15 bg-white/10 px-2.5 py-2 text-xs font-bold text-white transition-colors hover:bg-white/20"
            title={`Cerrar sesión (${email})`}
          >
            <LogOut size={15} />
            <span className="hidden md:inline">Salir</span>
          </button>
        )}
      </div>

      {/* Indicador compacto en móvil */}
      <div className="relative flex items-center justify-center gap-1.5 bg-black/10 py-1 text-[11px] font-semibold sm:hidden">
        {enVivo ? (
          <>
            <span className="h-2 w-2 animate-pulse-sync rounded-full bg-green-400" />
            {sincronizando ? 'Sincronizando…' : 'En vivo'}
          </>
        ) : (
          <>
            <span className="h-2 w-2 rounded-full bg-amber-300" />
            Modo demostración
          </>
        )}
      </div>
    </header>
  )
}

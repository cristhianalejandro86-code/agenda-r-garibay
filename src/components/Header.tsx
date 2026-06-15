import { useState } from 'react'
import { LogOut, Wifi, WifiOff } from 'lucide-react'

interface HeaderProps {
  modo: 'realtime' | 'demo'
  sincronizando: boolean
  email: string | null
  onSignOut: () => void
}

/** Logo con PNG oficial y fallback al placeholder SVG si aún no existe. */
function Logo({ nombre, alt, clase }: { nombre: string; alt: string; clase: string }) {
  // TODO: reemplazar con el logo oficial (sube el .png a public/logos/)
  const [src, setSrc] = useState(`/logos/${nombre}.png`)
  return (
    <img
      src={src}
      alt={alt}
      className={clase}
      onError={() => setSrc(`/logos/${nombre}.svg`)}
      loading="eager"
      decoding="async"
    />
  )
}

export function Header({ modo, sincronizando, email, onSignOut }: HeaderProps) {
  const enVivo = modo === 'realtime'
  return (
    <header className="sticky top-0 z-30 bg-gradient-alianza text-white shadow-n3">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
        {/* Logo Alianza Lima */}
        <Logo
          nombre="alianza-lima"
          alt="Alianza Lima"
          clase="h-10 w-10 shrink-0 rounded-full bg-white/10 p-0.5"
        />

        {/* Título */}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-extrabold leading-tight tracking-tight sm:text-xl">
            Agenda R. Garibay
          </h1>
          <p className="hidden truncate text-xs text-alianza-celeste sm:block">
            Pedidos de mantenimiento mecánico · Planta de Beneficio SHP
          </p>
        </div>

        {/* Indicador de sincronización */}
        <div
          className="hidden items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur sm:flex"
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

        {/* Logo SHP */}
        <Logo nombre="shp" alt="Shougang Hierro Perú" clase="h-9 w-auto shrink-0" />

        {/* Usuario / salir */}
        {email && (
          <button
            onClick={onSignOut}
            className="ml-1 inline-flex items-center gap-1.5 rounded-btn bg-white/10 px-2.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/20"
            title={`Cerrar sesión (${email})`}
          >
            <LogOut size={15} />
            <span className="hidden md:inline">Salir</span>
          </button>
        )}
      </div>

      {/* Indicador compacto en móvil */}
      <div className="flex items-center justify-center gap-1.5 bg-black/10 py-1 text-[11px] font-semibold sm:hidden">
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

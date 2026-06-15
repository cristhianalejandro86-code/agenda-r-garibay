import { useState } from 'react'
import { LogIn, Mail, Lock, Loader2, PlayCircle, Info } from 'lucide-react'
import { supabase } from '../services/supabaseClient'
import { Shield } from './ui/Shield'

interface AuthProps {
  modo: 'realtime' | 'demo'
  onEntrarDemo: () => void
}

export function Auth({ modo, onEntrarDemo }: AuthProps) {
  const [esRegistro, setEsRegistro] = useState(false)
  const [email, setEmail] = useState('')
  const [clave, setClave] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setCargando(true)
    setError(null)
    setAviso(null)
    try {
      if (esRegistro) {
        const { error } = await supabase.auth.signUp({ email, password: clave })
        if (error) throw error
        setAviso('Cuenta creada. Revisa tu correo si se requiere confirmación.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: clave })
        if (error) throw error
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo autenticar')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-gradient-login p-4">
      {/* Franjas verticales tipo camiseta */}
      <div className="bg-rayas-login pointer-events-none absolute inset-0" />
      {/* Destellos celestes en deriva */}
      <div className="pointer-events-none absolute -right-32 -top-44 h-[520px] w-[520px] animate-float rounded-full bg-[radial-gradient(circle,rgba(91,164,230,.42),transparent_68%)]" />
      <div className="pointer-events-none absolute -bottom-48 -left-36 h-[480px] w-[480px] animate-float-slow rounded-full bg-[radial-gradient(circle,rgba(0,61,165,.5),transparent_70%)]" />

      <div className="relative w-full max-w-md animate-fade-in-up">
        {/* Marca */}
        <div className="mb-6 flex flex-col items-center text-center text-white">
          <Shield size={86} className="drop-shadow-[0_14px_28px_rgba(3,16,40,.6)]" />
          <h1 className="mt-4 whitespace-nowrap font-display text-4xl font-extrabold uppercase tracking-wide">
            Agenda R. Garibay
          </h1>
          <p className="mt-2 max-w-xs text-sm font-semibold text-alianza-celeste">
            Pedidos de mantenimiento mecánico · Planta de Beneficio SHP
          </p>
        </div>

        <div className="rounded-[22px] border border-white/[0.16] bg-white/[0.07] p-7 shadow-n4 backdrop-blur-md">
          {modo === 'demo' ? (
            <>
              <div className="mb-4 flex items-start gap-2 rounded-input bg-white/10 p-3 text-sm text-white/90">
                <Info size={18} className="mt-0.5 shrink-0 text-alianza-celeste" />
                <p>
                  <span className="font-bold">Modo demostración.</span> Estás viendo la app con
                  datos de ejemplo locales. Configura Supabase para sincronizar en tiempo real
                  (ver <span className="font-mono">README.md</span>).
                </p>
              </div>
              <button onClick={onEntrarDemo} className="btn-primario w-full">
                <PlayCircle size={18} />
                Entrar a la demostración
              </button>
            </>
          ) : (
            <form onSubmit={enviar} className="space-y-4">
              <h2 className="text-lg font-bold text-white">
                {esRegistro ? 'Crear cuenta' : 'Iniciar sesión'}
              </h2>

              <div className="relative">
                <Mail
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-alianza-celeste/70"
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@empresa.com"
                  autoComplete="email"
                  className="w-full rounded-input border border-white/[0.18] bg-white/[0.06] px-3.5 py-3 pl-11 text-white placeholder:text-white/40 transition-colors focus:border-alianza-celeste focus:outline-none"
                />
              </div>

              <div className="relative">
                <Lock
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-alianza-celeste/70"
                />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  placeholder="Contraseña"
                  autoComplete={esRegistro ? 'new-password' : 'current-password'}
                  className="w-full rounded-input border border-white/[0.18] bg-white/[0.06] px-3.5 py-3 pl-11 text-white placeholder:text-white/40 transition-colors focus:border-alianza-celeste focus:outline-none"
                />
              </div>

              {error && (
                <p className="rounded-input bg-red-500/15 px-3 py-2 text-sm font-medium text-red-200">
                  {error}
                </p>
              )}
              {aviso && (
                <p className="rounded-input bg-green-500/15 px-3 py-2 text-sm font-medium text-green-200">
                  {aviso}
                </p>
              )}

              <button type="submit" disabled={cargando} className="btn-primario w-full">
                {cargando ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
                {esRegistro ? 'Crear cuenta' : 'Entrar'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setEsRegistro((v) => !v)
                  setError(null)
                  setAviso(null)
                }}
                className="w-full text-center text-sm font-semibold text-alianza-celeste hover:underline"
              >
                {esRegistro
                  ? '¿Ya tienes cuenta? Inicia sesión'
                  : '¿No tienes cuenta? Regístrate'}
              </button>
            </form>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-white/50">
          Alianza Lima · Shougang Hierro Perú
        </p>
      </div>
    </div>
  )
}

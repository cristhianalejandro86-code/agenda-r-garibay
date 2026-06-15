import { useState } from 'react'
import { LogIn, Mail, Lock, Loader2, PlayCircle, Info } from 'lucide-react'
import { supabase } from '../services/supabaseClient'

interface AuthProps {
  modo: 'realtime' | 'demo'
  onEntrarDemo: () => void
}

function LogoMarca({ nombre, alt, clase }: { nombre: string; alt: string; clase: string }) {
  const [src, setSrc] = useState(`/logos/${nombre}.png`)
  return (
    <img src={src} alt={alt} className={clase} onError={() => setSrc(`/logos/${nombre}.svg`)} />
  )
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
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: clave,
        })
        if (error) throw error
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo autenticar')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-gradient-alianza p-4">
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Marca */}
        <div className="mb-6 flex flex-col items-center text-center text-white">
          <LogoMarca
            nombre="alianza-lima"
            alt="Alianza Lima"
            clase="h-16 w-16 rounded-full bg-white/10 p-1 shadow-n3"
          />
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Agenda R. Garibay</h1>
          <p className="mt-1 text-sm text-alianza-celeste">
            Pedidos de mantenimiento mecánico · Planta de Beneficio SHP
          </p>
        </div>

        <div className="seccion p-6 sm:p-7">
          {modo === 'demo' ? (
            <>
              <div className="mb-4 flex items-start gap-2 rounded-input bg-alianza-celeste-soft p-3 text-sm text-alianza-blue-dark">
                <Info size={18} className="mt-0.5 shrink-0" />
                <p>
                  <span className="font-bold">Modo demostración.</span> Estás viendo la app
                  con datos de ejemplo locales. Configura Supabase para sincronizar en
                  tiempo real (ver <span className="font-mono">README.md</span>).
                </p>
              </div>
              <button onClick={onEntrarDemo} className="btn-primario w-full">
                <PlayCircle size={18} />
                Entrar a la demostración
              </button>
            </>
          ) : (
            <form onSubmit={enviar} className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800">
                {esRegistro ? 'Crear cuenta' : 'Iniciar sesión'}
              </h2>

              <div className="relative">
                <Mail
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@empresa.com"
                  className="input-base pl-10"
                  autoComplete="email"
                />
              </div>

              <div className="relative">
                <Lock
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  placeholder="Contraseña"
                  className="input-base pl-10"
                  autoComplete={esRegistro ? 'new-password' : 'current-password'}
                />
              </div>

              {error && (
                <p className="rounded-input bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                  {error}
                </p>
              )}
              {aviso && (
                <p className="rounded-input bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
                  {aviso}
                </p>
              )}

              <button type="submit" disabled={cargando} className="btn-primario w-full">
                {cargando ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <LogIn size={18} />
                )}
                {esRegistro ? 'Crear cuenta' : 'Entrar'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setEsRegistro((v) => !v)
                  setError(null)
                  setAviso(null)
                }}
                className="w-full text-center text-sm font-semibold text-alianza-blue hover:underline"
              >
                {esRegistro
                  ? '¿Ya tienes cuenta? Inicia sesión'
                  : '¿No tienes cuenta? Regístrate'}
              </button>
            </form>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-white/60">
          Alianza Lima · Shougang Hierro Perú
        </p>
      </div>
    </div>
  )
}

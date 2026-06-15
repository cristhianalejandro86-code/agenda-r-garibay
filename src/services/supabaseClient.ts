import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js'

// ════════════════════════════════════════════════════════════════════
//  Cliente Supabase
//  - Lee credenciales de import.meta.env (NUNCA hardcodear).
//  - Si faltan o son placeholders → la app corre en MODO DEMOSTRACIÓN
//    (datos en memoria), para poder verla sin configurar el backend.
// ════════════════════════════════════════════════════════════════════

const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

function esPlaceholder(valor: string): boolean {
  return (
    !valor ||
    valor.includes('TU-PROYECTO') ||
    valor === 'eyJ...' ||
    valor.startsWith('https://TU-')
  )
}

/** `true` cuando hay credenciales reales y la app habla con Supabase. */
export const isSupabaseConfigured: boolean =
  !esPlaceholder(url) && !esPlaceholder(anonKey)

/**
 * Cliente único de Supabase. Es `null` en modo demostración para que
 * ningún servicio intente una llamada de red sin credenciales.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null

if (!isSupabaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    '[Agenda R. Garibay] Sin credenciales de Supabase: corriendo en MODO DEMOSTRACIÓN. ' +
      'Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local para sincronizar.',
  )
}

/** Sesión actual (o null). En modo demo siempre null. */
export async function getAuthSession(): Promise<Session | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function signOut(): Promise<void> {
  if (!supabase) return
  await supabase.auth.signOut()
}

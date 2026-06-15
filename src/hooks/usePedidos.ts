import { useCallback, useEffect, useRef, useState } from 'react'
import { isSupabaseConfigured } from '../services/supabaseClient'
import {
  parseInput,
  parsedToNuevoPedido,
  supabaseRepo,
  type PedidosRepo,
} from '../services/pedidosService'
import { demoRepo } from '../lib/demoData'
import type { Estado, NuevoPedido, ParsedInput, Pedido } from '../types'

const repo: PedidosRepo = isSupabaseConfigured ? supabaseRepo : demoRepo

export interface UsePedidos {
  pedidos: Pedido[]
  loading: boolean
  error: string | null
  /** Parpadea brevemente al sincronizar (alimenta el indicador). */
  sincronizando: boolean
  modo: 'realtime' | 'demo'
  agregarDesdeTexto: (
    texto: string,
    extra?: Partial<NuevoPedido>,
  ) => Promise<ParsedInput | null>
  agregarPedido: (nuevo: NuevoPedido) => Promise<void>
  actualizarPedido: (id: string, patch: Partial<Pedido>) => Promise<void>
  cambiarEstado: (id: string, estado: Estado) => Promise<void>
  eliminarPedido: (id: string) => Promise<void>
  recargar: () => Promise<void>
}

export function usePedidos(userId: string): UsePedidos {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sincronizando, setSincronizando] = useState(false)
  const parpadeoRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const marcarSync = useCallback(() => {
    setSincronizando(true)
    if (parpadeoRef.current) clearTimeout(parpadeoRef.current)
    parpadeoRef.current = setTimeout(() => setSincronizando(false), 600)
  }, [])

  const recargar = useCallback(async () => {
    if (!userId) return
    try {
      marcarSync()
      const data = await repo.fetch(userId)
      setPedidos(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar pedidos')
    } finally {
      setLoading(false)
    }
  }, [userId, marcarSync])

  // Carga inicial + suscripción realtime
  useEffect(() => {
    if (!userId) return
    setLoading(true)
    void recargar()
    const desuscribir = repo.subscribe(userId, () => {
      void recargar()
    })
    return () => {
      desuscribir()
      if (parpadeoRef.current) clearTimeout(parpadeoRef.current)
    }
  }, [userId, recargar])

  const agregarPedido = useCallback(
    async (nuevo: NuevoPedido) => {
      try {
        marcarSync()
        const creado = await repo.create(userId, nuevo)
        // Optimista: aparece al instante (realtime confirmará).
        setPedidos((prev) => [creado, ...prev.filter((p) => p.id !== creado.id)])
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudo crear el pedido')
        throw e
      }
    },
    [userId, marcarSync],
  )

  const agregarDesdeTexto = useCallback(
    async (
      texto: string,
      extra?: Partial<NuevoPedido>,
    ): Promise<ParsedInput | null> => {
      const limpio = texto.trim()
      if (!limpio) return null
      const parsed = parseInput(limpio)
      await agregarPedido({ ...parsedToNuevoPedido(parsed), ...extra })
      return parsed
    },
    [agregarPedido],
  )

  const actualizarPedido = useCallback(
    async (id: string, patch: Partial<Pedido>) => {
      // Optimista
      setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
      try {
        marcarSync()
        await repo.update(id, patch)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudo actualizar')
        void recargar()
      }
    },
    [marcarSync, recargar],
  )

  const cambiarEstado = useCallback(
    (id: string, estado: Estado) => actualizarPedido(id, { estado }),
    [actualizarPedido],
  )

  const eliminarPedido = useCallback(
    async (id: string) => {
      const respaldo = pedidos
      setPedidos((prev) => prev.filter((p) => p.id !== id)) // optimista
      try {
        marcarSync()
        await repo.remove(id)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudo eliminar')
        setPedidos(respaldo)
      }
    },
    [pedidos, marcarSync],
  )

  return {
    pedidos,
    loading,
    error,
    sincronizando,
    modo: isSupabaseConfigured ? 'realtime' : 'demo',
    agregarDesdeTexto,
    agregarPedido,
    actualizarPedido,
    cambiarEstado,
    eliminarPedido,
    recargar,
  }
}

import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ClipboardList,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  TrendingUp,
  Layers,
  Users,
  CalendarX2,
} from 'lucide-react'
import {
  CATEGORIA_META,
  ESTADO_META,
  PRIORIDAD_META,
  type Pedido,
} from '../types'
import { KpiCard } from './ui/KpiCard'
import { esVencido } from '../lib/fechas'

interface StatsSummaryProps {
  pedidos: Pedido[]
}

const ejeComun = {
  tick: { fill: '#64748b', fontSize: 12 },
  axisLine: { stroke: '#e2e8f0' },
  tickLine: false,
}

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  boxShadow: '0 8px 24px rgba(0,30,77,0.12)',
  fontSize: 13,
}

function Panel({
  titulo,
  icono: Icono,
  children,
  className = '',
}: {
  titulo: string
  icono: typeof Layers
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`tarjeta p-4 sm:p-5 ${className}`}>
      <div className="mb-3 flex items-center gap-2">
        <Icono size={16} className="text-alianza-blue" />
        <h3 className="text-sm font-bold text-slate-700">{titulo}</h3>
      </div>
      {children}
    </div>
  )
}

export function StatsSummary({ pedidos }: StatsSummaryProps) {
  const stats = useMemo(() => {
    const total = pedidos.length
    const porEstado = { nuevo: 0, en_progreso: 0, completado: 0 }
    const porPrioridad = { alta: 0, normal: 0, baja: 0 }
    const porCategoria: Record<string, number> = {}
    const porPersona: Record<string, number> = {}

    for (const p of pedidos) {
      porEstado[p.estado]++
      porPrioridad[p.prioridad]++
      if (p.categorias.length === 0)
        porCategoria['Sin categoría'] = (porCategoria['Sin categoría'] ?? 0) + 1
      for (const c of p.categorias) porCategoria[c] = (porCategoria[c] ?? 0) + 1
      const persona = p.persona_solicita || '—'
      porPersona[persona] = (porPersona[persona] ?? 0) + 1
    }

    const altaPendiente = pedidos.filter(
      (p) => p.prioridad === 'alta' && p.estado !== 'completado',
    ).length

    const vencidos = pedidos.filter((p) => esVencido(p)).length

    const avance = total ? Math.round((porEstado.completado / total) * 100) : 0

    // Tendencia: últimos 10 días
    const dias: { fecha: string; etiqueta: string; n: number }[] = []
    const hoy = new Date()
    for (let i = 9; i >= 0; i--) {
      const d = new Date(hoy)
      d.setDate(hoy.getDate() - i)
      const clave = d.toISOString().slice(0, 10)
      dias.push({
        fecha: clave,
        etiqueta: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
        n: 0,
      })
    }
    const idx = new Map(dias.map((d, i) => [d.fecha, i]))
    for (const p of pedidos) {
      const k = p.created_at.slice(0, 10)
      const i = idx.get(k)
      if (i !== undefined) dias[i].n++
    }

    const dataEstado = (['nuevo', 'en_progreso', 'completado'] as const)
      .map((e) => ({
        name: ESTADO_META[e].label,
        value: porEstado[e],
        color: ESTADO_META[e].color,
      }))
      .filter((d) => d.value > 0)

    const dataCategoria = Object.entries(porCategoria)
      .map(([name, value]) => ({
        name,
        value,
        color: CATEGORIA_META[name as keyof typeof CATEGORIA_META]?.color ?? '#64748b',
      }))
      .sort((a, b) => b.value - a.value)

    const dataPersona = Object.entries(porPersona)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)

    return {
      total,
      porEstado,
      porPrioridad,
      altaPendiente,
      vencidos,
      avance,
      dias,
      dataEstado,
      dataCategoria,
      dataPersona,
    }
  }, [pedidos])

  if (stats.total === 0) {
    return (
      <div className="tarjeta p-10 text-center text-slate-400">
        Sin datos para resumir con los filtros actuales.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
        <KpiCard
          icono={ClipboardList}
          etiqueta="Total pedidos"
          valor={stats.total}
          color="#003DA5"
        />
        <KpiCard
          icono={CalendarX2}
          etiqueta="Vencidos"
          valor={stats.vencidos}
          color="#DC2626"
          subtitulo="pasados de fecha"
        />
        <KpiCard
          icono={AlertTriangle}
          etiqueta="Alta · pendientes"
          valor={stats.altaPendiente}
          color="#EA580C"
          subtitulo="alta sin completar"
        />
        <KpiCard
          icono={Loader2}
          etiqueta="En progreso"
          valor={stats.porEstado.en_progreso}
          color="#7C3AED"
        />
        <KpiCard
          icono={CheckCircle2}
          etiqueta="Avance"
          valor={`${stats.avance}%`}
          color="#16A34A"
          subtitulo={`${stats.porEstado.completado} compl.`}
          progreso={stats.avance}
        />
      </div>

      {/* Donut estado + barras categoría */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel titulo="Distribución por estado" icono={CheckCircle2}>
          <div className="flex items-center">
            <div className="h-48 w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.dataEstado}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={42}
                    outerRadius={70}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {stats.dataEstado.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="w-1/2 space-y-2">
              {stats.dataEstado.map((d) => (
                <li key={d.name} className="flex items-center gap-2 text-sm">
                  <span
                    className="h-3 w-3 rounded-sm"
                    style={{ backgroundColor: d.color }}
                  />
                  <span className="text-slate-600">{d.name}</span>
                  <span className="ml-auto font-bold text-slate-800">{d.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>

        <Panel titulo="Pedidos por circuito" icono={Layers} className="lg:col-span-2">
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.dataCategoria}
                margin={{ top: 8, right: 8, bottom: 0, left: -18 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                <XAxis dataKey="name" {...ejeComun} />
                <YAxis allowDecimals={false} {...ejeComun} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: 'rgba(91,164,230,0.08)' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={56}>
                  {stats.dataCategoria.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* Tendencia + top solicitantes */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel
          titulo="Tendencia (últimos 10 días)"
          icono={TrendingUp}
          className="lg:col-span-2"
        >
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={stats.dias}
                margin={{ top: 8, right: 8, bottom: 0, left: -18 }}
              >
                <defs>
                  <linearGradient id="grad-tend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#003DA5" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#003DA5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                <XAxis dataKey="etiqueta" {...ejeComun} />
                <YAxis allowDecimals={false} {...ejeComun} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="n"
                  name="Pedidos"
                  stroke="#003DA5"
                  strokeWidth={2.5}
                  fill="url(#grad-tend)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel titulo="Top solicitantes" icono={Users}>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={stats.dataPersona}
                margin={{ top: 0, right: 16, bottom: 0, left: 8 }}
              >
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={64}
                  tick={{ fill: '#475569', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: 'rgba(91,164,230,0.08)' }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} fill="#5BA4E6" maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* Mini-resumen por prioridad */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {(['alta', 'normal', 'baja'] as const).map((p) => (
          <div
            key={p}
            className="tarjeta flex items-center gap-3 p-3 sm:p-4"
            style={{ borderLeft: `4px solid ${PRIORIDAD_META[p].color}` }}
          >
            <span className="text-xl" aria-hidden>
              {PRIORIDAD_META[p].emoji}
            </span>
            <div>
              <p className="text-2xl font-extrabold leading-none text-slate-900">
                {stats.porPrioridad[p]}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Prioridad {PRIORIDAD_META[p].label.toLowerCase()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

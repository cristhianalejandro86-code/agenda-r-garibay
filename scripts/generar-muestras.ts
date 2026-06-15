/**
 * Genera hojas de exportación REALES (Excel/PDF/CSV) con datos de muestra,
 * usando las mismas funciones que la app. Sirve para que agentes visuales
 * auditen el formato. No forma parte del bundle.
 *
 *   npx tsx scripts/generar-muestras.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { construirCsv, construirPdf, construirWorkbook } from '../src/services/exportService'
import type { Pedido } from '../src/types'

const aqui = dirname(fileURLToPath(import.meta.url))
const OUT = join(aqui, '..', 'muestras')
mkdirSync(OUT, { recursive: true })

function iso(dias: number, h = 8): string {
  const t = Date.UTC(2026, 5, 15 - dias, h, 16)
  return new Date(t).toISOString()
}

const M: Omit<Pedido, 'user_id'>[] = [
  { id: '1', persona_solicita: 'Shi', descripcion: 'revisar grease ball mill 034-001, ruido anómalo en piñón de ataque y posible desalineación del reductor', prioridad: 'alta', categorias: ['HPGR'], estado: 'en_progreso', notas: 'Coordinar parada con operaciones; repuesto de piñón en tránsito', reunion: 'Reunión diaria 06:00', created_at: iso(0), updated_at: iso(0) },
  { id: '2', persona_solicita: 'Wan', descripcion: 'cambio de telas filtro prensa FP-02', prioridad: 'alta', categorias: ['Filtros'], estado: 'nuevo', notas: null, reunion: 'Reunión diaria 06:00', created_at: iso(0, 10), updated_at: iso(0, 10) },
  { id: '3', persona_solicita: 'Quispe', descripcion: 'inspección separador magnético, vibración alta en chumacera lado libre', prioridad: 'normal', categorias: ['Magnética'], estado: 'nuevo', notas: 'Programar termografía', reunion: 'Comité semanal', created_at: iso(1), updated_at: iso(1) },
  { id: '4', persona_solicita: 'Mendoza', descripcion: 'fuga en espesador de relaves, sello de eje del agitador', prioridad: 'alta', categorias: ['Relaves'], estado: 'en_progreso', notas: 'Repuesto solicitado a almacén (OC 4521)', reunion: 'Comité semanal', created_at: iso(2), updated_at: iso(2) },
  { id: '5', persona_solicita: 'Shi', descripcion: 'alinear motor molino 025 con lectura láser', prioridad: 'normal', categorias: ['HPGR'], estado: 'completado', notas: 'Alineamiento dentro de tolerancia (0.05 mm)', reunion: null, created_at: iso(3), updated_at: iso(3) },
  { id: '6', persona_solicita: 'Rojas', descripcion: 'lubricación de rodamientos en faja transportadora principal', prioridad: 'baja', categorias: [], estado: 'completado', notas: null, reunion: 'Reunión diaria 06:00', created_at: iso(3, 12), updated_at: iso(3, 12) },
  { id: '7', persona_solicita: 'Wan', descripcion: 'limpieza de tailings en línea de bombeo, thickener subdimensionado', prioridad: 'normal', categorias: ['Relaves'], estado: 'nuevo', notas: null, reunion: null, created_at: iso(4), updated_at: iso(4) },
  { id: '8', persona_solicita: 'Garibay', descripcion: 'programar overhaul HPGR para próxima parada de planta; definir alcance con contratista y lista de repuestos críticos', prioridad: 'alta', categorias: ['HPGR'], estado: 'en_progreso', notas: 'Cotización pendiente de 2 proveedores', reunion: 'Comité semanal', created_at: iso(5), updated_at: iso(5) },
  { id: '9', persona_solicita: 'Quispe', descripcion: 'revisar bobina separador magnético mag-3', prioridad: 'normal', categorias: ['Magnética'], estado: 'completado', notas: 'OK tras reemplazo de fusible', reunion: null, created_at: iso(6), updated_at: iso(6) },
  { id: '10', persona_solicita: 'Mendoza', descripcion: 'cambio de aceite reductor filtro prensa FP-01', prioridad: 'baja', categorias: ['Filtros'], estado: 'completado', notas: null, reunion: 'Reunión diaria 06:00', created_at: iso(7), updated_at: iso(7) },
  { id: '11', persona_solicita: null, descripcion: 'pedir EPP para cuadrilla de relaves (guantes, respiradores)', prioridad: 'baja', categorias: ['Relaves'], estado: 'nuevo', notas: null, reunion: null, created_at: iso(8), updated_at: iso(8) },
  { id: '12', persona_solicita: 'Shi', descripcion: 'termografía a tablero eléctrico de ball mill', prioridad: 'normal', categorias: ['HPGR'], estado: 'completado', notas: 'Sin puntos calientes', reunion: 'Comité semanal', created_at: iso(10), updated_at: iso(10) },
]

const pedidos = M.map((p) => ({ ...p, user_id: 'muestra' })) as Pedido[]

const wb = await construirWorkbook(pedidos)
await wb.xlsx.writeFile(join(OUT, 'muestra.xlsx'))

const doc = await construirPdf(pedidos)
const ab = doc.output('arraybuffer') as ArrayBuffer
writeFileSync(join(OUT, 'muestra.pdf'), Buffer.from(ab))

writeFileSync(join(OUT, 'muestra.csv'), construirCsv(pedidos), 'utf8')

console.log(`Generadas ${pedidos.length} filas → ${OUT}`)
console.log('  muestra.xlsx · muestra.pdf · muestra.csv')

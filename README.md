# Agenda R. Garibay

App para capturar **pedidos/encargos que surgen en reuniones** y sincronizarlos en
tiempo real con Supabase. Pensada para la supervisión de **mantenimiento mecánico** en
una planta de beneficio minero (circuitos **HPGR, Filtros, Magnética y Relaves**).

En la reunión escribes rápido en el celular y el pedido aparece **estructurado y
sincronizado** en menos de un segundo. Luego filtras, cambias estados y exportas a
Excel / PDF / CSV.

> Marca: **Alianza Lima** (azul + blanco + celeste) en el _chrome_ de la interfaz.
> Los colores de **prioridad** y **estado** se mantienen funcionales para lectura rápida.

---

## ✨ Características

- **Captura inteligente**: un solo campo. Detecta prioridad (emoji), persona (`Nombre:`)
  y categorías (palabras clave) con previsualización en vivo.
- **3 vistas del mismo dato**:
  - **Dashboard ejecutivo** — KPIs, dona por estado, barras por circuito, tendencia de
    10 días y top de solicitantes.
  - **Tablero (Kanban)** — Nuevo → En progreso → Completado, con avance por tarjeta.
  - **Tabla** — completa en escritorio, tarjetas apiladas en móvil; notas editables.
- **Sincronización en tiempo real** (Supabase Realtime) con indicador de estado.
- **Filtros** por texto, persona, prioridad, estado y categoría + badges activos.
- **Export**: Excel (2 hojas: datos + resumen), PDF (con marca) y CSV — con confirmación.
- **Auth** de Supabase (email/clave) y **RLS** estricto por usuario.
- **Modo demostración**: sin credenciales, la app arranca con datos de ejemplo locales
  para poder verla y presentarla de inmediato.
- Accesible: contraste alto, foco visible, `prefers-reduced-motion`, atajo
  `Enter` / `Ctrl·⌘ + Enter` para enviar.

---

## 🚀 Puesta en marcha (local)

Requisitos: **Node 18+** y **npm**.

```bash
npm install
npm run dev      # http://localhost:5174
```

Sin `.env.local` configurado, la app corre en **modo demostración**. Para datos reales,
sigue la sección de Supabase.

Otros comandos:

```bash
npm run build    # tsc -b && vite build  (compila y empaqueta a dist/)
npm run preview  # sirve el build de producción
npm run lint     # eslint
```

---

## 🗄️ Conectar Supabase

1. Crea un proyecto en <https://supabase.com> (o usa uno existente).
2. **SQL**: abre **SQL Editor → New query**, pega el contenido de
   [`SQL_SETUP.sql`](./SQL_SETUP.sql) y pulsa **Run**. Esto crea la tabla `pedidos`,
   índices, trigger `updated_at`, políticas **RLS** y la publicación **Realtime**.
3. **Credenciales**: en **Project Settings → API** copia la **Project URL** y la
   **anon public key**.
4. Crea tu archivo de entorno a partir del ejemplo:

   ```bash
   cp .env.example .env.local
   ```

   y rellena:

   ```
   VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

5. Reinicia `npm run dev`. El indicador del header pasará a **“En vivo”**.

> 🔒 Las credenciales se leen con `import.meta.env` y **nunca** se hardcodean.
> `.env.local` está en `.gitignore`: no se commitea.

> ℹ️ La **anon key** es pública por diseño; la seguridad la da **RLS** (cada usuario
> solo ve y edita sus propios pedidos). Por eso el SQL es obligatorio.

---

## ☁️ Despliegue en Vercel

Nombre de proyecto sugerido: **`agenda-r-garibay`**.

### A) Vía CLI

```bash
npm i -g vercel
vercel link                       # nombre del proyecto: agenda-r-garibay
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel --prod
```

### B) Vía dashboard

1. Sube el repo a GitHub e impórtalo en Vercel (**Add New… → Project**).
2. Framework: **Vite** (autodetectado). Build: `npm run build`. Output: `dist`.
3. **Project Settings → Environment Variables**: agrega `VITE_SUPABASE_URL` y
   `VITE_SUPABASE_ANON_KEY` (Production y Preview).
4. **Deploy**. El [`vercel.json`](./vercel.json) ya incluye el _rewrite_ SPA a
   `/index.html`.

> Si añades un dominio propio en Supabase **Auth → URL Configuration**, agrega la URL
> de Vercel a los _redirect URLs_ permitidos.

---

## 🧠 Lógica de parseo (`parseInput`)

Entrada de ejemplo: `🔴 Shi: revisar grease ball mill 034-001`

| Elemento | Regla |
|----------|-------|
| **Prioridad** | Emoji inicial: `🔴` alta · `🟢` baja · `🟡` o sin emoji normal |
| **Persona** | Texto antes de `:` (acepta tildes y nombres romanizados como Shi/Wan) |
| **Categorías** | Palabras clave en la descripción (puede haber varias) |
| **Descripción** | El texto sin el emoji ni el prefijo `Nombre:` |

Palabras clave por circuito:

- **HPGR**: `hpgr`, `ball mill`, `molino`, `034`, `025`
- **Filtros**: `filtro`, `filter`, `prensa`
- **Magnética**: `magnética`, `magnetica`, `magnetic`, `mag`, `separador`
- **Relaves**: `relave(s)`, `tailings`, `espesador`, `thickener`

Implementado en [`src/services/pedidosService.ts`](./src/services/pedidosService.ts).

---

## 🖼️ Logos

Coloca los oficiales en `public/logos/` como **`alianza-lima.png`** y **`shp.png`**
(alto ~40px). Mientras no existan, el header usa placeholders SVG (`onError` cae al
`.svg`). Busca los `// TODO: reemplazar con el logo oficial` en el código.

---

## 🧱 Estructura

```
src/
├─ types/index.ts          Tipos de dominio + metadatos (colores/etiquetas)
├─ services/
│  ├─ supabaseClient.ts     Cliente + detección de modo demo
│  ├─ pedidosService.ts     parseInput() + CRUD + realtime (Supabase)
│  └─ exportService.ts      filtros + Excel/PDF/CSV (libs con carga diferida)
├─ hooks/usePedidos.ts      Estado + realtime + mutaciones optimistas
├─ lib/
│  ├─ demoData.ts           Repositorio en memoria (modo demostración)
│  └─ color.ts              Utilidad de color
├─ components/
│  ├─ Header · InputForm · FilterBar · StatsSummary (dashboard)
│  ├─ KanbanBoard · PedidosTable · ExportButton · Auth
│  └─ ui/ (Badges, KpiCard)
└─ App.tsx
```

---

## 🛠️ Stack

React 18 · Vite · TypeScript (strict) · Tailwind CSS · Supabase (Auth + Postgres +
Realtime) · recharts · lucide-react · xlsx · jspdf + jspdf-autotable · Vercel.

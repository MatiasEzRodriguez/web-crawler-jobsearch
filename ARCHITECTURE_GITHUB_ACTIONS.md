# 🏗️ Arquitectura: GitHub Actions + Neon.tech

Detalles técnicos de la automatización implementada.

---

## **Schema Prisma Actualizado**

**Cambio principal:** SQLite → PostgreSQL

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"  // ← Cambio de "sqlite"
  url      = env("DATABASE_URL")
}

model Job {
  id        Int     @id @default(autoincrement())
  title     String
  company   String
  url       String  @unique
  postedDate DateTime
  foundAt   DateTime @default(now())
  
  @@map("jobs")
}
```

**Por qué PostgreSQL:**
- ✅ Mejor escalabilidad que SQLite
- ✅ Soporta conexiones concurrentes (GH Actions)
- ✅ Neon ofrece tier gratuito generoso (10GB storage)
- ✅ No hay file-based database (evita problemas de concurrencia)

---

## **Workflow: Ejecución Paso a Paso**

### Architecture Diagram

```
GitHub Actions Runner (ubuntu-latest)
│
├─ 1. Checkout repo
├─ 2. Setup Node 18
├─ 3. Restore npm cache (si existe)
├─ 4. Restore Playwright cache (si existe)
│  
├─ 5. npm ci (instala deps, usa caché si disponible)
│  └─ Packages: @prisma/client, playwright, date-fns, csv-parser, ts-node
│
├─ 6. npx playwright install chromium (usa caché si disponible)
│  └─ Descarga ~150MB Chromium (una sola vez, luego caché)
│
├─ 7. npx prisma generate
│  └─ Genera @prisma/client basado en schema.prisma
│
├─ 8. npm run build
│  └─ Compila TypeScript → dist/
│
├─ 9. npx ts-node scripts/cleanup-old-jobs.ts
│  └─ DATABASE_URL → Neon
│  └─ DELETE jobs WHERE foundAt < 30 days ago
│  └─ Log: "Deleted X jobs"
│
├─ 10. npm start (ejecuta dist/index.js)
│  └─ DATABASE_URL → Neon  
│  └─ Scrape sitios en sites.csv
│  └─ Guardar jobs nuevos en Neon
│  └─ On error: log y continue (graceful degradation)
│
└─ 11. Finish
```

---

## **Variables de Entorno: GitHub Secrets**

```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

**Flujo de seguridad:**
1. Secret criado en GitHub (Settings → Secrets)
2. GitHub Actions inyecta en una variable de entorno cifrada
3. El code accede via `process.env.DATABASE_URL`
4. La variable se redacta en los logs (GitHub oculta valores de secrets)

**Valor esperado (Neon):**
```
postgresql://user:password@ep-xxxxx.region.neon.tech/dbname?sslmode=require&pgbouncer=true
```

---

## **Connection Pooling: Transaction vs Session**

### Transaction Pooling (RECOMENDADO para GH Actions)

```url
postgresql://...?pgbouncer=true&sslmode=require
```

**Características:**
- ✅ Abre conexión **solo durante la transacción**
- ✅ Cierra después de `COMMIT` o `ROLLBACK`
- ✅ Pool size puede ser muy pequeño (5-10 conexiones)
- ✅ Ideal para workloads cortos y episódicos
- ❌ Algunas características SQL avanzadas no funcionan

**Por qué es ideal para GH Actions:**
- Cada runner de GH Actions es efímero (30 min max)
- El crawler ejecuta 1-2 min máximo
- No necesita mantener conexión abierta
- Múltiples runners pueden ejecutar en paralelo sin "connection limits"

### Session Pooling (NO recomendado para GH Actions)

```url
postgresql://...?pgbouncer=true&pooling_mode=session&sslmode=require
```

**Características:**
- Mantiene conexiones abiertas por usuario
- Mejor para aplicaciones always-on
- Mayor riesgo de "Too many connections" con múltiples runners

---

## **Cleanup Script: Detalles**

### Ubicación
[`scripts/cleanup-old-jobs.ts`](scripts/cleanup-old-jobs.ts)

### Lógica
```typescript
const thirtyDaysAgo = subDays(new Date(), 30);
const result = await prisma.job.deleteMany({
  where: {
    foundAt: { lt: thirtyDaysAgo }
  }
});
```

### Cuándo ejecuta
- **Timing:** Antes del crawler (paso 9 en el workflow)
- **Frecuencia:** Cada ejecución del workflow (diariamente a 08:00 UTC)
- **Impacto:** Mantiene BD sin crecer indefinidamente

### Ejemplo de output
```
[Cleanup] Starting cleanup of jobs older than 30 days...
[Cleanup] ✅ Successfully deleted 15 jobs older than 30 days
```

---

## **Parámetros Neon: Explicación**

### URL de Conexión
```
postgresql://
neondb_owner:XXXXX
@ep-xxxxx.us-east-1.neon.tech  ← Endpoint único por proyecto
/neondb                         ← Database name
?sslmode=require                ← SSL obligatorio
&pgbouncer=true                 ← Activa pooler
```

### `sslmode=require`
- ✅ Neon **requiere SSL** (no permite conexiones plaintext)
- GitHub Actions + Neon automáticamente usan HTTPS

### `pgbouncer=true`
- Equivalente a usar el endpoint **"Pooler"** en Neon dashboard
- Activar Transaction pooling

### ¿Dónde obtenerlo?
1. Neon console → Project → Connection
2. Selecciona el branch (main, dev, etc.)
3. Dropdown donde dice "Role:", selecciona tu role (ej: neondb_owner)
4. Botón "Pooler" → "Transaction"
5. Copia la URL completa

---

## **Decisiones de Arquitectura**

| Decisión | Razón |
|----------|-------|
| **PostgreSQL** | Escalable, soporta concurrencia, Neon gratuito |
| **Transaction Pooling** | Evita "Too many connections", ideal para runners efímeros |
| **npm ci vs npm install** | Determinista y más rápido en CI/CD |
| **Caché persistente** | npm caché ahorra ~1 min/ejecución; Playwright caché ahorra ~2-3 min/ejecución |
| **Cleanup previo** | Previene crecimiento infinito de la BD |
| **Compilación TS** | `npm run build && npm start` más rápido que `ts-node src/index.ts` en prod |
| **Headless: true** | Ya configurado, no requiere X11/display en GitHub runners |
| **Cleanup: 30 días** | Balance entre mantener data histórica y no llenar la BD |

---

## **Monitoreo y Logs**

### En GitHub Actions
- Ve a: Repository → Actions → "Job Web Scraper"
- Click en la ejecución más reciente
- Cada step muestra logs en tiempo real
- Los secrets se redactan automáticamente

### Logs del Crawler
El step "Run crawler" mostrará:
```
[INFO] === Job Web Crawler Started ===
[INFO] Configuration:
[INFO]   - Days to check: 7
[INFO]   - CSV file: ./sites.csv
[INFO] Processing site: https://getonbrd.com/...
[INFO] Scraped 5 jobs, saved 3
[INFO] === Job Web Crawler Completed ===
```

### Monitoreo en Neon
- Dashboard → SQL Editor
- Query: `SELECT COUNT(*) as total_jobs FROM jobs;`
- Query: `SELECT COUNT(*) as today FROM jobs WHERE DATE(foundAt) = CURRENT_DATE;`

---

## **Performance**

### Primera ejecución (sin caché)
```
npm install + Playwright install + Build + Cleanup + Crawler = ~4-5 minutos
```

### Segunda+ ejecución (con caché)
```
Reuse cache + Build + Cleanup + Crawler = ~1-2 minutos
```

### Desglose típico (con caché):
- npm ci: 15 segundos
- Playwright install: 30 segundos (caché)
- Prisma generate: 5 segundos
- Build TypeScript: 10 segundos
- Cleanup: 5 segundos
- Crawler (5 sitios): 30-60 segundos (incluye esperas entre sitios)
- **Total: ~2 minutos**

---

## **Seguridad**

✅ **Best Practices Implementadas:**

1. **Secrets** - DATABASE_URL no visible en logs
2. **SSL** - Neon requiere `sslmode=require` (obligatorio)
3. **Connection Pooling** - Evita conexiones abusivas
4. **No hardcoding** - Env vars via GitHub Secrets
5. **Error logging** - Logs sin exponer credenciales
6. **Graceful errors** - Un sitio fallido no detiene el crawler

⚠️ **Consideraciones:**

- Neon proporciona una URL unique por proyecto
- GitHub Secrets están encriptados at-rest
- GitHub Actions no expone secrets en outputs por defecto
- No dejar la URL de DATABASE_URL en el repo público

---

## **FAQ Técnicas**

**P: ¿Qué pasa si la BD no existe cuando corre el workflow?**  
R: Si no ejecutaste las migraciones en Neon, fallaré. Solución: Hacer `npm run prisma:migrate` localmente una sola vez con DATABASE_URL apuntando a Neon.

**P: ¿Puedo ejecutar múltiples crawlers en paralelo?**  
R: Sí, gracias a Transaction Pooling. Máximo ~5-10 runners simultáneos sin problemas de conexión.

**P: ¿La cleanup es obligatoria?**  
R: No, es opcional. Puedes comentar el paso en el workflow si quieres mantener toda la data histórica.

**P: ¿Playwright consume mucha memoria?**  
R: GitHub Actions runner tiene 7GB RAM. Para 5 sitios seriales: ~200-300MB (está bien).

**P: ¿Cómo cancelo una ejecución?**  
R: En GitHub Actions → click en la ejecución en curso → "Cancel workflow run".

---

## **Próxima Optimización**

Posibles mejoras futuras:

- [ ] Batch database writes (n jobs por transacción vs 1)
- [ ] Parallel site scraping (async Promise.all())
- [ ] Notificaciones por Slack/Email en caso de error
- [ ] Métricas: Prometheus/CloudWatch de jobs encontrados
- [ ] Cache de resultados para evitar re-scraping mismo día
- [ ] API endpoint para consultar jobs (Express server)


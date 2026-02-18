# 🔧 Setup: GitHub Actions + Neon.tech

Esta guía te ayudará a configurar completamente la automatización del crawler con GitHub Actions y Neon.tech (PostgreSQL).

---

## **Fase 1: Preparar Neon.tech**

### Paso 1: Crear una base de datos en Neon

1. Ve a [https://console.neon.tech](https://console.neon.tech) (o crea una cuenta si no tienes)
2. Crea un nuevo proyecto (Project)
3. Selecciona:
   - **Region:** Elige la más cercana a tu ubicación (ej: `us-east-1` si usa GH Actions)
   - **Database name:** `jobs` (o el nombre que prefieras)
4. Click en "Create project"

### Paso 2: Obtener la URL de Connection Pooling (Transaction)

1. En el dashboard de Neon, ve a tu proyecto
2. En la sección de "Connection", verás varias opciones:
   - **Direct connection** (evitar)
   - **Pooler connection** (usar ESTA)
3. Selecciona el **Pooler** y asegúrate de que el dropdown muestra **"Transaction"** mode
4. Copia la URL completa. Lucirá así:
   ```
   postgresql://neondb_owner:XXXXXXXX@ep-xxxxx.region.neon.tech/neondb?sslmode=require&pgbouncer=true
   ```

⚠️ **IMPORTANTE:** 
- `?sslmode=require` → SSL obligatorio (Neon lo requiere)
- `?pgbouncer=true` → Activa Transaction Pool (ideal para GitHub Actions)
- **NO cambies esta URL** en tu `.env` local, solo úsala en GitHub Secrets

### Paso 3: Validar la conexión (opcional, local)

```bash
# Actualiza temporalmente .env:
DATABASE_URL="postgresql://neondb_owner:XXXXXXXX@ep-xxxxx.region.neon.tech/neondb?sslmode=require&pgbouncer=true"

# Genera cliente Prisma
npm run prisma:generate

# Crea la estructura base de datos en Neon (ESTO SOLO CORRE UNA VEZ)
npm run prisma:migrate

# Con esto se crea la tabla "jobs" en Neon

# Luego restaura .env a SQLite si quieres seguir desarrollando localmente:
DATABASE_URL="file:./prisma/dev.db"
```

---

## **Fase 2: Configurar GitHub Secrets**

### Paso 1: Ir a GitHub

1. Ve a tu repositorio en GitHub
2. Navega a: **Settings** → **Secrets and variables** → **Actions**
3. Click en **"New repository secret"**

### Paso 2: Crear el Secret DATABASE_URL

1. **Name:** `DATABASE_URL`
2. **Value:** Pega la URL completa de Neon que copiaste en Fase 1, Paso 2
   - Ej: `postgresql://neondb_owner:XXXXXXXX@ep-xxxxx.region.neon.tech/neondb?sslmode=require&pgbouncer=true`
3. Click en **"Add secret"**

✅ Ahora GitHub Actions tendrá acceso a la URL de la base de datos sin exponerla en el código.

---

## **Fase 3: Verificar el Workflow**

### Paso 1: Prueba manual del workflow

1. Ve a tu repositorio → **Actions**
2. Busca el workflow llamado **"Job Web Scraper"**
3. Click en el workflow
4. Click en **"Run workflow"** → **"Run workflow"** (botón azul)

### Paso 2: Monitorear la ejecución

1. El workflow comenzará a ejecutarse
2. Verás los pasos en orden:
   - ✅ Checkout code
   - ✅ Setup Node.js
   - ✅ Cache npm / Playwright
   - ✅ Install dependencies
   - ✅ Install Playwright browsers
   - ✅ Generate Prisma Client
   - ✅ Build TypeScript
   - ✅ Cleanup old jobs (0 jobs en primera ejecución)
   - ✅ Run crawler
3. Si todo es verde ✅, ¡el crawler executó exitosamente en Neon!

### Paso 3: Verificar datos en Neon

1. Ve al dashboard de Neon
2. Click en **"SQL Editor"**
3. Ejecuta:
   ```sql
   SELECT COUNT(*) as total_jobs FROM jobs;
   SELECT * FROM jobs LIMIT 10;
   ```
4. Deberías ver los jobs scraped 🎉

---

## **Fase 4: Configurar la ejecución automática**

### Paso 1: Verificar el schedule

El workflow está configurado para ejecutarse **diariamente a las 08:00 UTC**.

Si quieres cambiar la hora, edita [`.github/workflows/scraper.yml`](.github/workflows/scraper.yml):

```yaml
on:
  schedule:
    - cron: '0 8 * * *'  # Cambia estos números
    # Formato: 'minuto hora dia mes dayofweek'
    # Ej: '30 14 * * 1' = 14:30 UTC todos los lunes
```

### Paso 2: Verificar que corre automáticamente

- El workflow correrá automáticamente cada día a la hora configurada
- Puedes ver el historial en **Actions** → **Job Web Scraper**
- GitHub enviará notificaciones por email si falla (opcional, configurable)

---

## **Troubleshooting**

| Problema | Solución |
|----------|----------|
| ❌ "Error: Invalid DATABASE_URL" | Verifica que el Secret está configurado correctamente en GitHub. Compara con la URL de Neon. |
| ❌ "Too many connections" | Usar Transaction pooling ya previene esto. Si persiste, aumenta el pool size en Neon dashboard. |
| ❌ "Playwright timeout" | Aumenta el timeout en [src/crawler/jobCrawler.ts](src/crawler/jobCrawler.ts#L93-L94) |
| ❌ "No jobs found" | Revisa que los selectores en `sites.csv` sean correctos. El workflow mostrará los sitios procesados en los logs. |
| ⏳ Workflow muy lento | Cache de npm/Playwright debería activarse en segunda ejecución. Primera vez tarda ~3-4 min. |

---

## **Próximos Pasos**

1. ✅ Migrar data existente de SQLite a Neon (si tienes datos):
   ```bash
   # Exportar de SQLite
   npm run prisma:studio  # Ver data en interfaz gráfica
   
   # Luego migrar manualmente o con script customizado
   ```

2. ✅ Monitorear logs del crawler:
   - Ver en GitHub Actions → "Run crawler" step
   - Cada ejecución mostrará logs de sitios, jobs encontrados, errores

3. ✅ Ajustar `DAYS_TO_CHECK` en [src/index.ts](src/index.ts#L9) si necesitas
   - Default: últimos 7 días

4. ✅ Modificar frecuencia de cleanup en [scripts/cleanup-old-jobs.ts](scripts/cleanup-old-jobs.ts#L11)
   - Default: borrar jobs > 30 días

---

## **Resumen: URLs y Valores**

| Elemento | Dónde obtener |
|----------|--------------|
| **Neon Project URL** | https://console.neon.tech |
| **Pooler Connection** | Neon Dashboard → Connection → Pooler → Transaction |
| **GitHub Secrets** | Repositorio → Settings → Secrets → DATABASE_URL |
| **Workflow File** | [`.github/workflows/scraper.yml`](.github/workflows/scraper.yml) |
| **Cleanup Script** | [`scripts/cleanup-old-jobs.ts`](scripts/cleanup-old-jobs.ts) |

---

**Estado:** ✅ Implementación completada  
**Próximo:** Crear cuenta Neon → Obtener URL → Configurar Secret → Ejecutar workflow


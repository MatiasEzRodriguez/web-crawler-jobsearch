# Guía de Uso Práctico

## 🚀 Primeros Pasos

### 1. Configuración Inicial

```bash
# Instalar dependencias
npm install

# Generar cliente Prisma
npm run prisma:generate

# Crear base de datos
npm run prisma:migrate

# Compilar TypeScript (opcional)
npm run build
```

### 2. Ejecutar el Crawler

```bash
# Opción 1: Modo desarrollo (ts-node)
npm run dev

# Opción 2: Modo producción (JavaScript compilado)
npm run build
npm start
```

## 📋 Configurar Sites a Escanear

### Paso 1: Identificar el Sitio Web

Elige un sitio web con listado de empleos. Ejemplo: LinkedIn, Indeed, portales locales, etc.

### Paso 2: Inspeccionar HTML

Abre el sitio en tu navegador y usa la consola de desarrollador (F12) para encontrar los selectores CSS:

```javascript
// Ejemplo: LinkedIn Jobs
.base-card              // Contenedor del trabajo
.base-search-card__title  // Título del trabajo
.job-search-card__listdate  // Fecha de publicación
a[href*="/jobs/"]       // Link del trabajo
```

### Paso 3: Agregar a sites.csv

Edita `sites.csv` y agrega una nueva línea:

```csv
url,job_card_selector,title_selector,date_selector,link_selector
https://www.linkedin.com/jobs/search?keywords=javascript+junior,.base-card,.base-search-card__title,.job-search-card__listdate,a[href*="/jobs/"]
```

### Paso 4: Ejecutar

```bash
npm run dev
```

## 🔍 Ejemplos de Selectores Reales

### LinkedIn
```csv
https://www.linkedin.com/jobs/search?keywords=javascript,.base-card,.base-search-card__title,.job-search-card__listdate,a.base-card__full-link
```

### Indeed
```csv
https://indeed.com/q-javascript-junior-jobs.html,.jobsearch-ResultsList li,.jcs-JobTitle,span.date,.jcs-JobTitle
```

### Stack Overflow
```csv
https://stackoverflow.com/jobs?q=javascript+junior,.s-post-summary,.s-post-summary--content-title,.s-user-card--time,.s-post-summary a.s-link
```

## 📊 Monitorear Resultados

### Ver trabajos guardados en el navegador

```bash
npm run prisma:studio
```

Abre http://localhost:5555 en tu navegador. Verás una interfaz para:
- Ver todos los trabajos guardados
- Filtrar por empresa, fecha, etc.
- Editar o eliminar registros

### Ver resultados en terminal

```bash
# Ver jobs guardados directamente
sqlite3 prisma/dev.db "SELECT title, company, postedDate FROM jobs LIMIT 10;"

# Contar total de jobs
sqlite3 prisma/dev.db "SELECT COUNT(*) as total FROM jobs;"

# Ver jobs de la última semana
sqlite3 prisma/dev.db "SELECT * FROM jobs WHERE postedDate > datetime('now', '-7 days');"
```

## ⚙️ Personalizar Comportamiento

### Cambiar Rango de Fechas

Edita `src/index.ts` (línea ~10):

```typescript
const DAYS_TO_CHECK = 7;  // Cambiar a 14, 30, etc.
```

### Agregar Nuevas Palabras Clave

Edita `src/utils/filters.ts`:

```typescript
const TECH_KEYWORDS = [
  'node',
  'node.js',
  'nodejs',
  'javascript',
  'typescript',
  'js',
  'ts',          // ← Agregar aquí
];
```

### Cambiar Niveles de Experiencia

Edita `src/utils/filters.ts`:

```typescript
const JUNIOR_LEVELS = [
  'junior',
  'trainee',
  'ssr',
  'semi-senior',
  'associate', // ← Agregar aquí
];
```

### Habilitar Debug Logging

```bash
DEBUG=true npm run dev
```

Verá logs adicionales mostrando:
- Qué trabajos se están filtrando y por qué
- Detalles de parsing de fechas
- Información de selectores

## 🛠️ Solucionar Problemas

### Problema: No se encuentran trabajos

**Solución 1**: Verificar selectores

```javascript
// En consola del navegador
console.log(document.querySelectorAll('.job-card'))  // tu selector
// Debería mostrar array con elementos
```

**Solución 2**: Verificar filtros

```bash
DEBUG=true npm run dev
# Ver qué trabajos se filtran y por qué
```

**Solución 3**: Esperar a que se cargue

Algunos sitios cargan dinámicamente. Playwright espera `networkidle` pero algunos sitios pueden necesitar más tiempo. Edita `src/crawler/jobCrawler.ts`:

```typescript
await page.setDefaultTimeout(20000);  // Aumentar a 20 segundos
```

### Problema: Duplicados en la base de datos

**Solución**: Limpiar base de datos

```bash
# Opción 1: Borrar todos los trabajos
npx prisma db execute --stdin <<< "DELETE FROM jobs;"

# Opción 2: Crear base de datos nueva
rm prisma/dev.db
npm run prisma:migrate
```

### Problema: La aplicación se cuelga

**Soluciones**:

1. Aumentar timeout:
```typescript
// En src/crawler/jobCrawler.ts
await page.setDefaultTimeout(30000);
```

2. Reducir navegadores abiertos (ya está optimizado a 1)

3. Matar proceso:
```bash
# En Windows PowerShell
Stop-Process -Name node -Force

# En Mac/Linux
killall node
```

## 📈 Casos de Uso Reales

### Monitoreo Diario de Empleos

Crear un script cron (Linux/Mac):

```bash
# Editar crontab
crontab -e

# Agregar línea (todos los días a las 8 AM)
0 8 * * * cd /path/to/job-crawler && npm run dev >> logs/crawler.log 2>&1
```

Windows (Programador de Tareas):

1. Abrir "Programador de Tareas"
2. Crear tarea básica
3. Acción: `npm.cmd run dev`
4. Directorio: `C:\path\to\job-crawler`
5. Programar: Diario a las 8:00 AM

### Exportar Datos a CSV

```bash
# Instalar herramienta (una sola vez)
npm install -g sql-bricks-sqlite3

# Exportar a CSV
sqlite3 prisma/dev.db ".mode csv" ".output jobs.csv" "SELECT * FROM jobs;" ".quit"
```

### Procesar en Google Sheets

1. Exportar jobs a CSV
2. Abrir Google Sheets
3. Archivo → Importar → Subir archivo
4. Crear filtros y gráficos

### Enviar Notificaciones por Email

Crear `scripts/notify.js`:

```javascript
const nodemailer = require('nodemailer');
const { PrismaClient } = require('@prisma/client');

async function notifyNewJobs() {
  const prisma = new PrismaClient();
  
  // Obtener trabajos de hoy
  const jobs = await prisma.job.findMany({
    where: {
      postedDate: {
        gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    }
  });

  if (jobs.length === 0) return;

  // Enviar email
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL, pass: process.env.PASSWORD }
  });

  const html = jobs
    .map(job => `<li><a href="${job.url}">${job.title}</a> - ${job.company}</li>`)
    .join('');

  await transporter.sendMail({
    from: process.env.EMAIL,
    to: process.env.NOTIFY_EMAIL,
    subject: `${jobs.length} nuevos trabajos encontrados`,
    html: `<ul>${html}</ul>`
  });

  await prisma.$disconnect();
}

notifyNewJobs();
```

Luego ejecutar después del crawler:

```bash
npm run dev && node scripts/notify.js
```

## 📚 Recursos Útiles

### Documentación

- [Playwright Docs](https://playwright.dev)
- [Prisma Docs](https://www.prisma.io/docs/)
- [date-fns Docs](https://date-fns.org)
- [CSS Selectors](https://www.w3schools.com/cssref/selectors_intro.asp)

### Herramientas Online

- [CSS Selector Finder](https://www.selectorshub.com/css-selector-generator/)
- [RegEx Tester](https://regex101.com)
- [SQLite Browser Online](https://sqlitebrowser.org)

### Inspiración

Portales de empleo populares:
- LinkedIn Jobs
- Indeed
- Stack Overflow Jobs
- GitHub Jobs
- RemoteOK
- Glassdoor
- Portales locales (Computrabajo, Infojobs, etc.)

## ✅ Checklist antes de Producción

- [ ] Verificar `robots.txt` del sitio
- [ ] Revisar Terms of Service
- [ ] Ajustar delay entre sites (respectful scraping)
- [ ] Crear backup de base de datos
- [ ] Configurar logs persistentes
- [ ] Pruebas con múltiples sitios
- [ ] Validar selectores periodicamente
- [ ] Monitorear tasa de errores

## 💡 Consejos Profesionales

1. **Respeta los servidores**: Aumenta delay si el sitio lo pide
2. **Valida selectores frecuentemente**: Los sitios cambian HTML
3. **Backup regular**: Exporta datos regularmente
4. **Prueba selectores primero**: Usa dev tools antes de agregar
5. **Monitorea errores**: Revisa logs para detectar problemas
6. **Documenta fuentes**: Anotea de dónde vienen los datos

---

**Última actualización**: 28 de Enero de 2024

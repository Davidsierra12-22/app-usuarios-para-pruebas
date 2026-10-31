# Informe de pruebas — Taller de gestión de usuarios

> Estado: validación local completada el 31-10-2026. TestSprite queda pendiente de conectar desde el IDE con una API key almacenada localmente; no se inventan resultados de esa herramienta.

**Entorno reproducible:** `npm ci` pasó en `api/` y `web/` sin crear `.env`. En esta máquina, la suite API se verificó con MongoMemoryServer usando como binario temporal el MongoDB 6.0.6 local para evitar esperar una descarga grande. En una máquina sin MongoDB instalado, MongoMemoryServer descarga su binario la primera vez que se ejecuta la suite; el timeout de setup está ampliado y el binario queda en caché.

**Auditoría npm:** API sin vulnerabilidades tras `npm audit fix`; `npm audit --omit=dev` reporta cero vulnerabilidades de producción también para web. Web conserva cinco avisos moderados en dependencias transitivas de desarrollo de Vue Test Utils (`js-beautify`/`glob`/`minimatch`); `npm audit fix --force` propone degradar Vue Test Utils y no se aplicó para evitar introducir un cambio mayor de pruebas.

## 1. Resumen por proyecto y tipo

La estructura final tiene solamente las tres carpetas de suites en cada proyecto: `tests/unitarias/`, `tests/componentes/` y `tests/e2e/`. Las páginas fuente que parecen repetir `api/controllers`, `api/helpers` o `web/src` dentro del HTML de cobertura son páginas de detalle anotadas del reporte de Istanbul, no código de aplicación duplicado; se conservaron porque el índice de cobertura las necesita y la rúbrica pide el archivo HTML con las líneas sin cubrir.

| Proyecto | Categoría | Herramienta | Pruebas | Pasan | Fallan |
|---|---|---|---:|---:|---:|
| API | Unitarias | Vitest | 26 | 26 | 0 |
| API | Componentes / rutas | Vitest + Supertest + MongoMemoryServer | 37 | 37 | 0 |
| API | E2E HTTP | Vitest + fetch + Express + MongoMemoryServer | 3 | 3 | 0 |
| Web | Unitarias | Vitest | 49 | 49 | 0 |
| Web | Componentes/vistas | Vitest + Vue Test Utils | 31 | 31 | 0 |
| Web | E2E navegador | Playwright: setup (1) + 5 flujos en Chromium y Firefox | 11 | 11 | 0 |

**Totales Vitest:** API 66/66; web 80/80. **E2E navegador:** 10/10 flujos, más el setup de sesión (11/11 pruebas reportadas).

## 2. Cobertura

Umbrales requeridos por proyecto: 80% líneas, 80% sentencias, 80% funciones y 70% ramas.

| Proyecto | Líneas | Sentencias | Funciones | Ramas | Resultado |
|---|---:|---:|---:|---:|---|
| API | 88,77% | 87,81% | 90,90% | 85,88% | Cumple |
| Web | 91,84% | 90,51% | 86,52% | 84,87% | Cumple |

HTML y JSON vigentes, además de capturas PNG de resumen y del reporte HTML, se entregan en `evidencias/coverage/api/` y `evidencias/coverage/web/`; ambos resúmenes superan los umbrales de 80/80/80/70. La captura del resumen se genera desde el JSON oficial; no se presenta como captura literal de consola.

## 3. Flujos E2E previstos

### API por HTTP

- Healthcheck, 404 y ruta privada sin token.
- Registro, consulta autenticada del perfil, cambio de contraseña y nuevo login.
- Login de administrador, autorización por rol, CRUD, desactivación y bloqueo de login de la cuenta desactivada.

### Navegador (ambos navegadores)

- Login inválido con mensaje y permanencia en login.
- Registro, rol estándar, perfil, cambio de contraseña, nuevo login y bloqueo del panel admin.
- Admin: alta, búsqueda, edición, borrado confirmado y rechazo de login del usuario desactivado.
- Búsqueda reflejada en URL y navegación de página 1 a 2.
- Restauración de sesión después de recargar y vista 404.

Playwright ejecutó los cinco flujos en Chromium y Firefox con la API real, sin `page.route` para interceptar `/api`, sobre MongoDB local `app-usuarios-e2e`. Guarda cinco capturas PNG por navegador, reporte HTML y trazas/resultados en `evidencias/playwright/`. El setup crea una sola sesión admin reutilizable por `storageState` local y excluido de Git.

## 4. Análisis de fallos y acciones

No se debe cerrar un caso fallido editando solo la expectativa o agregando `.skip`. Para cada fallo se registrará el ID/caso, resultado observado, clasificación (defecto real, requisito/plan ambiguo o entorno), evidencia, decisión, cambio aplicado y resultado de la segunda ejecución. Si no hubo fallos, se consignará explícitamente después de la corrida completa.

| Caso | Descripción | Resultado | Causa | Decisión / corrección | Segunda ejecución |
|---|---|---|---|---|---|
| E2E admin CRUD (primera corrida) | Pruebas paralelas esperaban que el nuevo usuario estuviera en página 1 y que la lista completa quedara vacía | Falló una aserción UI en ambos navegadores | La base E2E persiste datos y el listado pagina; supuesto de test, no defecto de producto | Buscar por email antes de comprobar la fila y verificar que desaparezca solo la cuenta objetivo | Corregido: Playwright 11/11 pasa en Chromium y Firefox |
| Suites finales | Vitest API/web y Playwright | 66/66 API; 80/80 web; 11/11 Playwright | Sin fallos pendientes | Sin `.skip`; las suites se ejecutan sin depender del contenido de otras pruebas | Pasa |

## 5. TestSprite

Estado pendiente de conectar el MCP con una API key almacenada localmente, fuera del repositorio. El PRD que debe revisar TestSprite está en `PRD.md`. Después de la ejecución se anexarán plan, casos, reporte MCP (JSON/HTML/Markdown disponibles), análisis de fallos y comparación con las pruebas manuales en `evidencias/testsprite/api/` y `evidencias/testsprite/web/`. No se registran casos ni hallazgos TestSprite hasta ejecutar el agente real.

## 6. Evidencias esperadas

- Salidas de ejecución `npm test` y `npm run coverage` para API y web.
- `evidencias/coverage/{api,web}/index.html` y `coverage-summary.json`.
- Capturas de Playwright en Chromium y Firefox y su reporte HTML.
- Plan y reportes TestSprite API/web una vez esté configurado.

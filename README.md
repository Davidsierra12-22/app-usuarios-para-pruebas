# Taller de pruebas — Gestión de usuarios

Aplicación de gestión de usuarios con API Express/Mongoose y cliente Vue. El repositorio separa las pruebas en las mismas tres categorías en ambos proyectos:

```text
api/tests/{unitarias,componentes,e2e}/
web/tests/{unitarias,componentes,e2e}/
evidencias/{coverage,playwright,testsprite}/
```

Las pruebas `componentes` de la API cubren rutas, validaciones, middlewares y persistencia mediante Supertest y MongoDB en memoria. Las E2E API recorren HTTP real contra una instancia Express local y MongoDB en memoria. Las E2E web usan Playwright con Chromium y Firefox, levantan API y Vite y hablan con una base MongoDB local aislada llamada `app-usuarios-e2e`.

## Requisitos

- Node.js 20 o superior.
- Para ejecutar unitarias, componentes, cobertura y E2E de la API: no hace falta instalar MongoDB; el primer `npm test` descarga MongoDB 6.0.6 para `mongodb-memory-server-core` (se necesita conexión a internet la primera vez; luego queda en caché).
- Para los E2E web: MongoDB local ejecutándose en `127.0.0.1:27017` y los navegadores Playwright Chromium y Firefox instalados.
- No se requiere crear `.env` para probar. Las pruebas API definen sus variables de test; Playwright inyecta valores exclusivos y apunta solo a `app-usuarios-e2e`.

## Instalar

Desde cada carpeta, en una terminal:

```text
cd api
npm ci
cd ../web
npm ci
npx playwright install chromium firefox
```

## API

Ejecutar desde `api/`:

```text
npm test
npm run test:unitarias
npm run test:componentes
npm run test:e2e
npm run coverage
```

`npm test` ejecuta las tres categorías. La suite usa `mongodb-memory-server`, inicia y limpia la base por prueba, y no necesita `.env`. Para desarrollo normal sí se requiere configurar `api/.env` a partir de `api/.env.example`.

`npm run seed` **borra y vuelve a cargar** la colección de la base configurada; no se debe apuntar a datos valiosos.

## Web

Ejecutar desde `web/`:

```text
npm test
npm run test:unitarias
npm run test:componentes
npm run coverage
npm run evidence:coverage
npm run test:e2e
```

`npm test` ejecuta Vitest (unitarias y componentes). `npm run test:e2e` levanta la API en el puerto 3000 con `MONGODB_CNX=mongodb://127.0.0.1:27017/app-usuarios-e2e`, y Vite en el 5173. **No usa mocks de la API ni ejecuta `seed`**. La base E2E es distinta a la base normal de desarrollo. Si el puerto 3000 o 5173 está ocupado, detén ese proceso antes de ejecutar Playwright.

Playwright guarda el estado autenticado localmente en `web/tests/e2e/.auth/`, excluido de Git, y produce el reporte HTML y capturas de flujos en `evidencias/playwright/`; los resultados y trazas temporales se ignoran. No copies `storageState` al repositorio: contiene el token de sesión.

## Cobertura y evidencias

Los comandos `npm run coverage` de API y web guardan HTML y JSON en:

- `evidencias/coverage/api/` (`index.html`, `coverage-summary.json`).
- `evidencias/coverage/web/` (`index.html`, `coverage-summary.json`).

El subdirectorio `api/` dentro del reporte de API y `src/` dentro del reporte web contienen páginas HTML anotadas que genera el reporter. **No son copias de la aplicación ni código ejecutable duplicado**: permiten abrir cada archivo y ver sus líneas cubiertas y no cubiertas, como pide la rúbrica. No se deben borrar por separado porque el índice HTML enlaza a esas páginas.

Después de ejecutar cobertura en ambos proyectos, ejecuta `npm run evidence:coverage` desde `web/` para producir `resumen.png` (render del JSON verificado) y `reporte-html.png` en cada carpeta. Son capturas del reporte calculado; conserva además la salida real de la terminal en el informe/captura que solicita el instructor.

Las carpetas de evidencia están permitidas en Git. `node_modules`, `.env`, `coverage/` temporal, reportes Playwright temporales y claves se excluyen. Consulta [INFORME_PRUEBAS.md](INFORME_PRUEBAS.md) para resultados, análisis y pendientes.

## TestSprite

1. En VS Code abre **MCP: Add Server** y agrega un servidor local **stdio** usando `npx` y el paquete `@testsprite/testsprite-mcp@latest` (usa `-y` como argumento de npx).
2. Configura la variable `API_KEY` en la configuración privada/local del servidor o IDE. No escribas la clave en `.vscode/mcp.json` versionado, `.env`, capturas, el chat ni archivos del repositorio.
3. Reinicia/activa el servidor MCP y comprueba que las herramientas TestSprite aparecen en el chat.
4. Levanta una instancia de prueba desechable de MongoDB, API (3000) y web (5173). No ejecutes `npm run seed` hasta confirmar que `MONGODB_CNX` apunta a una base desechable: el seed borra la colección.
5. Pide al agente TestSprite: “Prueba este proyecto con TestSprite. Lee PRD.md, genera primero el plan para API y web, y espera a que yo lo revise antes de ejecutar”. Revisa que incluya roles, errores 401/403, reglas de contraseñas, borrado lógico, navegación, búsqueda/paginación y cambio de contraseña.
6. Después de aprobar el plan, ejecuta API y web; analiza cada fallo como defecto, ambigüedad del requisito/plan o problema del entorno. Corrige defectos reales y repite la prueba. No marques casos como omitidos para obtener un resultado verde.
7. Exporta plan, casos, reporte MCP y análisis a `evidencias/testsprite/api/` y `evidencias/testsprite/web/`; actualiza [INFORME_PRUEBAS.md](INFORME_PRUEBAS.md). La guía local está en [evidencias/testsprite/README.md](evidencias/testsprite/README.md).

# Evidencias TestSprite

La clave de TestSprite se configura como secreto local del MCP del IDE; no la guardes aquí ni la compartas en chat.

1. Inicia la base E2E y la aplicación según el README del repositorio.
2. Desde VS Code pide al agente TestSprite que evalúe el proyecto usando `PRD.md`; revisa el plan antes de ejecutar.
3. Ejecuta las suites API y web por separado si TestSprite pregunta por el tipo de proyecto o URL.
4. Exporta el plan, los casos generados, el reporte de ejecución y cualquier `TestSprite_MCP_Test_Report.md/.html` a los directorios `api/` y `web/` de esta carpeta.
5. Completa para cada fallo la tabla (caso, resultado, causa, decisión, segunda ejecución) en `INFORME_PRUEBAS.md`. Distingue defectos del código de errores del plan y del entorno. No uses `.skip` para silenciar un caso.

Estructura esperada:

```text
evidencias/testsprite/
├── api/   # plan, pruebas, reporte y análisis de API
└── web/   # plan, pruebas, reporte y análisis de web
```

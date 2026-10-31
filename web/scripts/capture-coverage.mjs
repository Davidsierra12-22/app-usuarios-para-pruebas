import { mkdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium } from '@playwright/test'

const repoRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)))
const projects = ['api', 'web']
const browser = await chromium.launch({ headless: true })

try {
    for (const project of projects) {
        const reportDir = resolve(repoRoot, 'evidencias', 'coverage', project)
        const summaryPath = resolve(reportDir, 'coverage-summary.json')
        const reportPath = resolve(reportDir, 'index.html')
        const summary = JSON.parse(await readFile(summaryPath, 'utf8'))
        const total = summary.total
        const metrics = [
            ['Líneas', total.lines.pct],
            ['Sentencias', total.statements.pct],
            ['Funciones', total.functions.pct],
            ['Ramas', total.branches.pct],
        ]
        const html = `<!doctype html>
<html lang="es"><meta charset="utf-8"><title>Cobertura ${project.toUpperCase()}</title>
<style>
*{box-sizing:border-box}body{margin:0;padding:52px;background:#f4f7fb;color:#142235;font:20px/1.5 Segoe UI,Arial,sans-serif}
main{max-width:1100px;margin:auto;background:#fff;border-radius:22px;padding:48px;box-shadow:0 18px 60px #10243b1c}
h1{font-size:38px;margin:0 0 8px}p{color:#5d6b7b;margin:0 0 34px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
article{border:1px solid #e4eaf1;border-radius:15px;padding:24px}.label{font-size:17px;color:#5d6b7b}.value{font-size:38px;font-weight:700;color:#16803c;margin-top:8px}
footer{margin-top:32px;padding:18px 22px;background:#eaf7ef;border-radius:12px;color:#14532d;font-weight:600}
</style><main><h1>Reporte de cobertura · ${project.toUpperCase()}</h1>
<p>Resultado generado desde el JSON oficial de Vitest. Fecha: ${new Date().toLocaleString('es')}</p>
<section class="grid">${metrics.map(([label, value]) => `<article><div class="label">${label}</div><div class="value">${Number(value).toFixed(2)}%</div></article>`).join('')}</section>
<footer>Umbrales requeridos: 80% líneas, sentencias y funciones · 70% ramas. Resultado: ${total.lines.pct >= 80 && total.statements.pct >= 80 && total.functions.pct >= 80 && total.branches.pct >= 70 ? 'CUMPLE' : 'NO CUMPLE'}.</footer>
</main></html>`
        const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
        await page.setContent(html, { waitUntil: 'load' })
        await page.screenshot({ path: resolve(reportDir, 'resumen.png'), fullPage: true })
        await page.goto(pathToFileURL(reportPath).href, { waitUntil: 'load' })
        await page.screenshot({ path: resolve(reportDir, 'reporte-html.png'), fullPage: true })
        await page.close()
        await mkdir(reportDir, { recursive: true })
        console.log(`Capturas de cobertura guardadas en evidencias/coverage/${project}/`)
    }
} finally {
    await browser.close()
}

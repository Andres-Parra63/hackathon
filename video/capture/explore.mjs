// Read-only tour of the running prototype: logs in with the seed demo buttons and
// screenshots every route. Nothing is submitted except the demo sign-in.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = process.env.APP_URL ?? 'http://localhost:5173'
const OUT = new URL('../public/shots/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')
mkdirSync(OUT, { recursive: true })

const tours = [
  { as: null, routes: ['/', '/mapa', '/registro', '/ingreso'] },
  { as: 'Entrar como organización', routes: ['/panel', '/panel/mapa', '/panel/actividades', '/panel/emergencia', '/panel/convocatorias', '/panel/historial', '/panel?nueva=1'] },
  { as: 'Entrar como voluntario', routes: ['/voluntario', '/voluntario/turnos', '/voluntario/horas', '/voluntario/perfil'] },
  { as: 'Entrar como administrador', routes: ['/admin', '/admin/organizaciones', '/admin/emergencias', '/admin/habilidades'] },
]

const browser = await chromium.launch()
for (const tour of tours) {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, locale: 'es-CO' })
  const page = await ctx.newPage()
  const errors = []
  page.on('response', (r) => { if (r.url().includes(':8010') && r.status() >= 400) errors.push(`${r.status()} ${r.url()}`) })
  if (tour.as) {
    await page.goto(`${BASE}/ingreso`)
    await page.getByRole('button', { name: tour.as }).click()
    await page.waitForURL((u) => !u.pathname.startsWith('/ingreso'), { timeout: 15000 })
  }
  for (const route of tour.routes) {
    await page.goto(BASE + route)
    await page.waitForLoadState('networkidle').catch(() => {})
    await page.waitForTimeout(2500)
    const name = (tour.as ? tour.as.split(' ').pop() : 'publico') + route.replace(/[/?=]/g, '_')
    await page.screenshot({ path: `${OUT}${name}.png` })
    console.log('shot', name, 'url', page.url())
  }
  if (errors.length) console.log('API errors:', errors)
  await ctx.close()
}
await browser.close()

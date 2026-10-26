// Step-by-step stills of the real prototype for the demo scenes.
// Forms are filled with fictional data but never submitted, so the database is not modified.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = process.env.APP_URL ?? 'http://localhost:5173'
const API = process.env.API_URL ?? 'http://localhost:8010'
const OUT = new URL('../public/flows/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
const newPage = async () => {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, locale: 'es-CO' })
  return ctx.newPage()
}
const settle = (page, ms = 1200) => page.waitForTimeout(ms)
const shot = async (page, name, opts = {}) => {
  await page.screenshot({ path: `${OUT}${name}.png`, ...opts })
  console.log('shot', name)
}
const signIn = async (page, button) => {
  await page.goto(`${BASE}/ingreso`)
  await settle(page, 1500)
  await shot(page, `login_${button.split(' ').pop()}_0`)
  await page.getByRole('button', { name: button }).click()
  await page.waitForURL((u) => !u.pathname.startsWith('/ingreso'), { timeout: 15000 })
  await settle(page, 2500)
}

// 1. Volunteer sign-up (not submitted)
{
  const page = await newPage()
  await page.goto(`${BASE}/registro`)
  await settle(page, 2500)
  await shot(page, 'signup_0')
  const inputs = page.locator('form input:visible')
  await inputs.nth(0).fill('Laura Gómez (demo)')
  await inputs.nth(1).fill('laura@correo.demo')
  await settle(page, 400)
  await shot(page, 'signup_1_name')
  for (const skill of ['Logística', 'Primeros auxilios', 'Cocina']) {
    await page.getByRole('button', { name: skill, exact: true }).first().click().catch(() =>
      page.getByText(skill, { exact: true }).first().click())
    await settle(page, 350)
  }
  await shot(page, 'signup_2_skills')
  const cells = page.locator('.availability button, [class*="availability"] button, [class*="Availability"] button')
  const n = await cells.count()
  for (const i of [7, 14, 15, 17].filter((i) => i < n)) { await cells.nth(i).click(); await settle(page, 250) }
  await shot(page, 'signup_3_availability')
  await page.mouse.wheel(0, 700)
  await settle(page, 1500)
  await shot(page, 'signup_4_zone')
  await page.mouse.wheel(0, 900)
  await settle(page, 1500)
  await shot(page, 'signup_5_consent')
  await page.context().close()
}

// 2. Organization: drawer, map filters, emergency, calls
{
  const page = await newPage()
  await signIn(page, 'Entrar como organización')
  await shot(page, 'org_panel')
  await page.goto(`${BASE}/panel?nueva=1`)
  await settle(page, 2000)
  await page.locator('aside, [role="dialog"]').getByText('Logística', { exact: true }).first().click()
  await settle(page, 1500)
  await shot(page, 'org_drawer_logistica')
  await page.goto(`${BASE}/panel/mapa`)
  await settle(page, 3500)
  await shot(page, 'org_map_all')
  for (const [label, name] of [[/^Logística · \d+/, 'org_map_skill'], [/^Disponibles en la franja/, 'org_map_available']]) {
    await page.getByRole('button', { name: label }).first().click().catch(() => page.getByText(label).first().click())
    await settle(page, 1800)
    await shot(page, name)
  }
  await page.goto(`${BASE}/panel/emergencia`)
  await settle(page, 2500)
  await shot(page, 'org_emergency')
  await page.goto(`${BASE}/panel/convocatorias`)
  await settle(page, 2500)
  await shot(page, 'org_calls')
  await page.goto(`${BASE}/panel/actividades`)
  await settle(page, 2500)
  await shot(page, 'org_activities')
  await page.context().close()
}

// 3. Volunteer area and public map
{
  const page = await newPage()
  await signIn(page, 'Entrar como voluntario')
  await shot(page, 'vol_home')
  await page.goto(`${BASE}/voluntario/turnos`)
  await settle(page, 2500)
  await shot(page, 'vol_shifts')
  await page.goto(`${BASE}/voluntario/perfil`)
  await settle(page, 2500)
  await shot(page, 'vol_profile')
  await page.goto(`${BASE}/mapa`)
  await settle(page, 3500)
  await shot(page, 'public_map')
  await page.context().close()
}

// 4. Admin: verification and double confirmation
{
  const page = await newPage()
  await signIn(page, 'Entrar como administrador')
  await shot(page, 'admin_home')
  for (const r of ['organizaciones', 'emergencias']) {
    await page.goto(`${BASE}/admin/${r}`)
    await settle(page, 2500)
    await shot(page, `admin_${r}`)
  }
  await page.context().close()
}

// 5. FastAPI interactive docs
{
  const page = await newPage()
  await page.goto(`${API}/docs`)
  await settle(page, 3500)
  await shot(page, 'api_docs')
  await page.mouse.wheel(0, 1400)
  await settle(page, 800)
  await shot(page, 'api_docs_2')
  await page.context().close()
}
await browser.close()

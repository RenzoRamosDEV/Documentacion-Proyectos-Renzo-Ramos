// Comprueba que la biblioteca está en orden antes de publicarla:
// cada ficha de biblioteca/index.html coincide con la documentación de su proyecto
// (secciones, capturas, tecnologías, miniaturas y mosaico) y nada se ha quedado atrás.
// Se ejecuta en local (`node .github/scripts/comprobar-biblioteca.mjs`) y en el workflow de Pages.
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const errors = []
const warnings = []
const read = (path) => readFileSync(join(root, path), 'utf8')
const exists = (path) => existsSync(join(root, path))
const count = (text, needle) => text.split(needle).length - 1
const attr = (tag, name) => (tag.match(new RegExp(`${name}="([^"]*)"`)) || [])[1]
const plain = (html) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .toLowerCase()

const library = read('biblioteca/index.html')
const readme = read('README.md')

const versions = [...new Set([...library.matchAll(/\?v=(\d+)"/g)].map((m) => m[1]))]
if (versions.length !== 1) errors.push(`biblioteca/index.html: todos los ?v= deben ser iguales (hay ${versions.join(', ') || 'ninguno'})`)

const grid = library.match(/<div class="mosaic__grid" data-mosaic>([\s\S]*?)<\/div>/)
if (!grid) errors.push('biblioteca/index.html: falta el contenedor del mosaico ([data-mosaic])')
else if (/<img/.test(grid[1])) errors.push('biblioteca/index.html: el mosaico no lleva <img> en el HTML; se monta desde las fichas (data-mosaic)')

const cards = library.split('<li data-book').slice(1).map((part) => part.slice(0, part.indexOf('</ul>')))
if (cards.length === 0) errors.push('biblioteca/index.html: no hay ninguna ficha (<li data-book>)')

const techsSeen = new Map()
const mosaicUsed = new Set()
const thumbsUsed = new Set()
let totalSections = 0
let totalCaptures = 0

for (const part of cards) {
  const tag = part.slice(0, part.indexOf('>'))
  const project = (part.match(/href="\.\.\/([a-z0-9-]+)\/"/) || [])[1]
  if (!project) {
    errors.push('Una ficha no enlaza a ninguna carpeta ../<proyecto>/')
    continue
  }
  const where = `ficha de ${project}`
  const docPath = `${project}/index.html`
  if (!exists(docPath)) {
    errors.push(`${where}: no existe ${docPath}`)
    continue
  }
  const doc = read(docPath)

  const kind = attr(tag, 'data-kind')
  if (!['escritorio', 'web'].includes(kind)) errors.push(`${where}: data-kind debe ser "escritorio" o "web" (es "${kind}")`)

  const sections = count(doc, 'class="doc-section"')
  const declaredSections = Number(attr(tag, 'data-sections'))
  if (declaredSections !== sections) errors.push(`${where}: data-sections="${declaredSections}" pero ${docPath} tiene ${sections} secciones`)
  const visible = (part.match(/data-sections-text>(\d+) secciones</) || [])[1]
  if (visible === undefined) errors.push(`${where}: falta <span data-sections-text>N secciones</span>`)
  else if (Number(visible) !== sections) errors.push(`${where}: el texto dice "${visible} secciones" pero son ${sections}`)
  totalSections += sections

  const captures = count(doc, '<figure class="shot"')
  const declaredCaptures = Number(attr(tag, 'data-captures'))
  if (declaredCaptures !== captures) errors.push(`${where}: data-captures="${declaredCaptures}" pero ${docPath} tiene ${captures} capturas`)
  totalCaptures += captures

  if (/<ul class="chips"/.test(part)) errors.push(`${where}: la ficha no lleva tags de tecnologías; van en data-techs y en el Stack de la documentación`)

  const stack = doc.match(/<section id="stack"[\s\S]*?<\/section>/)
  if (!stack) errors.push(`${docPath}: falta la sección id="stack" «Stack tecnológico»`)
  if (!doc.includes('href="#stack"')) errors.push(`${docPath}: el índice no enlaza a #stack`)
  const stackText = stack ? plain(stack[0]) : ''
  const techs = (attr(tag, 'data-techs') || '').split(',').map((t) => t.trim()).filter(Boolean)
  if (techs.length < 10) errors.push(`${where}: data-techs tiene ${techs.length} herramientas; deben ir todas las del Stack (mínimo 10)`)
  const local = new Set()
  for (const tech of techs) {
    const key = tech.toLowerCase()
    if (local.has(key)) errors.push(`${where}: "${tech}" está repetida en data-techs`)
    local.add(key)
    if (stack && !stackText.includes(key)) errors.push(`${where}: "${tech}" no aparece en el Stack tecnológico de ${docPath} (usa el mismo nombre en los dos sitios)`)
    if (!techsSeen.has(key)) techsSeen.set(key, tech)
  }

  for (const variant of ['light-640', 'light-1280', 'dark-640', 'dark-1280']) {
    const file = `biblioteca/assets/thumbs/${project}-${variant}.webp`
    thumbsUsed.add(`${project}-${variant}.webp`)
    if (!exists(file)) errors.push(`${where}: falta la miniatura ${file}`)
    if (!part.includes(`assets/thumbs/${project}-${variant}.webp`)) errors.push(`${where}: la ficha no usa ${file}`)
  }

  const mosaic = (attr(tag, 'data-mosaic') || '').split(',').map((t) => t.trim()).filter(Boolean)
  if (mosaic.length < 3) errors.push(`${where}: data-mosaic tiene ${mosaic.length} capturas; pon al menos 3 del proyecto`)
  for (const name of mosaic) {
    if (!name.startsWith(`${project}-`)) errors.push(`${where}: la captura del mosaico "${name}" debe llamarse ${project}-<nombre>`)
    if (!exists(`biblioteca/assets/mosaic/${name}.webp`)) errors.push(`${where}: falta biblioteca/assets/mosaic/${name}.webp`)
    if (mosaicUsed.has(name)) errors.push(`${where}: "${name}" está repetida en el mosaico`)
    mosaicUsed.add(name)
  }

  if (!doc.includes('class="library-bar"')) errors.push(`${docPath}: falta la franja de la biblioteca (nav.library-bar)`)
  if (!doc.includes('href="../biblioteca/"')) errors.push(`${docPath}: la franja no enlaza a ../biblioteca/`)
  const nav = doc.match(/<nav class="site-nav"[\s\S]*?<\/nav>/)
  if (nav && /Documentación<\/a>|>Biblioteca<\/a>/.test(nav[0])) errors.push(`${docPath}: la barra del proyecto no lleva «Documentación» ni «Biblioteca» (eso va en la franja)`)

  if (!readme.includes(`/${project}/)`)) errors.push(`README.md: la tabla «Proyectos» no incluye ${project}`)
}

for (const file of readdirSync(join(root, 'biblioteca/assets/mosaic'))) {
  if (!mosaicUsed.has(file.replace(/\.webp$/, ''))) warnings.push(`biblioteca/assets/mosaic/${file} no lo usa ninguna ficha`)
}
for (const file of readdirSync(join(root, 'biblioteca/assets/thumbs'))) {
  if (!thumbsUsed.has(file)) warnings.push(`biblioteca/assets/thumbs/${file} no lo usa ninguna ficha`)
}

for (const warning of warnings) console.log(`aviso: ${warning}`)
if (errors.length) {
  for (const error of errors) console.error(`error: ${error}`)
  console.error(`\n${errors.length} error(es). La biblioteca no está en orden.`)
  process.exit(1)
}
console.log(`Biblioteca en orden: ${cards.length} proyectos · ${totalSections} secciones · ${totalCaptures} capturas · ${techsSeen.size} tecnologías · ${mosaicUsed.size} capturas en el mosaico`)

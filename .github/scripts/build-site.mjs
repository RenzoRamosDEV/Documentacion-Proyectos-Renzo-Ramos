// Monta el sitio publicable en _site/: lo usan el workflow de GitHub Pages y Vercel.
//   - copia cada carpeta visible de la raíz (biblioteca/ y una por proyecto)
//   - genera la portada raíz (noindex, redirige a biblioteca/)
//   - genera sitemap.xml con la fecha del último commit de cada carpeta (o la de hoy si no hay git)
//   - genera biblioteca/llms-full.txt y biblioteca/md/<proyecto>.md con build-llms.mjs
// Uso: node .github/scripts/build-site.mjs   (desde la raíz del repo; SITE_URL sobrescribe la URL pública)
import { cpSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { execFileSync, spawnSync } from 'node:child_process'
import { join } from 'node:path'

const root = process.cwd()
const out = join(root, '_site')
const SITE = (process.env.SITE_URL || 'https://docs.portafolio-renzoramos.com').replace(/\/$/, '')

rmSync(out, { recursive: true, force: true })
mkdirSync(out)

const dirs = readdirSync(root).filter((name) => !name.startsWith('.') && name !== '_site' && name !== 'node_modules' && statSync(join(root, name)).isDirectory())
for (const dir of dirs) cpSync(join(root, dir), join(out, dir), { recursive: true })

writeFileSync(
  join(out, 'index.html'),
  `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Biblioteca · Documentación de los proyectos de Renzo Ramos</title>
    <meta name="robots" content="noindex" />
    <meta http-equiv="refresh" content="0; url=biblioteca/" />
    <link rel="canonical" href="${SITE}/biblioteca/" />
  </head>
  <body>
    <p><a href="biblioteca/">Ir a la biblioteca</a></p>
  </body>
</html>
`,
)

function lastmod(dir) {
  const git = spawnSync('git', ['log', '-1', '--format=%cI', '--', dir], { cwd: root, encoding: 'utf8' })
  const date = git.status === 0 ? git.stdout.trim() : ''
  return date || new Date().toISOString()
}
const urls = dirs.map((dir) => `  <url><loc>${SITE}/${dir}/</loc><lastmod>${lastmod(dir)}</lastmod><priority>${dir === 'biblioteca' ? '1.0' : '0.8'}</priority></url>`)
writeFileSync(join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`)

execFileSync(process.execPath, [join(root, '.github/scripts/build-llms.mjs'), join(out, 'biblioteca')], { stdio: 'inherit' })

console.log(`Sitio montado en _site/ para ${SITE}: ${dirs.join(', ')} + index.html + sitemap.xml`)

// Convierte las cinco páginas (biblioteca y una por proyecto) a Markdown limpio para buscadores e IAs:
//   <salida>/md/<proyecto>.md   una por documentación
//   <salida>/llms-full.txt      todo el contenido junto
// Uso: node .github/scripts/build-llms.mjs <carpeta de salida>   (el workflow usa _site/biblioteca)
// Sin dependencias: lee cada index.html, se queda con <main>, quita navegación, SVG y botones, y
// traduce títulos, párrafos, listas, código, tablas, definiciones e imágenes (con URL absoluta).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const SITE = 'https://renzoramosdev.github.io/Documentacion-Proyectos-Renzo-Ramos/'
const PAGES = [
  { dir: 'biblioteca', title: 'Biblioteca de Renzo Ramos' },
  { dir: 'agentboard', title: 'AgentBoard' },
  { dir: 'booqi', title: 'Booqi' },
  { dir: 'pokedex-retro', title: 'Pokédex Retro' },
  { dir: 'brainy', title: 'Brainy' },
]
const out = process.argv[2]
if (!out) {
  console.error('Uso: node .github/scripts/build-llms.mjs <carpeta de salida>')
  process.exit(2)
}

const decode = (text) =>
  text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
const squash = (text) => text.replace(/\s+/g, ' ').trim()
const absolute = (href, base) => (/^(https?:|mailto:)/.test(href) ? href : new URL(href, base).href)

function stripDrop(html) {
  for (const tag of ['nav', 'aside', 'svg', 'button', 'script', 'style', 'template']) {
    html = html.replace(new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}>`, 'gi'), '')
  }
  // Etiquetas de sección («Por dentro») y píldoras decorativas no aportan nada en Markdown
  html = html.replace(/<p class="(eyebrow|pill[^"]*)">[\s\S]*?<\/p>/gi, '')
  return html.replace(/<!--[\s\S]*?-->/g, '')
}

// Convierte el HTML en línea (dentro de un párrafo, celda, título…) a Markdown.
function inline(html, base) {
  let text = html
    .replace(/<img\b[^>]*>/gi, (tag) => {
      const alt = (tag.match(/alt="([^"]*)"/) || [, ''])[1]
      const src = (tag.match(/src="([^"]*)"/) || [, ''])[1]
      return alt && src ? `![${decode(alt)}](${absolute(src, base)})` : ''
    })
    .replace(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, label) => {
      const t = squash(inline(label, base))
      return t ? `[${t}](${absolute(href, base)})` : ''
    })
    .replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, t) => `**${squash(inline(t, base))}**`)
    .replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, t) => `*${squash(inline(t, base))}*`)
    .replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, (_, t) => '`' + decode(t.replace(/<[^>]+>/g, '')) + '`')
    .replace(/<kbd\b[^>]*>([\s\S]*?)<\/kbd>/gi, (_, t) => '`' + decode(t) + '`')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
  return decode(text)
}

function table(html, base) {
  const rows = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((m) =>
    [...m[1].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((c) => squash(inline(c[1], base)).replace(/\|/g, '\\|')),
  )
  if (!rows.length) return ''
  const width = Math.max(...rows.map((r) => r.length))
  const pad = (r) => [...r, ...Array(width - r.length).fill('')]
  const [head, ...body] = rows
  return [
    `| ${pad(head).join(' | ')} |`,
    `| ${pad(head).map(() => '---').join(' | ')} |`,
    ...body.map((r) => `| ${pad(r).join(' | ')} |`),
  ].join('\n')
}

function list(html, base, ordered, depth = 0) {
  const items = [...html.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>(?![\s\S]*?<\/li>\s*<\/(?:ul|ol)>[\s\S]*?<\/li>)/gi)]
  const indent = '  '.repeat(depth)
  let n = 0
  return items
    .map((m) => {
      let body = m[1]
      let nested = ''
      body = body.replace(/<(ul|ol)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, tag, inner) => {
        nested += '\n' + list(inner, base, tag.toLowerCase() === 'ol', depth + 1)
        return ''
      })
      const text = squash(inline(body, base))
      n += 1
      return `${indent}${ordered ? `${n}.` : '-'} ${text}${nested}`
    })
    .join('\n')
}

// Convierte el contenido de <main> en Markdown, bloque a bloque.
function blocks(html, base) {
  const out = []
  const re =
    /<(h1|h2|h3|h4|p|pre|ul|ol|table|dl|figure|blockquote)\b([^>]*)>([\s\S]*?)<\/\1>|<img\b[^>]*>/gi
  let m
  while ((m = re.exec(html))) {
    const tag = (m[1] || 'img').toLowerCase()
    const inner = m[3] || ''
    if (tag === 'img') {
      const md = inline(m[0], base)
      if (md) out.push(md)
      continue
    }
    if (tag.startsWith('h')) {
      const text = squash(inline(inner, base))
      if (text) out.push(`${'#'.repeat(Number(tag[1]))} ${text}`)
    } else if (tag === 'p') {
      const text = squash(inline(inner, base))
      if (text) out.push(text)
    } else if (tag === 'pre') {
      const code = decode(inner.replace(/<[^>]+>/g, ''))
      out.push('```\n' + code.replace(/\s+$/, '') + '\n```')
    } else if (tag === 'ul' || tag === 'ol') {
      out.push(list(inner, base, tag === 'ol'))
    } else if (tag === 'table') {
      out.push(table(inner, base))
    } else if (tag === 'dl') {
      const pairs = [...inner.matchAll(/<dt\b[^>]*>([\s\S]*?)<\/dt>\s*<dd\b[^>]*>([\s\S]*?)<\/dd>/gi)]
      out.push(pairs.map((p) => `- **${squash(inline(p[1], base))}**: ${squash(inline(p[2], base))}`).join('\n'))
    } else if (tag === 'figure') {
      const img = (inner.match(/<img\b[^>]*>/i) || [''])[0]
      const caption = squash(inline((inner.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i) || [, ''])[1], base))
      const md = inline(img, base)
      if (md) out.push(caption ? `${md}\n*${caption}*` : md)
    } else if (tag === 'blockquote') {
      out.push(`> ${squash(inline(inner, base))}`)
    }
  }
  return out.filter(Boolean).join('\n\n')
}

function pageToMarkdown(page) {
  const html = readFileSync(join(process.cwd(), page.dir, 'index.html'), 'utf8')
  const base = `${SITE}${page.dir}/`
  const title = decode((html.match(/<title>([^<]*)<\/title>/) || [, page.title])[1])
  const description = decode((html.match(/name="description"\s*content="([^"]*)"/) || [, ''])[1])
  const main = (html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i) || [, ''])[1]
  const body = blocks(stripDrop(main), base)
  return `<!-- ${base} -->\n# ${title}\n\n> ${description}\n\nFuente: ${base}\nAutor: Renzo Ramos (https://portafolio-renzoramos.com/)\n\n${body}\n`
}

mkdirSync(join(out, 'md'), { recursive: true })
const parts = []
for (const page of PAGES) {
  const md = pageToMarkdown(page)
  if (page.dir !== 'biblioteca') writeFileSync(join(out, 'md', `${page.dir}.md`), md)
  parts.push(md)
  console.log(`${page.dir}: ${md.length} caracteres`)
}
const full = `# Biblioteca de Renzo Ramos · contenido completo\n\n> Las cinco páginas de https://renzoramosdev.github.io/Documentacion-Proyectos-Renzo-Ramos/ en Markdown: la biblioteca y la documentación de AgentBoard, Booqi, Pokédex Retro y Brainy, proyectos de Renzo Ramos (https://portafolio-renzoramos.com/).\n\n---\n\n${parts.join('\n\n---\n\n')}`
writeFileSync(join(out, 'llms-full.txt'), full)
console.log(`llms-full.txt: ${full.length} caracteres`)

# Documentación de los proyectos de Renzo Ramos

Este repo es la biblioteca de documentación de mis proyectos. Se publica en
https://renzoramosdev.github.io/Documentacion-Proyectos-Renzo-Ramos/

Lee este fichero entero antes de tocar nada. Lo importante, en orden:

1. **La ficha de cada proyecto es la única fuente de datos** (sección 2): todo lo que muestra la
   biblioteca sale de ella y se calcula solo.
2. **Cada commit toca una sola carpeta y se llama `<Nombre> <N>`** (sección 3).
3. **Nada se sube sin pasar la comprobación automática** (sección 6) y la lista final (sección 9).

## 1. Estructura

- `biblioteca/`: la página de la biblioteca. Tiene el inicio (mosaico de capturas, marcador de cifras
  y tira de tecnologías) y el estante (una ficha por proyecto, con buscador y filtros).
- Una carpeta por proyecto en la raíz, con el nombre del proyecto en minúsculas (por ejemplo
  `agentboard/`, `booqi/`, `pokedex-retro/`, `brainy/`). Su `index.html` es la documentación del
  proyecto, con sus propios `css/`, `js/` y `assets/`.
- Cada proyecto tiene su ficha en `biblioteca/index.html`, sus miniaturas en
  `biblioteca/assets/thumbs/` y sus capturas del mosaico en `biblioteca/assets/mosaic/`. La ficha
  enlaza a `../<proyecto>/`.
- `.github/workflows/pages.yml`: comprueba la biblioteca y publica el sitio en GitHub Pages.
- `.github/scripts/comprobar-biblioteca.mjs`: la comprobación automática (sección 6).
- `README.md`: la presentación del repo en GitHub, con la tabla «Proyectos».
- `CLAUDE.md`: estas instrucciones.
- `.gitignore`: lo que nunca se sube (por ejemplo `.serena/`).

## 2. La ficha de cada proyecto es la única fuente de datos

Todo lo que la biblioteca muestra de un proyecto sale de su `<li data-book …>` en
`biblioteca/index.html`. Nada se escribe a mano en otro sitio: el JavaScript lo calcula a partir de
las fichas al cargar la página.

| Atributo de la ficha | Qué es | De dónde sale |
|---|---|---|
| `data-kind` | `escritorio` o `web` | El tipo de proyecto |
| `data-sections` | Número de secciones de su documentación | `grep -c 'class="doc-section"' <proyecto>/index.html` |
| `data-captures` | Número de capturas de su documentación | `grep -c '<figure class="shot"' <proyecto>/index.html` |
| `data-techs` | **Todas** sus herramientas, separadas por comas, sin versiones | Los mismos nombres que su sección «Stack tecnológico» |
| `data-mosaic` | Sus capturas para el mosaico del inicio, separadas por comas | Nombres de fichero sin `.webp` de `biblioteca/assets/mosaic/` |
| `data-keywords` | Palabras extra para el buscador | Lo que alguien buscaría de ese proyecto |

Y dentro de la ficha, `<span data-sections-text>N secciones</span>` con el mismo número que
`data-sections` (el JavaScript lo rellena, pero el HTML lleva el número por si no carga).

Con esos atributos se calcula solo, en cada carga:

- **El marcador del inicio:** proyectos, secciones, capturas y tecnologías (únicas: una herramienta
  que usan varios proyectos cuenta una vez).
- **La tira de tecnologías del inicio:** todas las herramientas de todos los proyectos, sin repetir.
  Su velocidad se ajusta sola a la longitud de la lista.
- **El mosaico de capturas del inicio:** las capturas de **todos** los proyectos, cada una una sola
  vez, en **orden aleatorio en cada carga** e intercalando proyectos para que no se junten dos del
  mismo. (Para que el desplazamiento no tenga final, la rejilla repite el conjunto entero; eso es
  técnico, no son capturas repetidas.)
- **Los filtros** (Todos, Escritorio, Web, con sus recuentos; los que quedan a cero se ocultan) y
  **el buscador** (busca en el nombre, la descripción, `data-keywords` y `data-techs`).
- **El texto «N secciones»** de cada ficha.

Por eso, al meter o actualizar un proyecto, **solo hay que dejar bien su ficha** y las estadísticas,
los tags, el mosaico y los filtros cambian solos. Y si cambia su documentación (una sección o una
captura más), hay que volver a contar y actualizar `data-sections` y `data-captures`: la comprobación
de la sección 6 avisa si no cuadran.

Reglas de nombres en `data-techs`: usa el **mismo nombre que los demás proyectos** para la misma
herramienta (`React`, `TypeScript`, `Vitest`, `Playwright`, `GitHub Actions`, `OpenSpec`…), para que
el marcador no la cuente dos veces, y el mismo nombre que su «Stack tecnológico», porque la
comprobación exige que cada herramienta de `data-techs` aparezca tal cual en esa sección.

## 3. Reglas de commits

Estas reglas mandan sobre cualquier otra convención (no se usa Conventional Commits aquí).

1. **El mensaje es solo `<Nombre> <N>`**, sin nada más: ni tipo, ni descripción, ni cuerpo.
   - `<Nombre>` depende de lo que se toca:

     | Lo que cambia | `<Nombre>` |
     |---|---|
     | La carpeta de un proyecto | El nombre del proyecto tal como se escribe (`AgentBoard`, `Booqi`, `Pokedex-Retro`, `Brainy`…) |
     | `biblioteca/` | `Biblioteca` |
     | `.github/` | `GitHub` |
     | `CLAUDE.md` | `Claude` |
     | `.gitignore` | `Git` |
     | `README.md` | `Readme` |

   - `<N>` es un contador propio de cada nombre: empieza en `0` y sube de uno en uno.
   - Ejemplos: `Biblioteca 0`, `AgentBoard 0`, `Biblioteca 1`, `Claude 0`, `GitHub 0`, `Git 0`,
     `Readme 0`.
2. **Para saber el siguiente número**, mira el último commit con ese nombre en todo el historial
   y súmale uno; si no hay ninguno, es `0`:
   ```bash
   git log --all --format=%s | grep -E '^AgentBoard [0-9]+$' | awk '{print $2}' | sort -n | tail -1
   ```
3. **Un commit por carpeta y por cambio.** Cada commit solo toca lo de su `<Nombre>`: la carpeta
   de su proyecto, `biblioteca/`, `.github/`, `CLAUDE.md`, `.gitignore` o `README.md`. Nunca se
   mezclan en un mismo commit.
4. **Todo el cambio de una carpeta va en un solo commit.** Si mientras se trabaja salen varios
   commits de la misma carpeta, se juntan en uno antes de subir.
5. **Orden:** cuando se añade o actualiza un proyecto, primero va el commit del proyecto
   (`AgentBoard N`), después el de la biblioteca (`Biblioteca N`) que muestra el cambio, y después
   el del README (`Readme N`) si cambia.
6. **Sin coautores.** Nunca se añade `Co-Authored-By` ni ninguna línea que atribuya el commit a
   Claude u otra IA. El autor es la identidad configurada en git.

## 4. Ramas y subida

- Se trabaja en una rama con el `<Nombre>` del cambio: `AgentBoard`, `Booqi`, `Biblioteca`,
  `GitHub`, `Claude`, `Git`, `Readme`…
- Antes de subir, comprueba que cada commit solo toca lo suyo:
  ```bash
  git diff-tree --no-commit-id --name-only -r <commit> | cut -d/ -f1 | sort -u
  ```
- Se sube la rama a GitHub y después se lleva a `main` con un avance rápido
  (`git push origin <rama>:main`), sin commits de merge.

## 5. Publicación (GitHub Pages)

- Cada push a `main` publica el sitio con `.github/workflows/pages.yml` (Pages en modo
  «GitHub Actions»). El workflow ejecuta antes la comprobación de la sección 6: si falla, no se
  publica nada.
- Se publican todas las carpetas visibles de la raíz, así que una carpeta de proyecto nueva sale
  sola, sin tocar el workflow. `CLAUDE.md`, `README.md` y las carpetas ocultas no se publican.
- Los estilos y scripts de `biblioteca/index.html` llevan `?v=<N>` (por ejemplo
  `css/biblioteca.css?v=10`) para que el navegador no use una versión vieja de su caché. Cada vez
  que cambies un CSS o JS de la biblioteca, pon en todos ellos el `N` del commit `Biblioteca N`
  que lo sube.
- La raíz del sitio no tiene página propia: el workflow genera un `index.html` que redirige a
  `biblioteca/`.
- Después de subir, comprueba que el despliegue terminó bien (`gh run list --workflow pages.yml`)
  y que las páginas responden 200.

## 6. Comprobación automática

`node .github/scripts/comprobar-biblioteca.mjs` (desde la raíz del repo, sin dependencias) revisa
que la biblioteca está en orden y, si no, dice exactamente qué falla:

- Cada ficha enlaza a una carpeta que existe y `data-sections` y `data-captures` coinciden con lo
  que hay en su `index.html`; el texto «N secciones» también.
- Cada herramienta de `data-techs` aparece en el «Stack tecnológico» de su documentación, sin
  repetidas, y hay al menos 10.
- La ficha no lleva tags (`.chips`) y usa sus cuatro miniaturas, que existen.
- `data-mosaic` tiene al menos 3 capturas, llamadas `<proyecto>-<nombre>`, que existen y no se
  repiten. Avisa de imágenes del mosaico o miniaturas que ninguna ficha usa.
- La documentación tiene la franja de la biblioteca, el índice enlaza a `#stack` y la barra del
  proyecto no lleva «Documentación» ni «Biblioteca».
- `README.md` tiene el proyecto en su tabla, todos los `?v=` son iguales y el contenedor del
  mosaico no lleva `<img>` en el HTML.

Al terminar imprime las cifras del marcador (proyectos, secciones, capturas, tecnologías y capturas
del mosaico): compáralas con lo que ves en el inicio. **Pásala antes de cada commit de
`biblioteca/` o de un proyecto**; el workflow la vuelve a pasar y bloquea la publicación si falla.

## 7. Añadir la documentación de un proyecto

1. **Rama** con el nombre del proyecto (por ejemplo `Booqi`).
2. **Carpeta `<proyecto>/`** en minúsculas con su documentación como `index.html`. Si el repo del
   proyecto ya tiene una, cópiala desde allí (`git archive origin/main:landing`, renombrando
   `docs.html` a `index.html`) y quédate solo con los archivos que la página usa (estilos, scripts,
   fuentes, logos, capturas). Si no, escríbela nueva con la misma plantilla: copia `css/docs.css`,
   `css/landing.css` y `js/` de otro proyecto y escribe un `css/tokens.css` con los colores y las
   fuentes del proyecto (claro y oscuro).
3. **Cabecera y enlaces** (mira `agentboard/index.html` como referencia):
   - Encima de la cabecera del proyecto va la franja de la biblioteca (`<nav class="library-bar">`):
     logo y enlace «Biblioteca» (`../biblioteca/`), `›`, el nombre del proyecto y «Ver todos →»
     (`../biblioteca/#proyectos`). Sus estilos están al principio de `css/docs.css`
     («Franja de la biblioteca»): cópialos tal cual.
   - La barra del proyecto queda limpia: solo enlaces del proyecto, como «Web ↗» a su web y
     «Descargar» o «Ver demo». Nada de enlaces a secciones de su landing, ni «Biblioteca», ni
     «Documentación» (ya estás en ella).
   - Los enlaces del contenido a la web o a la demo del proyecto apuntan a su web publicada.
   - Si el repo del proyecto es privado, no enlaces al código ni publiques claves, URLs internas
     ni datos personales.
4. **Sección «Stack tecnológico»** (`id="stack"`, en el índice justo después de «Arquitectura») con
   **todas** las herramientas del proyecto en listas `.chips` agrupadas por capa (backend, frontend,
   datos, pruebas y calidad, CI y método…). Sácalas de sus manifiestos (`package.json`,
   `Cargo.toml`, `pom.xml`…), de sus workflows y de su infraestructura, no solo de su README; con
   versión cuando la haya (`<li>Vite <span>8.3</span></li>`).
5. **Miniaturas** de esa copia en claro y en oscuro (1280×800, en WebP a 1280 y 640 px de ancho):
   `biblioteca/assets/thumbs/<proyecto>-light-{640,1280}.webp` y `…-dark-…`.
6. **Capturas para el mosaico del inicio:** copia 3 o 4 capturas suyas (las de 640 px) a
   `biblioteca/assets/mosaic/<proyecto>-<nombre>.webp`. No hace falta tocar el mosaico: se monta
   solo desde `data-mosaic`.
7. **Ficha en el estante** de `biblioteca/index.html`, copiando la de otro proyecto y rellenando
   todos los atributos de la sección 2 (`data-kind`, `data-sections`, `data-captures`,
   `data-techs`, `data-mosaic`, `data-keywords`) y, dentro:
   - `--accent-light` y `--accent-dark`: el color que **domina** su documentación en cada tema
     (el del fondo o la marca que se ve en la miniatura), no un color de acento puntual. Es el
     color del lomo de la ficha y del punto de su etiqueta. Por ejemplo:

     | Proyecto | Claro | Oscuro |
     |---|---|---|
     | AgentBoard | azul `#0b8ac9` | naranja `#f2a33a` |
     | Booqi | morado `#7c3aed` | morado `#a78bfa` |
     | Pokédex Retro | rojo `#cc2200` | verde Game Boy `#00aa44` |
     | Brainy | violeta `#6d3fc4` | violeta `#b48cff` |

   - Tipo, `<span data-sections-text>N secciones</span>`, descripción y enlaces (documentación
     `../<proyecto>/`, web y código).
   - La ficha **no muestra tags de tecnologías**: van en `data-techs` (sección 2).
8. **README:** añade el proyecto a la tabla «Proyectos» del `README.md`.
9. **Comprueba:** `node .github/scripts/comprobar-biblioteca.mjs` sin errores. Después prueba en
   local sirviendo la raíz del repo (`python3 -m http.server`) y abre `/biblioteca/`: el marcador
   suma el proyecto nuevo, sus capturas salen en el mosaico (recarga: el orden cambia), la ficha
   abre la documentación, «Biblioteca» de la franja regresa y no hay errores en la consola.
10. **Commits** `<Proyecto> N`, `Biblioteca N` y `Readme N`, en ese orden, y súbelo (sección 4).

## 8. Actualizar un proyecto que ya está

- Si cambia su documentación: vuelve a contar secciones y capturas y actualiza `data-sections`,
  `data-captures` y el texto «N secciones» de su ficha.
- Si cambia su «Stack tecnológico»: actualiza `data-techs` con los mismos nombres.
- Si cambia su portada: regenera sus miniaturas (paso 5) y, si procede, sus capturas del mosaico.
- Commits en el mismo orden: primero el del proyecto, después `Biblioteca N`.

## 9. Lista de comprobación antes de subir

- [ ] `node .github/scripts/comprobar-biblioteca.mjs` termina sin errores.
- [ ] Las cifras que imprime (proyectos, secciones, capturas, tecnologías) son las que se ven en el
      inicio.
- [ ] Si cambié un CSS o JS de la biblioteca, subí el `?v=` en todos los recursos de
      `biblioteca/index.html` al número del commit `Biblioteca N`.
- [ ] Cada commit toca una sola carpeta y se llama `<Nombre> <N>` con el número siguiente.
- [ ] Orden de commits: proyecto → `Biblioteca` → `Readme`; nada de coautores.
- [ ] Subida: rama con el `<Nombre>` y avance rápido a `main`; después, despliegue en verde y
      páginas con 200.

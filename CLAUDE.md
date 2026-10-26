# Documentación de los proyectos de Renzo Ramos

Este repo es la biblioteca de documentación de mis proyectos. Se publica en
https://renzoramosdev.github.io/Documentacion-Proyectos-Renzo-Ramos/

## Estructura

- `biblioteca/`: la página de la biblioteca (galería con una ficha por proyecto).
- Una carpeta por proyecto en la raíz, con el nombre del proyecto en minúsculas
  (por ejemplo `agentboard/`, `booqi/`). Su `index.html` es la documentación del proyecto.
- Cada proyecto tiene su ficha en `biblioteca/index.html` y sus miniaturas en
  `biblioteca/assets/thumbs/`. La ficha enlaza a `../<proyecto>/`.
- `.github/workflows/pages.yml`: publica el sitio en GitHub Pages.
- `CLAUDE.md`: estas instrucciones.
- `.gitignore`: lo que nunca se sube (por ejemplo `.serena/`).

## Reglas de commits

Estas reglas mandan sobre cualquier otra convención (no se usa Conventional Commits aquí).

1. **El mensaje es solo `<Nombre> <N>`**, sin nada más: ni tipo, ni descripción, ni cuerpo.
   - `<Nombre>` depende de lo que se toca:

     | Lo que cambia | `<Nombre>` |
     |---|---|
     | La carpeta de un proyecto | El nombre del proyecto tal como se escribe (`AgentBoard`, `Booqi`…) |
     | `biblioteca/` | `Biblioteca` |
     | `.github/` | `GitHub` |
     | `CLAUDE.md` | `Claude` |
     | `.gitignore` | `Git` |

   - `<N>` es un contador propio de cada nombre: empieza en `0` y sube de uno en uno.
   - Ejemplos: `Biblioteca 0`, `AgentBoard 0`, `Biblioteca 1`, `Claude 0`, `GitHub 0`, `Git 0`.
2. **Para saber el siguiente número**, mira el último commit con ese nombre en todo el historial
   y súmale uno; si no hay ninguno, es `0`:
   ```bash
   git log --all --format=%s | grep -E '^AgentBoard [0-9]+$' | awk '{print $2}' | sort -n | tail -1
   ```
3. **Un commit por carpeta y por cambio.** Cada commit solo toca lo de su `<Nombre>`: la carpeta
   de su proyecto, `biblioteca/`, `.github/`, `CLAUDE.md` o `.gitignore`. Nunca se mezclan en un mismo commit.
4. **Todo el cambio de una carpeta va en un solo commit.** Si mientras se trabaja salen varios
   commits de la misma carpeta, se juntan en uno antes de subir.
5. **Orden:** cuando se añade o actualiza un proyecto, primero va el commit del proyecto
   (`AgentBoard N`) y después el de la biblioteca (`Biblioteca N`) que muestra el cambio.
6. **Sin coautores.** Nunca se añade `Co-Authored-By` ni ninguna línea que atribuya el commit a
   Claude u otra IA. El autor es la identidad configurada en git.

## Ramas y subida

- Se trabaja en una rama con el `<Nombre>` del cambio: `AgentBoard`, `Booqi`, `Biblioteca`,
  `GitHub`, `Claude`, `Git`…
- Antes de subir, comprueba que cada commit solo toca lo suyo:
  ```bash
  git diff-tree --no-commit-id --name-only -r <commit> | cut -d/ -f1 | sort -u
  ```
- Se sube la rama a GitHub y después se lleva a `main` con un avance rápido
  (`git push origin <rama>:main`), sin commits de merge.

## Publicación (GitHub Pages)

- Cada push a `main` publica el sitio con `.github/workflows/pages.yml` (Pages en modo
  «GitHub Actions»).
- Se publican todas las carpetas visibles de la raíz, así que una carpeta de proyecto nueva sale
  sola, sin tocar el workflow. `CLAUDE.md` y las carpetas ocultas no se publican.
- Los estilos y scripts de `biblioteca/index.html` llevan `?v=<N>` (por ejemplo `css/biblioteca.css?v=10`)
  para que el navegador no use una versión vieja de su caché. Cada vez que cambies un CSS o JS de
  la biblioteca, pon en todos ellos el `N` del commit `Biblioteca N` que lo sube.
- La raíz del sitio no tiene página propia: el workflow genera un `index.html` que redirige a
  `biblioteca/`.
- Después de subir, comprueba que el despliegue terminó bien (`gh run list --workflow pages.yml`)
  y que las páginas responden 200.

## Añadir la documentación de un proyecto

1. Rama con el nombre del proyecto (por ejemplo `Booqi`).
2. Carpeta `<proyecto>/` en minúsculas con su documentación como `index.html`, copiada desde el
   repo del proyecto (`git archive origin/main:landing`, renombrando `docs.html` a `index.html`).
   Quédate solo con los archivos que la página usa (estilos, scripts, fuentes, logos, capturas).
3. Ajusta la cabecera y los enlaces de la copia (mira `agentboard/index.html` como referencia):
   - Encima de la cabecera del proyecto va la franja de la biblioteca (`<nav class="library-bar">`):
     logo y enlace «Biblioteca» (`../biblioteca/`), `›`, el nombre del proyecto y «Ver todos →»
     (`../biblioteca/#proyectos`). Sus estilos están al principio de `css/docs.css`
     («Franja de la biblioteca»): cópialos tal cual.
   - La barra del proyecto queda limpia: solo enlaces del proyecto, como «Web ↗» a su web y
     «Descargar» o «Ver demo». Nada de enlaces a secciones de su landing, ni «Biblioteca», ni
     «Documentación» (ya estás en ella).
   - Los enlaces del contenido a la web o a la demo del proyecto apuntan a su web publicada.
4. Miniaturas de esa copia en claro y en oscuro (1280×800, en WebP a 1280 y 640 px de ancho):
   `biblioteca/assets/thumbs/<proyecto>-light-{640,1280}.webp` y `…-dark-…`.
5. Ficha en el estante de `biblioteca/index.html`, copiando la de otro proyecto:
   - `data-kind` (`escritorio` o `web`), `data-sections` (número de secciones de su
     documentación) y `data-keywords` (palabras para el buscador).
   - `--accent-light` y `--accent-dark`: el color que **domina** su documentación en cada tema
     (el del fondo o la marca que se ve en la miniatura), no un color de acento puntual. Es el
     color del lomo de la ficha y del punto de su etiqueta. Por ejemplo:

     | Proyecto | Claro | Oscuro |
     |---|---|---|
     | AgentBoard | azul `#0b8ac9` | naranja `#f2a33a` |
     | Booqi | morado `#7c3aed` | morado `#a78bfa` |
     | Pokédex Retro | rojo `#cc2200` | verde Game Boy `#00aa44` |
     | Brainy | violeta `#6d3fc4` | violeta `#b48cff` |
   - Tipo, descripción, tecnologías y enlaces (documentación `../<proyecto>/`, web y código).
   - Los contadores, los filtros y las estadísticas se calculan solos con JavaScript.
6. Prueba en local sirviendo la raíz del repo (`python3 -m http.server`) y abre
   `/biblioteca/`: la ficha abre la documentación, «Volver» regresa y no hay errores.
7. Commits `<Proyecto> N` y `Biblioteca N`, en ese orden, y súbelo.

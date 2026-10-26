# Documentación de los proyectos de Renzo Ramos

Este repo es la biblioteca de documentación de mis proyectos.

## Estructura

- `biblioteca/`: la página de la biblioteca (galería con una ficha por proyecto).
- Una carpeta por proyecto en la raíz, con el nombre del proyecto en minúsculas
  (por ejemplo `agentboard/`). Su `index.html` es la documentación del proyecto.
- Cada proyecto tiene su ficha en `biblioteca/index.html` y sus miniaturas en
  `biblioteca/assets/thumbs/`. La ficha enlaza a `../<proyecto>/`.

## Reglas de commits

Estas reglas mandan sobre cualquier otra convención (no se usa Conventional Commits aquí).

1. **El mensaje es solo `<Nombre> <N>`**, sin nada más: ni tipo, ni descripción, ni cuerpo.
   - `<Nombre>` es el nombre del proyecto tal como se escribe (`AgentBoard`, `Booqi`…),
     `Biblioteca` para los cambios de la carpeta `biblioteca/`, o `Claude` para los cambios de
     este `CLAUDE.md`.
   - `<N>` es un contador propio de cada nombre: empieza en `0` y sube de uno en uno.
   - Ejemplos: `Biblioteca 0`, `AgentBoard 0`, `Biblioteca 1`, `AgentBoard 1`.
2. **Para saber el siguiente número**, mira el último commit con ese nombre en todo el historial
   y súmale uno; si no hay ninguno, es `0`:
   ```bash
   git log --all --format=%s | grep -E '^AgentBoard [0-9]+$' | awk '{print $2}' | sort -n | tail -1
   ```
3. **Un commit por carpeta y por cambio.** Un commit de un proyecto solo toca la carpeta de ese
   proyecto; un commit `Biblioteca` solo toca `biblioteca/`; un commit `Claude` solo toca
   `CLAUDE.md`. Nunca se mezclan en un mismo commit.
4. **Todo el cambio de una carpeta va en un solo commit.** Si mientras se trabaja salen varios
   commits de la misma carpeta, se juntan en uno antes de subir.
5. **Orden:** cuando se añade o actualiza un proyecto, primero va el commit del proyecto
   (`AgentBoard N`) y después el de la biblioteca (`Biblioteca N`) que muestra el cambio.
6. **Sin coautores.** Nunca se añade `Co-Authored-By` ni ninguna línea que atribuya el commit a
   Claude u otra IA. El autor es la identidad configurada en git.

## Ramas y subida

- Cada proyecto se trabaja en una rama con el nombre del proyecto (por ejemplo `AgentBoard`).
- Los cambios solo de la biblioteca se pueden hacer en una rama `Biblioteca`.
- Se sube la rama a GitHub y después se lleva a `main` con un avance rápido
  (`git push origin <rama>:main`), sin commits de merge.
- Antes de subir, comprueba que cada commit solo toca su carpeta:
  ```bash
  git diff-tree --no-commit-id --name-only -r <commit> | cut -d/ -f1 | sort -u
  ```

# KMLog — Roadmap de objetivos

## ✅ Fase 1 — Completada

- ✅ 13. Login unificado (toggle eliminado)
- ✅ 14. Citas rotativas en español con formato literario
- ✅ 2+3. Home: última sesión + botones en dorado
- ✅ 19 (parcial). Stats en amber, SectionHeader más legible

---

## ✅ Fase 5 — Completada (Party + Notas de personaje)

- ✅ 11. Vista Party — dashboard operativo filtrado por in_party + is_alive; NPCs acompañantes; resumen del grupo activo
- ✅ 24. Notas del personaje — schema is_public, endpoint by-character, CharacterNotes client component

---

## ✅ Fase 4 — Completada (NPCs ítems 26-29)

- ✅ 26. Botón "Nuevo NPC" (GM) en lista + formulario create/edit (`/npcs/new`, `/npcs/[id]/edit`)
- ✅ 27. Statblock UI — editor estructurado (HP, CA, Velocidad, Salvaciones, Percepción, Atributos, Ataques, Habilidades, Resistencias) en panel GM del detalle
- ✅ 28. Subida de retrato NPC — `POST /npcs/:id/portrait` (Cloudinary) + botón upload en panel GM
- ✅ 29. Estados del NPC — schema + DTO: `is_with_party`, `last_seen_hex_id`, `last_seen_description`, `last_seen_at`; toggles y editor en panel GM; badge "Con la party" en el detalle
- ⏳ 30. Integración mapa ("Última vez visto aquí") — pendiente, depende de cambios en el mapa

---

## ✅ Fase 3 — Completada (navbar + wiki de reglas read-only)

- ✅ 15. Navbar: Party (Shield) y Reglas (BookOpen) agregados — orden final: Sesiones | Party | Mapa | Personajes | NPCs | Reglas
- ✅ 16 (parcial). Vista `/rules`: lista con filtro por categoría + búsqueda + cards; `/rules/[id]`: detalle con renderer markdown simple
- ✅ api.ts: tipos `ApiRule`, `ApiRuleCategory` + métodos `api.rules.*`

---

## ✅ Fase 2 — Completada (ficha de personaje)

- ✅ 1. Vivo/muerto + en party — schema, DTO, controles del owner, grayscale + badge en cards
- ✅ 12. Roster `/characters` con muertos diferenciados
- ✅ 21. CA (vía armadura usada), salvaciones (Fort/Ref/Vol), Percepción, Class DC, HP actual editable
- ✅ 22 (parcial). Hechizos con divisores por nivel
- ✅ 23. Backstory privado (owner/GM) con sección dedicada
- ✅ 25. Botón "Sincronizar Pathbuilder" + `last_synced_at` visible (owner/GM)
- ✅ 21. Feats agrupados por tipo (Clase/Ascendencia/Habilidad/General)

---

## Pantalla de inicio (`/`)

### 1. Estado del personaje — vivo/muerto + en party
- **Backend**: agregar `in_party: boolean` (default `true`) al schema/DTO de Character; verificar/confirmar `is_alive`; PATCH protegido al owner
- **Cards**: filtro CSS `grayscale` + badge "Muerto" en todas las cards cuando `is_alive === false`
- **Strip "La Party"**: filtrar solo `in_party === true`
- **Toggle UI**: en la página de detalle del personaje (sin modal), solo visible para el owner

### 2. Última sesión
- Mostrar solo la más reciente (no lista completa)
- Label: "Última sesión"
- Botón "Ver todas" en dorado/amber

### 3. Botón La Party
- "Todas las fichas" → "Ver todos los personajes" en dorado/amber

### 4. Preview del mapa (read-only)
- Solo hexes descubiertos/explorados
- Sin interacción (no clickeable)
- Se adapta al ancho de pantalla
- Mismos íconos y flags del mapa real
- Layout junto al carrusel de eventos: definir con frontend-design

### ✅ 5. Carrusel de eventos y encuentros
- Máximo 5, ordenados del más reciente al más viejo
- Slider con puntos en la parte inferior + arrows prev/next
- Click en punto → navega al slide; link a la sesión desde cada card
- Endpoint: `GET /events/recent?limit=5` (popula session_id)
- Ubicado en sidebar del home debajo del widget de party

---

## Vista Mapa (`/map`)

### 6. Refactor hex math — Honeycomb.js
- Reemplazar el código custom de offset→axial y edge midpoints por Honeycomb.js
- Simplifica la base para todo lo demás del mapa

### 7. Rutas entre hexes (player-marked)
- Los jugadores pueden marcar una ruta entre hexes adyacentes
- Cada ruta tiene estado: "ya transitada" o "planificada"
- Visual diferenciado por estado (ej: línea sólida vs punteada, color distinto)
- Backend: nueva colección o extensión del modelo de hex/mapa

### 8. Íconos por tipo de locación
- Íconos visibles sobre el hex sin necesidad de abrirlo
- Lookup table por tipo: cave, dungeon, castle, city, village, camp, ruins, tower, etc.
- Implementación: Lucide (ya instalado) para íconos genéricos + game-icons.net (SVGs en `/public/icons/`) para íconos específicos de fantasía
- Renderizados como `<path>` o `<image>` directamente en el SVG del mapa

### 9. Sidebar — click en locación → selecciona hex
- En el panel izquierdo de locaciones, al hacer click en una locación el mapa centra y selecciona el hex correspondiente
- Requiere estado compartido entre sidebar y mapa

### 10. Texturas de terreno
- SVG `<clipPath>` + `<image>` por tipo de terreno (bosque, pradera, montaña, río, etc.)
- Assets de textura en `/public/textures/`

---

## Vista Party (`/party`) — nueva

### ✅ 11. Dashboard operativo de la party
- Solo muestra personajes con `in_party: true` y vivos
- Texto situacional del GM (ya existe, mover desde `/party` actual)
- Cards de miembros activos con stats rápidos (nivel, clase, jugador)
- NPCs acompañantes (`is_with_party: true`) en sidebar
- Resumen del grupo: nivel medio, HP total, clases únicas
- Diferenciado de `/characters` (roster histórico completo)

### 12. Agregar "Party" a la navbar
- Navbar final: **Sesiones | Party | Mapa | Personajes | NPCs** (Party va entre Sesiones y Mapa)
- Requiere que la vista `/party` esté implementada primero (ítem 11)

---

## Vista Personajes (`/characters`)

### 12. Roster completo
- Muestra todos los personajes (activos, muertos, retirados)
- Muertos con filtro grayscale + badge "Muerto"
- Fuera de party visualmente diferenciados

---

## Vista Detalle del Personaje (`/characters/[id]`)

### 19. Mejoras de visibilidad general
- Valores de STR/DEX/CON/INT/WIS/CHA en color dorado/amber
- Títulos de sección (Atributos, Rasgos, Habilidades, etc.) más grandes y claros
- Revisión tipográfica global: los títulos son difíciles de leer en todas las vistas — ajuste general de contraste y tamaño

### ✅ 20. Reorganización del orden de secciones
Nuevo orden propuesto (de más a menos consultado durante sesión):
1. Header (retrato, nombre, nivel, clase, raza)
2. Stats vitales: HP actual / HP máx, CA, Velocidad
3. Salvaciones (Fortitud, Reflejos, Voluntad)
4. Percepción e Iniciativa
5. Habilidades — solo las entrenadas o superiores, con modificadores
6. Atributos (STR/DEX/etc.)
7. Armamento
8. Hechizos (mejorados, ver ítem 22)
9. Rasgos / Feats / Resto

### 21. Datos faltantes a agregar
- **CA (Armor Class)** — no aparece actualmente, crítico
- **Salvaciones** (Fortitud / Reflejos / Voluntad)
- **HP actual** (editable por owner/GM) — además del HP máx ya visible
- **Percepción e Iniciativa** con modificadores
- **Class DC** — para martiales y algunos casters
- **Spell attack modifier** — para casters
- **Condiciones activas** — lista de condiciones que el owner/GM puede agregar y quitar manualmente (ej: Fatigado, Asustado 1); investigar si el JSON de Pathbuilder las exporta (probablemente no, son estado de runtime)
- **Feats organizados por tipo** — separar en Ancestry / Class / General / Skill en lugar de lista plana

### 22. Mejora de hechizos
- Usar tabla en lugar de lista plana
- Delimitadores claros entre conjuros (nivel de slot, tipo)
- Mejorar contraste y lectura general

### 23. Backstory y descripción pública
- **Descripción pública**: visible para todos, editable por el owner
- **Backstory privado**: visible solo para el owner y el GM, editable por el owner
- Sección separada en la página de detalle con indicador de visibilidad

### ✅ 24. Notas del personaje
- Los personajes tienen notas (públicas o privadas)
- Notas pueden referirse a secciones, otros personajes, eventos, etc.
- En la ficha: preview de las últimas notas públicas + botón "Ver todas"
- Owner y GM ven todas las notas (públicas y privadas); el resto solo las públicas
- Backend: notas vinculadas a `character_id` con campo `is_public: boolean`

### 25. Botón "Actualizar desde Pathbuilder"
- Owner o GM pueden sincronizar el personaje volviendo a importar desde Pathbuilder con el ID almacenado
- El `pathbuilder_id` se guarda en el backend pero **nunca se expone en la API pública** (excluido de la proyección pública)
- Muestra timestamp de última actualización visible para todos ("Última sincronización: X")
- Endpoint: `POST /characters/:id/sync` — protegido, solo owner o GM
- Schema: agregar `pathbuilder_id: number` (privado) y `last_synced_at: Date` al modelo Character

---

## Autenticación

### 13. Unificar login
- Eliminar el toggle "Dungeon Master / Jugador" del formulario de login — no tiene efecto, el rol viene del backend
- Dejar solo email + contraseña
- Un único login para GMs y jugadores

### 14. Citas rotativas en el panel izquierdo del login
- Reemplazar la frase fija ("La crónica aguarda...") por citas épicas aleatorias de personajes de aventuras
- Universos: El Señor de los Anillos, Star Wars, Harry Potter, Game of Thrones, Narnia, Dune, El Hobbit, etc.
- Cada cita incluye el texto + atribución (personaje y obra)
- Se elige aleatoriamente en cada carga de la página (client component con selección en mount)
- Lista de citas definida en el frontend, sin backend

---

## Vista Reglas (`/rules`) — wiki

### 15. Navbar: agregar "Reglas" después de NPCs
- Navbar final: **Sesiones | Party | Mapa | Personajes | NPCs | Reglas**

### 16. Wiki de reglas
- ✅ Lista `/rules` con búsqueda y filtros por categoría
- ✅ Detalle `/rules/[id]` con renderer markdown simple
- ✅ Crear y editar reglas (solo GM) — formulario con split editor/preview markdown, categoría, tags, fuente, visibilidad
- Cualquier jugador puede crear y editar reglas (no solo el GM) — pendiente para fase siguiente
- Editor: Markdown con `@uiw/react-md-editor` (split write/preview, tema oscuro)
- Ya existe un módulo `rules` en la API — ✅ CRUD completo implementado

### 16b. Formato obligatorio de regla (template estructurado)
- Una regla no se puede publicar si no cumple el formato mínimo requerido
- Campos estructurados obligatorios (fuera del markdown):
  - **Título** (campo de texto, required)
  - **Descripción corta** (resumen de una línea, required)
  - **Link a Archives of Nethys** (URL opcional pero validada si se ingresa)
- El cuerpo en markdown sigue una plantilla predefinida con secciones esperadas (ej: Descripción, Regla, Ejemplos, Notas)
- Validación antes de publicar: si faltan campos requeridos, se guarda como borrador pero no se publica
- El formato estandarizado permite aplicar estilos CSS consistentes en el renderer: h1, h2, h3, párrafos, listas, etc. tienen apariencia uniforme en todas las reglas

### 17. Marcar regla como "importante"
- Cualquier usuario puede destacar una regla para sí mismo
- Al destacar, elige el alcance:
  - **Todos mis personajes** — aplica a todos los personajes del usuario
  - **Un personaje específico** — aplica solo a ese PJ
- Los GM pueden asignar una regla como importante a:
  - Todos los personajes de un jugador
  - Un personaje específico de cualquier jugador
- Modelo de datos: colección `rule_highlights` con campos `{ rule_id, user_id, character_id | null, assigned_by }`

### 18. Reglas destacadas en la ficha del personaje
- En la página de detalle del personaje, sección que muestra las reglas marcadas como importantes para ese PJ
- Incluye las destacadas globalmente (todos los personajes del usuario) y las específicas de ese personaje
- Las asignadas por el GM también aparecen

---

## Vista NPCs (`/npcs`)

### 26. Botón crear NPC (GM)
- Visible solo para el GM
- Modal o página de creación

### 27. Statblock del NPC
- Solo visible para el GM
- Dos vías de carga:
  - **Formulario manual**: campos estructurados para cargar el statblock (HP, AC, ataques, salvaciones, habilidades, etc.) — vía principal
  - **Importar desde Archives of Nethys / Wanderer's Guide**: investigar APIs no oficiales disponibles para buscar y traer statblocks de criaturas por nombre — vía alternativa; implementar solo si la API es viable y estable
- Ya existe campo `stats` en el schema de NPC — revisar estructura y extender
- El statblock no se expone en la API pública (ya está excluido de la proyección pública)

### 28. Subida de retrato de NPC
- Mismo flujo que el retrato del personaje (`POST /npcs/:id/portrait`)
- Solo el GM puede subir/cambiar la imagen

### 29. Estados del NPC
- **Vivo / Muerto** — ya existe `is_alive`, verificar que sea editable por GM
- **Acompañando a la party** — nuevo campo `is_with_party: boolean` (default `false`)
- **Última vez visto** — nuevos campos:
  - `last_seen_hex_id`: referencia al hex del mapa
  - `last_seen_description`: texto libre con descripción del lugar
  - `last_seen_at`: timestamp

### 30. Integración mapa — "Última vez visto aquí"
- En el mapa, al hacer click en un hex aparece la opción "Marcar última vez visto de un NPC aquí"
- Al seleccionarla: modal/dropdown para elegir qué NPC
- Confirmar actualiza `last_seen_hex_id`, `last_seen_at` y opcionalmente `last_seen_description`
- En la vista del hex (panel de detalle) se puede ver qué NPCs fueron vistos por última vez allí
- Solo el GM puede realizar esta acción

---

## Sistema de Notas (transversal a todas las vistas)

### 31. Modelo de datos de notas
Cada nota tiene:
- `author_user_id` — quién la escribió
- `author_character_id` (opcional) — desde qué personaje del autor se escribe (perspectiva/voz narrativa)
- `title` (opcional)
- `content` — markdown
- `is_public: boolean`
- `is_pinned: boolean`
- `entity_refs: Array<{ entity_type, entity_id }>` — referencias a múltiples entidades simultáneamente (NPC, personaje, locación, hex, regla, encuentro, sesión)
- `createdAt`, `updatedAt`

### 32. Visibilidad y permisos
- **Notas públicas**: visibles para todos; editables solo por el owner
- **Notas privadas**: visibles solo para el owner y el GM
- **El GM es omnisciente**: ve absolutamente todas las notas privadas de todos los usuarios
- Las notas públicas muestran el retrato del personaje autor + nombre del personaje

### 33. Panel lateral de notas (drawer)
- **Diseño**: drawer deslizable desde la derecha — no tapa el contenido principal, se abre con botón flotante o tab lateral
- Presente en todas las vistas con entidades: NPCs, personajes, locaciones, hexes, reglas, encuentros, sesiones
- El panel muestra solo las notas vinculadas a la entidad actual (ej: en el Lago de Plata solo notas del Lago de Plata)
- Dos secciones con tab/click para alternar:
  - **Todas las notas**: todas las notas públicas de todos los usuarios sobre esa entidad + las notas privadas propias del usuario actual
  - **Mis notas**: acceso rápido solo a las notas del usuario actual (públicas y privadas)
- Las notas pineadas aparecen siempre al tope
- Notas mostradas con: retrato del personaje autor, nombre del personaje, título (si tiene), preview del contenido

### 34. Vista `/notes` — mis notas
- Vista centralizada con todas las notas del usuario actual
- Filtros: por entidad, por personaje autor, públicas/privadas, pineadas
- Accesible desde el menú desplegable de usuario ("Mis notas")

### 35. Creación y edición de notas
- Editor markdown (mismo criterio que reglas: `@uiw/react-md-editor`)
- Selector de entidades referenciadas (pueden ser múltiples)
- Selector opcional de personaje autor (solo propios)
- Toggle público/privado
- Opción de pinear
- Título opcional

---

## Otras vistas — pendiente de relevar

> Los objetivos de las demás vistas se agregarán aquí a medida que se definan.

# KMLog — Documentation Index

> Bitácora digital de campaña Pathfinder 2e Remaster. Backend NestJS + MongoDB, frontend Next.js 15.

## Quick Reference

| Layer | Tech | Status |
|-------|------|--------|
| API | NestJS 11, MongoDB 9, Mongoose 9, JWT | ✅ Implemented |
| Web | Next.js 15, Tailwind 4, shadcn/ui, Tiptap | 🚧 Scaffold |
| Shared | TypeScript types, hex math/pathfinding utils | ✅ Implemented |

---

## Entities

| Entity | Collection | Description | Doc |
|--------|-----------|-------------|-----|
| User | `users` | Auth + roles (gm / player) | [→](entities/user.md) |
| Character | `characters` | PCs — Pathbuilder2e JSON + overlay | [→](entities/character.md) |
| Session | `sessions` | Sesiones de juego (draft → published) | [→](entities/session.md) |
| Event / Encounter | `events_encounters` | Eventos y encuentros dentro de sesiones | [→](entities/event.md) |
| NPC | `npcs` | Personajes no jugadores, capas public/GM | [→](entities/npc.md) |
| Location | `locations` | Lugares con visibilidad configurable | [→](entities/location.md) |
| Note | `notes` | Notas privadas con @mentions | [→](entities/note.md) |
| Rule / RuleCategory | `rules`, `rule_categories` | Compendio de reglas con búsqueda full-text | [→](entities/rule.md) |
| Hex | `hexes` | Tiles del mapa hexagonal | [→](entities/hex.md) |
| GameMap | `game_maps` | Mapas contenedores de hexes | [→](entities/game-map.md) |
| PartyState | `party_state` | Estado compartido del grupo, versionado | [→](entities/party-state.md) |

---

## Flows

| Flow | Description | Doc |
|------|-------------|-----|
| Auth | Registro, login, refresh, logout (JWT) | [→](flows/auth.md) |
| Character Import | Importar PC desde Pathbuilder2e | [→](flows/character-import.md) |
| Session Lifecycle | draft → played → published | [→](flows/session-lifecycle.md) |
| XP | Envío pendiente → aprobación GM | [→](flows/xp.md) |
| Loot | Pool unclaimed → reclamado / party | [→](flows/loot.md) |
| Hex Travel | Pathfinding Dijkstra por terreno y rasgos lineales | [→](flows/hex-travel.md) |
| Location Visibility | public / party / gm_only / custom | [→](flows/location-visibility.md) |
| Access Control | Guards, roles, visibilidad por capas | [→](flows/access-control.md) |

---

## Roles de usuario

| Rol | Permisos |
|-----|----------|
| Anónimo | Leer sesiones publicadas, party_state, perfil público de characters |
| Player | Editar su character, crear events, enviar XP (pending), reclamar loot, escribir notas propias |
| GM | Todo — aprobar XP, asignar loot, ver fichas completas, leer notas de todos, ver info privada de locations y NPCs |

---

## Estructura del monorepo

```
kmlog/
├── apps/
│   ├── api/          NestJS — src/{auth,users,characters,sessions,events,
│   │                           npcs,locations,notes,rules,hexes,maps,party-state}/
│   └── web/          Next.js 15 — src/app/ (scaffold)
├── packages/
│   ├── types/        src/index.ts — 60+ tipos compartidos
│   └── utils/        src/hex-math.ts, src/hex-travel.ts
├── turbo.json
└── pnpm-workspace.yaml
```

## Variables de entorno requeridas (API)

| Variable | Descripción |
|----------|-------------|
| `MONGODB_URI` | Connection string de MongoDB Atlas |
| `JWT_ACCESS_SECRET` | Secret para access tokens (15 min) |
| `JWT_REFRESH_SECRET` | Secret para refresh tokens (7 días) |
| `PATHBUILDER_API_URL` | `https://pathbuilder2e.com/json.php` |

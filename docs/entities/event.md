# Entity: Event / Encounter

**Collection**: `events_encounters`  
**Module**: `apps/api/src/events/`  
**Routes**: `GET/POST/PATCH/DELETE /api/sessions/:sessionId/events`

Events y encounters son la misma colección, diferenciados por el campo `kind`.

## Schema

```typescript
{
  session_id:  ObjectId     // ref Session, requerido
  kind:        'event' | 'encounter'
  
  // Solo si kind = 'event'
  event_type:  'exploration' | 'social' | 'narrative' | 'rest' | 'downtime' | null

  // Solo si kind = 'encounter'
  difficulty:  'trivial' | 'low' | 'moderate' | 'severe' | 'extreme' | null

  title:       string       // requerido
  description: string
  order:       number       // orden dentro de la sesión, default 0

  xp_entries: XpEntry[]     // embebido (ver abajo)
  loot:       LootItem[]    // embebido (ver abajo)

  createdAt: Date
  updatedAt: Date
}
```

### XpEntry (embebido)

```typescript
{
  amount:       number
  reason:       string
  status:       'pending' | 'approved' | 'rejected'
  submitted_by: ObjectId   // ref User
  reviewed_by:  ObjectId | null
  reviewed_at:  Date | null
}
```

### LootItem (embebido)

```typescript
{
  name:               string
  type:               'weapon' | 'armor' | 'consumable' | 'treasure' | 'magic' | 'other'
  value_gp:           number   // default 0
  quantity:           number   // default 1
  description:        string
  status:             'unclaimed' | 'claimed' | 'party'
  owner_character_id: ObjectId | null
}
```

## Endpoints

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| `GET` | `/api/sessions/:sessionId/events` | Público | Lista de eventos de la sesión |
| `GET` | `/api/sessions/:sessionId/events/:id` | Público | Evento por ID |
| `POST` | `/api/sessions/:sessionId/events` | JWT | Crear evento |
| `PATCH` | `/api/sessions/:sessionId/events/:id` | GM | Actualizar evento |
| `DELETE` | `/api/sessions/:sessionId/events/:id` | GM | Eliminar |
| `POST` | `/api/sessions/:sessionId/events/:id/xp` | JWT | Agregar entrada de XP (pending) |
| `PATCH` | `/api/sessions/:sessionId/events/:id/xp/:xpId/review` | GM | Aprobar / rechazar XP |
| `POST` | `/api/sessions/:sessionId/events/:id/loot` | GM | Agregar ítem de loot |
| `PATCH` | `/api/sessions/:sessionId/events/:id/loot/:lootId/claim` | JWT | Reclamar o asignar loot |

## DTOs

| DTO | Campos |
|-----|--------|
| `CreateEventDto` | `kind`, `event_type?`, `difficulty?`, `title`, `description?`, `order?` |
| `UpdateEventDto` | Todos opcionales |
| `AddXpDto` | `amount: number`, `reason: string` |
| `ReviewXpDto` | `status: 'approved' \| 'rejected'` |
| `AddLootDto` | `name`, `type`, `value_gp?`, `quantity?`, `description?` |
| `ClaimLootDto` | `status: 'claimed' \| 'party'`, `owner_character_id?` |

## Ver también

- [Flow: XP](../flows/xp.md)
- [Flow: Loot](../flows/loot.md)
- [Flow: Session Lifecycle](../flows/session-lifecycle.md)

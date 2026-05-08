# Entity: Location

**Collection**: `locations`  
**Module**: `apps/api/src/locations/`  
**Routes**: `GET/POST/PATCH/DELETE /api/locations`

## Schema

```typescript
{
  name: string                  // requerido
  type: LocationType            // ver tipos abajo
  parent_location_id: ObjectId | null    // jerarquía de locaciones
  discovered_in_session_id: ObjectId | null

  // Capa pública
  public_description: string
  public_image_urls:  string[]

  // Capa privada (solo GM)
  gm_notes:          string
  private_image_urls: string[]

  visibility: {
    mode:             'public' | 'party' | 'gm_only' | 'custom'
    allowed_user_ids: ObjectId[]  // whitelist (solo en modo 'custom')
  }

  createdAt: Date
  updatedAt: Date
}
```

### LocationType

`city | town | dungeon | wilderness | building | region | other`

## Modos de visibilidad

| Modo | Quién puede ver |
|------|----------------|
| `public` | Todos (sin auth) |
| `party` | Cualquier usuario autenticado (gm o player) |
| `gm_only` | Solo el GM |
| `custom` | Solo los users en `allowed_user_ids` (más el GM) |

La visibilidad se aplica en la consulta de listado y por ID. El GM siempre ve todo.

## Endpoints

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| `GET` | `/api/locations` | Público (opcional JWT) | Lista respetando visibilidad |
| `GET` | `/api/locations/:id` | Público (opcional JWT) | Location por ID |
| `POST` | `/api/locations` | GM | Crear |
| `PATCH` | `/api/locations/:id` | GM | Actualizar campos públicos y visibilidad |
| `PATCH` | `/api/locations/:id/private` | GM | Actualizar `gm_notes`, `private_image_urls` |
| `DELETE` | `/api/locations/:id` | GM | Eliminar |

## Relaciones

| Campo | Apunta a |
|-------|----------|
| `parent_location_id` | Location (jerarquía: region → city → building) |
| `discovered_in_session_id` | Session |

También referenciada por NPCs (`location_id`) y Hexes (`location_ids[]`).

## Ver también

- [Flow: Location Visibility](../flows/location-visibility.md)
- [Entity: NPC](npc.md)
- [Entity: Hex](hex.md)

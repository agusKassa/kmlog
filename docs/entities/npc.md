# Entity: NPC

**Collection**: `npcs`  
**Module**: `apps/api/src/npcs/`  
**Routes**: `GET/POST/PATCH/DELETE /api/npcs`

## Schema

```typescript
{
  name:        string   // requerido
  role:        'ally' | 'enemy' | 'neutral' | 'unknown'  // default: 'unknown'
  is_alive:    boolean  // default: true

  portrait_url:    string | null
  public_image_urls: string[]

  // Capa pública (visible a todos)
  public_description: string

  // Capa privada (solo GM)
  gm_notes:      string
  true_motives:  string
  stats:         Record<string, unknown> | null

  location_id:           ObjectId | null  // ubicación actual, ref Location
  first_seen_session_id: ObjectId | null  // ref Session

  createdAt: Date
  updatedAt: Date
}
```

## Visibilidad de campos

| Campo | Anónimo | Player | GM |
|-------|---------|--------|----|
| `name`, `role`, `is_alive` | ✅ | ✅ | ✅ |
| `portrait_url`, `public_image_urls` | ✅ | ✅ | ✅ |
| `public_description` | ✅ | ✅ | ✅ |
| `gm_notes` | ❌ | ❌ | ✅ |
| `true_motives` | ❌ | ❌ | ✅ |
| `stats` | ❌ | ❌ | ✅ |

La proyección de campos privados se aplica en el servicio antes de devolver el resultado.

## Endpoints

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| `GET` | `/api/npcs` | Público (opcional JWT) | Lista de NPCs; GM ve campos privados |
| `GET` | `/api/npcs/:id` | Público (opcional JWT) | NPC por ID |
| `POST` | `/api/npcs` | GM | Crear NPC |
| `PATCH` | `/api/npcs/:id` | GM | Actualizar campos públicos |
| `PATCH` | `/api/npcs/:id/private` | GM | Actualizar `gm_notes`, `true_motives`, `stats` |
| `DELETE` | `/api/npcs/:id` | GM | Eliminar |

## Relaciones

| Campo | Apunta a |
|-------|----------|
| `location_id` | Location (ubicación actual) |
| `first_seen_session_id` | Session (primera aparición) |

## Ver también

- [Entity: Location](location.md)
- [Flow: Access Control](../flows/access-control.md)

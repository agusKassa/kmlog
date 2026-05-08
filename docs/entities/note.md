# Entity: Note

**Collection**: `notes`  
**Module**: `apps/api/src/notes/`  
**Routes**: `GET/POST/PATCH/DELETE /api/notes`

## Schema

```typescript
{
  author_id: ObjectId   // ref User, requerido
  title:     string | null
  content:   string     // markdown, requerido

  mentions: MentionRef[]  // refs a entidades en el contenido

  createdAt: Date
  updatedAt: Date
}
```

### MentionRef (embebido)

```typescript
{
  entity_type: 'character' | 'npc' | 'location' | 'session' | 'hex'
  entity_id:   ObjectId
}
```

Las mentions se parsean del contenido (formato `@tipo:id`) y se guardan como referencias estructuradas para linking.

## Visibilidad

| Rol | Ve |
|-----|----|
| Anónimo | ❌ (requiere JWT) |
| Player | Solo sus propias notas |
| GM | Todas las notas de todos los usuarios |

## Endpoints

Todos requieren JWT.

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/notes` | Lista — propias si player, todas si GM |
| `GET` | `/api/notes/:id` | Nota por ID (propiedad o GM) |
| `POST` | `/api/notes` | Crear nota |
| `PATCH` | `/api/notes/:id` | Editar (propia o cualquiera si GM) |
| `DELETE` | `/api/notes/:id` | Eliminar (propia o cualquiera si GM) |

## Relaciones via `mentions`

Las notas pueden referenciar cualquiera de estas entidades:

| entity_type | Colección |
|-------------|-----------|
| `character` | characters |
| `npc` | npcs |
| `location` | locations |
| `session` | sessions |
| `hex` | hexes |

## Ver también

- [Flow: Access Control](../flows/access-control.md)

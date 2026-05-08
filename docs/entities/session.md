# Entity: Session

**Collection**: `sessions`  
**Module**: `apps/api/src/sessions/`  
**Routes**: `GET/POST/PATCH/DELETE /api/sessions`

## Schema

```typescript
{
  session_number: number   // entero, requerido
  title:          string   // requerido
  date_played:    Date | null
  preamble:       string   // contexto / setup previo a la sesión
  summary:        string   // resumen / resultado post-sesión
  status:         'draft' | 'played' | 'published'
  attendees:      ObjectId[]  // refs a Character
  createdAt:      Date
  updatedAt:      Date
}
```

## Estados del ciclo de vida

```
draft ──→ played ──→ published
```

| Estado | Significado |
|--------|-------------|
| `draft` | La sesión está siendo preparada por el GM |
| `played` | Se jugó, en proceso de documentar |
| `published` | Visible públicamente con resumen completo |

## Endpoints

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| `GET` | `/api/sessions` | Público | Lista todas, ordenadas por `session_number` desc |
| `GET` | `/api/sessions/:id` | Público | Sesión por ID |
| `POST` | `/api/sessions` | GM | Crear sesión |
| `PATCH` | `/api/sessions/:id` | GM | Actualizar cualquier campo |
| `DELETE` | `/api/sessions/:id` | GM | Eliminar |

## DTOs

| DTO | Campos |
|-----|--------|
| `CreateSessionDto` | `session_number`, `title`, `date_played?`, `preamble?` |
| `UpdateSessionDto` | Todos opcionales: `title`, `date_played`, `preamble`, `summary`, `status`, `attendees` |

## Relaciones

| Campo | Apunta a |
|-------|----------|
| `attendees[]` | Character (PCs que asistieron) |

Events y encounters viven en su propia colección y referencian la sesión por `session_id`.

## Ver también

- [Flow: Session Lifecycle](../flows/session-lifecycle.md)
- [Entity: Event](event.md)

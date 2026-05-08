# Entity: Character

**Collection**: `characters`  
**Module**: `apps/api/src/characters/`  
**Routes**: `GET/POST/PATCH /api/characters`

## Schema

```typescript
{
  user_id:        ObjectId           // ref User, requerido
  pathbuilder_id: number | null      // ID externo en pathbuilder2e.com
  build:          PathbuilderBuild   // JSON completo de Pathbuilder, almacenado as-is
  portrait_url:   string | null      // URL de imagen (Cloudinary)
  public_bio:     string             // visible a todos los usuarios
  gm_notes:       string             // solo visible para GM
  is_active:      boolean            // solo uno activo por user
  createdAt:      Date
  updatedAt:      Date
}
```

### PathbuilderBuild

Tipo completo definido en `packages/types/src/index.ts`. Contiene stats, feats, spells, equipment y todo lo exportado por Pathbuilder2e. Se almacena sin modificación.

## Visibilidad de campos

| Campo | Anónimo | Player | GM |
|-------|---------|--------|----|
| `build` | ✅ | ✅ | ✅ |
| `portrait_url` | ✅ | ✅ | ✅ |
| `public_bio` | ✅ | ✅ | ✅ |
| `gm_notes` | ❌ | ❌ | ✅ |

## Endpoints

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| `GET` | `/api/characters` | Público | Lista todos los characters activos |
| `GET` | `/api/characters/:id` | Opcional JWT | Character por ID; GM ve `gm_notes` |
| `POST` | `/api/characters/import/pathbuilder` | JWT | Importa por `pathbuilder_id` |
| `POST` | `/api/characters/import/json` | JWT | Importa desde JSON raw de Pathbuilder |
| `PATCH` | `/api/characters/:id` | JWT (dueño o GM) | Actualiza `portrait_url`, `public_bio` |
| `PATCH` | `/api/characters/:id/gm-notes` | JWT (GM) | Actualiza `gm_notes` |

## DTOs

| DTO | Campos |
|-----|--------|
| `ImportByIdDto` | `pathbuilder_id: number` (min 1) |
| `ImportByJsonDto` | `build: PathbuilderBuild` |
| `UpdateCharacterDto` | `portrait_url?`, `public_bio?`, `gm_notes?` |
| `UpdateGmNotesDto` | `gm_notes: string` |

## Ver también

- [Flow: Character Import](../flows/character-import.md)
- [Entity: Session](session.md) — attendees
- [Entity: Event](event.md) — XP y loot por character

# Flow: Character Import

**Módulo**: `apps/api/src/characters/`

Hay dos formas de importar un personaje desde Pathbuilder2e.

## Opción A — Import por ID (recomendada)

```
POST /api/characters/import/pathbuilder
Headers: Authorization: Bearer <access_token>
Body: { pathbuilder_id: 123456 }

1. API fetches https://pathbuilder2e.com/json.php?id=123456
2. Valida que la respuesta sea un build válido
3. Desactiva el character activo anterior del user (is_active = false)
4. Crea nuevo Character con:
   - user_id = user autenticado
   - pathbuilder_id = 123456
   - build = respuesta completa de Pathbuilder (as-is)
   - is_active = true
5. Actualiza user.character_id al nuevo character
6. Devuelve el Character creado
```

## Opción B — Import por JSON raw

```
POST /api/characters/import/json
Headers: Authorization: Bearer <access_token>
Body: { build: PathbuilderBuild }

Mismo flujo desde el paso 3, sin fetch externo.
Útil si el user tiene el JSON exportado localmente.
```

## Reglas de negocio

- **Un solo character activo por user**: al importar uno nuevo, el anterior queda con `is_active: false` (no se elimina).
- El campo `build` se almacena **sin modificación** — es la fuente de verdad de la ficha.
- Después de importar, el user puede editar `portrait_url` y `public_bio` via `PATCH /api/characters/:id`.
- El GM puede editar `gm_notes` via `PATCH /api/characters/:id/gm-notes`.

## Campos que el user puede completar post-import

| Campo | Endpoint | Acceso |
|-------|----------|--------|
| `portrait_url` | `PATCH /api/characters/:id` | Dueño o GM |
| `public_bio` | `PATCH /api/characters/:id` | Dueño o GM |
| `gm_notes` | `PATCH /api/characters/:id/gm-notes` | Solo GM |

## Ver también

- [Entity: Character](../entities/character.md)
- [Entity: User](../entities/user.md)

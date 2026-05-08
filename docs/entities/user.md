# Entity: User

**Collection**: `users`  
**Module**: `apps/api/src/users/`

## Schema

```typescript
{
  email:               string   // unique, lowercase, trimmed
  username:            string   // trimmed
  password_hash:       string   // bcrypt
  role:                'gm' | 'player'  // default: 'player'
  character_id:        ObjectId | null  // active character ref
  refresh_token_hash:  string | null    // bcrypt-hashed refresh token
  createdAt:           Date
  updatedAt:           Date
}
```

## Notas clave

- No hay endpoint público de creación de usuarios — se crea vía `POST /api/auth/register`.
- `character_id` apunta al character activo. Al importar un nuevo character se actualiza automáticamente.
- `refresh_token_hash` se limpia en logout.

## Relaciones

| Campo | Apunta a |
|-------|----------|
| `character_id` | Character (activo del user) |

## Service methods

| Método | Descripción |
|--------|-------------|
| `create(input)` | Crea user nuevo |
| `findByEmail(email)` | Lookup para login |
| `findById(id)` | Lookup para sesión JWT |
| `updateRefreshToken(id, hash)` | Guarda hash del refresh token |
| `updateCharacterId(id, characterId)` | Actualiza character activo |

## Ver también

- [Flow: Auth](../flows/auth.md)
- [Flow: Access Control](../flows/access-control.md)

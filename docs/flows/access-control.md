# Flow: Access Control

**Módulos**: `apps/api/src/auth/guards/`, `apps/api/src/auth/decorators/`

## Jerarquía de roles

```
GM ──────────────────────────────────────── acceso total
Player ──────────────────────────────────── acceso propio + operaciones permitidas
Anónimo ─────────────────────────────────── solo lectura pública
```

## Guards

### JwtAuthGuard

Requiere un access token válido en `Authorization: Bearer <token>`. Si no hay token o es inválido, devuelve 401.

**Uso**: Endpoints que requieren auth (crear notas, enviar XP, reclamar loot).

### OptionalJwtGuard

Permite solicitudes sin token. Si hay token válido, inyecta el user en el request; si no, el user es `undefined`.

**Uso**: Endpoints de lectura donde la respuesta varía según rol (leer NPC con/sin `gm_notes`, leer locations según visibilidad).

### RolesGuard

Verifica que `user.role === 'gm'`. Se usa junto con el decorator `@Roles('gm')`.

**Uso**: Toda operación de escritura que solo puede hacer el GM.

### RefreshAuthGuard

Valida el refresh token. Solo se usa en `POST /api/auth/refresh`.

## Decorators

```typescript
@CurrentUser()           // parámetro: inyecta UserDocument del user autenticado
@Roles('gm')             // a nivel de handler: requiere rol GM
```

## Tabla de acceso por endpoint

| Recurso | Operación | Anónimo | Player | GM |
|---------|-----------|---------|--------|----|
| Sessions | GET (list/by-id) | ✅ | ✅ | ✅ |
| Sessions | POST / PATCH / DELETE | ❌ | ❌ | ✅ |
| Events | GET | ✅ | ✅ | ✅ |
| Events | POST (crear) | ❌ | ✅ | ✅ |
| Events | PATCH / DELETE | ❌ | ❌ | ✅ |
| XP | POST (enviar) | ❌ | ✅ | ✅ |
| XP | PATCH (revisar) | ❌ | ❌ | ✅ |
| Loot | POST (agregar) | ❌ | ❌ | ✅ |
| Loot | PATCH (reclamar propio) | ❌ | ✅ | ✅ |
| Loot | PATCH (asignar a otro) | ❌ | ❌ | ✅ |
| Characters | GET | ✅ (sin gm_notes) | ✅ (sin gm_notes) | ✅ |
| Characters | PATCH | ❌ | ✅ (propio) | ✅ |
| Characters | PATCH gm-notes | ❌ | ❌ | ✅ |
| NPCs | GET | ✅ (sin privados) | ✅ (sin privados) | ✅ |
| NPCs | POST / PATCH / DELETE | ❌ | ❌ | ✅ |
| Locations | GET | solo `public` | `public`+`party`+`custom` | ✅ |
| Locations | POST / PATCH / DELETE | ❌ | ❌ | ✅ |
| Notes | GET | ❌ | Solo propias | ✅ (todas) |
| Notes | POST / PATCH / DELETE | ❌ | Solo propias | ✅ |
| Rules | GET | ✅ (is_public only) | ✅ (is_public only) | ✅ |
| Rules | POST / PUT / DELETE | ❌ | ❌ | ✅ |
| Hexes | GET | ✅ (sin gm_notes) | ✅ (sin gm_notes) | ✅ |
| Hexes | PUT / import | ❌ | ❌ | ✅ |
| Hexes notes | POST | ❌ | ✅ | ✅ |
| Maps | GET | solo `is_public` | solo `is_public` | ✅ |
| Maps | POST / PUT / DELETE | ❌ | ❌ | ✅ |
| Party State | GET | ✅ | ✅ | ✅ |
| Party State | PUT | ❌ | ✅ | ✅ |
| Auth | register / login | ✅ | ✅ | ✅ |
| Auth | refresh / logout | ❌ | ✅ | ✅ |

## Ver también

- [Flow: Auth](auth.md)
- [Flow: Location Visibility](location-visibility.md)

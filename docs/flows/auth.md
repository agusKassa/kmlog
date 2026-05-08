# Flow: Auth

**Módulo**: `apps/api/src/auth/`  
**Estrategia**: JWT con access token (15 min) + refresh token (7 días)

## Registro

```
POST /api/auth/register
Body: { email, username, password, role? }

1. Hashea password con bcrypt
2. Crea User en DB
3. Emite access_token + refresh_token
4. Guarda bcrypt(refresh_token) en user.refresh_token_hash
```

## Login

```
POST /api/auth/login
Body: { email, password }

1. Busca user por email
2. Valida password contra password_hash
3. Emite access_token + refresh_token frescos
4. Actualiza refresh_token_hash
```

## Refresh

```
POST /api/auth/refresh
Headers: Authorization: Bearer <refresh_token>

1. JwtRefreshStrategy valida el refresh token
2. Compara bcrypt contra refresh_token_hash almacenado
3. Emite nuevo access_token
```

## Logout

```
POST /api/auth/logout
Headers: Authorization: Bearer <access_token>

1. Limpia refresh_token_hash (lo setea a null)
2. El refresh token queda inválido en el próximo intento
```

## Guards disponibles

| Guard | Uso |
|-------|-----|
| `JwtAuthGuard` | Requiere access token válido; rechaza si ausente |
| `RefreshAuthGuard` | Requiere refresh token válido; usado solo en `/refresh` |
| `RolesGuard` | Combinar con `@Roles('gm')` para restricción de rol |
| `OptionalJwtGuard` | Permite anónimos pero inyecta user si hay token válido |

## Decorators

```typescript
@CurrentUser()  // inyecta el UserDocument autenticado en el handler
@Roles('gm')    // declarar rol requerido (usar con RolesGuard)
```

## Secretos requeridos

```
JWT_ACCESS_SECRET   — secret para firmar access tokens
JWT_REFRESH_SECRET  — secret para firmar refresh tokens
```

## Ver también

- [Entity: User](../entities/user.md)
- [Flow: Access Control](access-control.md)

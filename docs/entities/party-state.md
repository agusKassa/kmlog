# Entity: PartyState

**Collection**: `party_state`  
**Module**: `apps/api/src/party-state/`  
**Routes**: `GET/PUT /api/party-state`

Es un **documento único** — no se crean múltiples instancias. Representa el estado compartido actual del grupo, con historial de versiones embebido.

## Schema

```typescript
{
  current_content: string   // markdown — estado actual de la party

  versions: VersionEntry[]  // historial de versiones anteriores

  last_updated_by: ObjectId | null  // ref User
  updated_at:      Date | null
}
```

### VersionEntry (embebido)

```typescript
{
  content:      string    // contenido archivado
  updated_by:   ObjectId  // ref User
  updated_at:   Date
  version_note: string | null  // descripción del cambio
}
```

## Comportamiento al actualizar

Al hacer `PUT /api/party-state`, el servicio:
1. Copia el `current_content` actual al array `versions` (con timestamp y autor)
2. Reemplaza `current_content` con el nuevo contenido
3. Actualiza `last_updated_by` y `updated_at`

El array `versions` crece indefinidamente — no hay límite de versiones.

## Endpoints

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| `GET` | `/api/party-state` | Público | Estado actual (markdown) |
| `GET` | `/api/party-state/versions` | JWT | Historial de versiones |
| `PUT` | `/api/party-state` | JWT | Actualizar estado (archiva versión anterior) |

## DTO

```typescript
UpdatePartyStateDto {
  content:      string          // nuevo contenido markdown
  version_note: string | null   // descripción del cambio (opcional)
}
```

## Casos de uso típicos

- El GM actualiza el estado de la campaña después de cada sesión
- Players consultan el resumen para recordar dónde quedaron
- Se puede ver el historial para entender la evolución de la trama

# Flow: XP

**Módulo**: `apps/api/src/events/`  
**Modelo**: `XpEntry` embebido en `Event`

## Estados de una entrada de XP

```
pending ──→ approved
        └─→ rejected
```

## Flujo completo

### 1. Player (o GM) envía XP

```
POST /api/sessions/:sessionId/events/:eventId/xp
Headers: Authorization: Bearer <access_token>
Body: { amount: 80, reason: "Derrota del ogro" }

→ Crea XpEntry con status: 'pending', submitted_by = user autenticado
```

Cualquier usuario autenticado puede enviar XP. El GM puede hacerlo directamente.

### 2. GM revisa el XP pendiente

```
PATCH /api/sessions/:sessionId/events/:eventId/xp/:xpId/review
Headers: Authorization: Bearer <gm_token>
Body: { status: "approved" }  // o "rejected"

→ Actualiza XpEntry:
  - status: 'approved' | 'rejected'
  - reviewed_by: GM user id
  - reviewed_at: now
```

### 3. Cálculo de XP total

El XP total de un character no se almacena. Se calcula en consulta:

```
XP total = suma de xp_entries donde:
  - status === 'approved'
  - el character está en session.attendees de la sesión del evento
```

### Alerta de nivel

Al alcanzar **1000 XP acumulados** (milestone de PF2e Remaster), el sistema puede emitir una alerta. La lógica se evalúa post-aprobación.

## Estructura XpEntry

```typescript
{
  amount:       number
  reason:       string
  status:       'pending' | 'approved' | 'rejected'
  submitted_by: ObjectId   // ref User
  reviewed_by:  ObjectId | null
  reviewed_at:  Date | null
}
```

## Ver también

- [Entity: Event](../entities/event.md)
- [Flow: Session Lifecycle](session-lifecycle.md)

# Flow: Session Lifecycle

**Módulo**: `apps/api/src/sessions/`

## Estados

```
draft ──────→ played ──────→ published
  │                              │
  └──── solo GM puede mover ─────┘
```

| Estado | Descripción |
|--------|-------------|
| `draft` | El GM prepara la sesión antes de jugar |
| `played` | Se jugó; el GM documenta el resumen |
| `published` | Visible públicamente con resumen final |

## Paso a paso

### 1. Crear sesión (GM)

```
POST /api/sessions
Body: {
  session_number: 7,
  title: "El Puente de Orvinos",
  date_played: "2026-05-01",
  preamble: "La party llega al río Tarn..."
}
→ status: 'draft' por defecto
```

### 2. Agregar eventos durante la sesión (GM o players)

```
POST /api/sessions/:id/events
Body: { kind: "encounter", difficulty: "moderate", title: "Emboscada de kobolds" }
```

Players pueden crear eventos durante la sesión. Solo el GM puede editarlos o eliminarlos.

### 3. Post-sesión: documentar y publicar (GM)

```
PATCH /api/sessions/:id
Body: {
  summary: "La party cruzó el puente y derrotó...",
  status: "played",
  attendees: ["characterId1", "characterId2"]
}
```

```
PATCH /api/sessions/:id
Body: { status: "published" }
```

### 4. Vista pública

Sesiones con `status: 'published'` son visibles en `GET /api/sessions` sin auth.  
Los eventos anidados también son públicos (sin campos privados del GM).

## Attendees y XP

Los `attendees` de una sesión son los character IDs que asistieron. El XP total de un character se calcula sumando las `xp_entries` aprobadas de eventos en sesiones donde ese character aparece en `attendees`.

## Ver también

- [Entity: Session](../entities/session.md)
- [Entity: Event](../entities/event.md)
- [Flow: XP](xp.md)

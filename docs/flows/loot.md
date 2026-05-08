# Flow: Loot

**Módulo**: `apps/api/src/events/`  
**Modelo**: `LootItem` embebido en `Event`

## Estados de un ítem de loot

```
unclaimed ──→ claimed  (player reclama para su character)
          └─→ party    (GM asigna como uso grupal)
```

## Flujo completo

### 1. GM agrega loot a un evento

```
POST /api/sessions/:sessionId/events/:eventId/loot
Headers: Authorization: Bearer <gm_token>
Body: {
  name: "Espada larga +1",
  type: "weapon",
  value_gp: 35,
  quantity: 1,
  description: "Inscripción élfica en la hoja"
}

→ Crea LootItem con status: 'unclaimed'
```

Solo el GM puede agregar loot.

### 2. Toda la party ve el pool sin reclamar

`GET /api/sessions/:sessionId/events/:eventId` devuelve el array `loot` completo.  
Items `unclaimed` son visibles para todos los usuarios autenticados.

### 3a. Player reclama un ítem

```
PATCH /api/sessions/:sessionId/events/:eventId/loot/:lootId/claim
Headers: Authorization: Bearer <player_token>
Body: { status: "claimed", owner_character_id: "characterId" }

→ LootItem.status = 'claimed'
→ LootItem.owner_character_id = character del player
```

Un player solo puede reclamar para su propio character (`character_id` del user autenticado).

### 3b. GM asigna ítem a un character

```
PATCH /api/sessions/:sessionId/events/:eventId/loot/:lootId/claim
Headers: Authorization: Bearer <gm_token>
Body: { status: "claimed", owner_character_id: "anyCharacterId" }

→ GM puede asignar a cualquier character
```

### 3c. GM marca ítem como uso de party

```
PATCH /api/sessions/:sessionId/events/:eventId/loot/:lootId/claim
Headers: Authorization: Bearer <gm_token>
Body: { status: "party" }

→ LootItem.status = 'party', owner_character_id queda null
```

## Estructura LootItem

```typescript
{
  name:               string
  type:               'weapon' | 'armor' | 'consumable' | 'treasure' | 'magic' | 'other'
  value_gp:           number   // valor en monedas de oro
  quantity:           number
  description:        string
  status:             'unclaimed' | 'claimed' | 'party'
  owner_character_id: ObjectId | null
}
```

## Reglas de claim

| Acción | Player | GM |
|--------|--------|----|
| Reclamar para propio character | ✅ | ✅ |
| Reclamar para otro character | ❌ | ✅ |
| Marcar como `party` | ❌ | ✅ |

## Ver también

- [Entity: Event](../entities/event.md)
- [Entity: Character](../entities/character.md)

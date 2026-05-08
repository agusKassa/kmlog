# Flow: Hex Travel

**Utils**: `packages/utils/src/hex-math.ts`, `packages/utils/src/hex-travel.ts`  
**Módulos API**: `apps/api/src/hexes/`, `apps/api/src/maps/`

## Concepto

El mapa es un grid hexagonal pointy-top con coordenadas axiales `(q, r)`. El algoritmo de viaje calcula el camino de menor coste en horas desde un hex origen a un destino, considerando terreno y rasgos lineales (caminos, ríos, acantilados).

## Costos de terreno (horas por hex)

| Terrain | Horas |
|---------|-------|
| `plains` | 8h |
| `hills` | 16h |
| `forest` | 16h |
| `swamp` | 24h |
| `mountains` | 24h |
| `desert` | 16h |
| `tundra` | 16h |
| `lake` | ∞ (impasable) |
| `ocean` | ∞ (impasable) |

Costo base: `terrain_cost × (hex_size_miles / (party_speed_ft × 0.000189394))` — normalizado a las unidades de `GameMap.hex_config`.

## Modificadores de rasgos lineales

Los `linear_features` de un hex ajustan el costo del borde cruzado:

| LinearFeatureType | Multiplicador |
|-------------------|--------------|
| `road` | ×0.5 (mitad del tiempo) |
| `river` | ×1.5 |
| `cliff` | ×2.0 |
| `coast` | ×1.0 (sin efecto) |
| `wall` | ×3.0 |

## Pathfinding (Dijkstra)

```typescript
// packages/utils/src/hex-travel.ts
dijkstra(hexMap, startCoord, endCoord, hexSizeMiles, travelHoursPerDay, partySpeedFt)
→ { path: Coord[], totalHours: number }
```

El algoritmo:
1. Inicializa distancias a ∞ para todos los hexes
2. Explora vecinos de cada hex usando `hexNeighbors(q, r)`
3. Para cada borde aplica el costo de terreno + modificador de rasgos lineales
4. Reconstruye el camino óptimo con `reconstructPath()`

`hoursToDays(hours, travelHoursPerDay)` convierte el resultado a días de viaje.

## Utilidades de grid (`hex-math.ts`)

```typescript
axialToPixel(q, r, size)     → { x, y }         // para render en canvas
hexPointOffset(center, i, size) → { x, y }       // vértice i del hex (0-5)
hexVertices(center, size)    → Point[]            // 6 vértices del hex
hexNeighbors(q, r)           → Coord[]            // 6 hexes adyacentes
axialDistance(a, b)          → number             // distancia en hexes (Manhattan axial)
```

## Flujo de uso en la app

```
1. GM crea GameMap con hex_config (tamaño, velocidad party, horas/día)
2. GM importa hexes via POST /api/maps/:mapId/hexes/import
   → cada hex tiene terrain + linear_features
3. Client calcula ruta: dijkstra(hexes, origen, destino, config)
4. GM actualiza posición: PUT /api/maps/:mapId { current_party_hex_id }
```

## Ver también

- [Entity: Hex](../entities/hex.md)
- [Entity: GameMap](../entities/game-map.md)

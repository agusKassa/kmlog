# Entity: Hex

**Collection**: `hexes`  
**Module**: `apps/api/src/hexes/`  
**Routes**: `/api/maps/:mapId/hexes`

## Schema

```typescript
{
  map_id: ObjectId   // ref GameMap, indexado
  q:      number     // coordenada axial — columna
  r:      number     // coordenada axial — fila

  terrain:     TerrainType
  region:      string | null  // nombre de región cultural/política
  is_explored: boolean        // default: false

  point_features: PointFeature[]   // ciudades, pueblos, dungeons, etc. en vértices
  linear_features: LinearFeature[] // caminos, ríos, acantilados entre hexes

  party_summary: string | null  // lo que la party sabe de este hex
  gm_notes:      string | null  // notas privadas del GM

  session_ids:  ObjectId[]  // sesiones donde fue explorado
  location_ids: ObjectId[]  // locations contenidas en este hex

  notes: HexNote[]   // notas de usuarios (público o privado)

  createdAt: Date
  updatedAt: Date

  // Índice único: { map_id, q, r }
}
```

### TerrainType

`plains | hills | forest | swamp | mountains | desert | tundra | lake | ocean | other`

### PointFeature (embebido)

```typescript
{
  type:        HexFeatureType   // city | town | village | dungeon | landmark | port | fort | other
  position:    0 | 1 | 2 | 3 | 4 | 5 | 6   // 0 = centro, 1-6 = vértices (pointy-top)
  label:       string | null
  location_id: ObjectId | null  // ref Location
}
```

### LinearFeature (embebido)

```typescript
{
  type: LinearFeatureType   // road | river | cliff | coast | wall | other
  path: HexPoint[]          // vértices de entrada/salida (ej: [6, 0, 3] = NW → centro → SE)
}
```

### HexNote (embebido)

```typescript
{
  author_id:  ObjectId
  content:    string
  is_public:  boolean
  created_at: Date
}
```

## Visibilidad

| Campo | Player | GM |
|-------|--------|----|
| Todos excepto `gm_notes` | ✅ | ✅ |
| `gm_notes` | ❌ | ✅ |
| Notas con `is_public: true` | ✅ | ✅ |
| Notas con `is_public: false` | Solo autor | ✅ |

## Endpoints

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| `GET` | `/api/maps/:mapId/hexes` | Público (opcional JWT) | Todos los hexes del mapa |
| `GET` | `/api/maps/:mapId/hexes/:id` | Público (opcional JWT) | Hex por ID |
| `PUT` | `/api/maps/:mapId/hexes/:id` | GM | Actualizar hex |
| `POST` | `/api/maps/:mapId/hexes/:id/notes` | JWT | Agregar nota al hex |
| `DELETE` | `/api/maps/:mapId/hexes/:hexId/notes/:noteId` | JWT | Eliminar nota (propia o GM) |
| `POST` | `/api/maps/:mapId/hexes/import` | GM | Bulk import / upsert de hexes |

### Bulk import

`POST /api/maps/:mapId/hexes/import` acepta `{ hexes: HexData[] }` y hace upsert por `{ map_id, q, r }`. Devuelve `{ inserted: number, updated: number }`.

## Sistema de coordenadas

Grid hexagonal pointy-top con coordenadas axiales (q, r). Las utilidades de cálculo están en `packages/utils/src/hex-math.ts`:

- `axialToPixel(q, r, size)` — coordenadas en pixels
- `hexNeighbors(q, r)` — los 6 vecinos
- `axialDistance(a, b)` — distancia en hexes

## Ver también

- [Entity: GameMap](game-map.md)
- [Flow: Hex Travel](../flows/hex-travel.md)

# Entity: GameMap

**Collection**: `game_maps`  
**Module**: `apps/api/src/maps/`  
**Routes**: `GET/POST/PUT/DELETE /api/maps`

## Schema

```typescript
{
  name: string   // requerido

  hex_config: {
    hex_size_px:         number  // tamaño en pixels (para render)
    cols:                number  // columnas del grid
    rows:                number  // filas del grid
    hex_size_miles:      number  // tamaño real en millas (para cálculo de viaje)
    travel_hours_per_day: number // horas de viaje por día (default: 8)
    party_speed_ft:      number  // velocidad de la party en pies (default: 25)
  }

  current_party_hex_id: ObjectId | null  // posición actual de la party
  reference_image_url:  string | null    // imagen de referencia del mapa
  is_public:            boolean          // default: false

  createdAt: Date
  updatedAt: Date
}
```

## Visibilidad

| `is_public` | Quién ve |
|-------------|----------|
| `true` | Todos (sin auth) |
| `false` | Solo GM (autenticado) |

## Endpoints

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| `GET` | `/api/maps` | Público (opcional JWT) | Mapas públicos + todos si GM |
| `GET` | `/api/maps/:id` | Público (opcional JWT) | Mapa por ID si es público o GM |
| `POST` | `/api/maps` | GM | Crear mapa |
| `PUT` | `/api/maps/:id` | GM | Actualizar (posición party, config, etc.) |
| `DELETE` | `/api/maps/:id` | GM | Eliminar |

## Relaciones

| Campo | Apunta a |
|-------|----------|
| `current_party_hex_id` | Hex (posición actual) |

Los hexes que pertenecen a este mapa referencian el mapa por `map_id`.

## Ver también

- [Entity: Hex](hex.md)
- [Flow: Hex Travel](../flows/hex-travel.md)

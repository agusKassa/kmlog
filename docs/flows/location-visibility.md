# Flow: Location Visibility

**Módulo**: `apps/api/src/locations/`

## Modos de visibilidad

Cada Location tiene un campo `visibility.mode` que controla quién puede verla:

| Modo | Quién puede verla |
|------|------------------|
| `public` | Todos, incluido anónimos sin auth |
| `party` | Cualquier usuario autenticado (player o GM) |
| `gm_only` | Solo el GM |
| `custom` | Lista explícita de user IDs en `visibility.allowed_user_ids`, más el GM |

El GM siempre ve todas las locations independientemente del modo.

## Cómo se aplica

El filtro se aplica en el servicio al construir la query de Mongoose:

```typescript
// Pseudocódigo de la lógica de filtrado
if (user?.role === 'gm') {
  // sin filtro — ve todo
} else if (user) {
  // player autenticado: public + party + custom donde user está en allowed_user_ids
  filter = {
    $or: [
      { 'visibility.mode': 'public' },
      { 'visibility.mode': 'party' },
      { 'visibility.mode': 'custom', 'visibility.allowed_user_ids': user._id }
    ]
  }
} else {
  // anónimo: solo public
  filter = { 'visibility.mode': 'public' }
}
```

## Capas de información

Además del filtro de visibilidad, hay dos capas de datos:

| Campo | Player ve | GM ve |
|-------|-----------|-------|
| `public_description` | ✅ | ✅ |
| `public_image_urls` | ✅ | ✅ |
| `gm_notes` | ❌ | ✅ |
| `private_image_urls` | ❌ | ✅ |

La proyección de campos privados se aplica después del filtro de visibilidad.

## Configurar visibilidad (GM)

```
PATCH /api/locations/:id
Body: {
  visibility: {
    mode: "custom",
    allowed_user_ids: ["userId1", "userId2"]
  }
}
```

## Jerarquía de locations

Las locations pueden tener `parent_location_id` para modelar jerarquías:

```
Region (gm_only)
└── City (party)
    ├── Tavern (public)
    └── Mage Tower (gm_only)
```

La visibilidad es independiente por location — una location hija puede ser más pública que su padre.

## Ver también

- [Entity: Location](../entities/location.md)
- [Flow: Access Control](access-control.md)

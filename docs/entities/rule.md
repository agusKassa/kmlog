# Entity: Rule / RuleCategory

**Collections**: `rules`, `rule_categories`  
**Module**: `apps/api/src/rules/`  
**Routes**: `/api/rules`, `/api/rules/categories`

## RuleCategory Schema

```typescript
{
  name:       string   // único
  slug:       string   // único, lowercase (ej: "house-rules")
  is_default: boolean  // las categorías default no se pueden eliminar
  createdAt:  Date
  updatedAt:  Date
}
```

### Categorías por defecto (auto-seeded)

`combat` · `exploration` · `social` · `conditions` · `ancestry` · `class` · `magic` · `items` · `house-rules` · `general`

## Rule Schema

```typescript
{
  title:       string    // requerido, indexado para full-text
  category_id: ObjectId  // ref RuleCategory
  content:     string    // markdown, requerido, indexado para full-text
  tags:        string[]  // indexado para full-text
  source:      string | null  // referencia de libro/página (ej: "CRB p.278")
  is_public:   boolean   // default: true
  createdAt:   Date
  updatedAt:   Date
}
```

## Visibilidad

| Campo | Player | GM |
|-------|--------|----|
| `is_public: true` | ✅ | ✅ |
| `is_public: false` | ❌ | ✅ |

## Endpoints

### Categorías

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| `GET` | `/api/rules/categories` | Público | Lista todas las categorías |
| `POST` | `/api/rules/categories` | GM | Crear categoría |
| `DELETE` | `/api/rules/categories/:id` | GM | Eliminar (solo si no es default) |

### Reglas

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| `GET` | `/api/rules?q=&category=` | Público (opcional JWT) | Búsqueda full-text con filtro de categoría |
| `GET` | `/api/rules/:id` | Público (opcional JWT) | Regla por ID |
| `POST` | `/api/rules` | GM | Crear regla |
| `PUT` | `/api/rules/:id` | GM | Reemplazar regla completa |
| `DELETE` | `/api/rules/:id` | GM | Eliminar |

### Query params para búsqueda

| Param | Tipo | Descripción |
|-------|------|-------------|
| `q` | string | Texto libre — busca en `title`, `content`, `tags` |
| `category` | ObjectId | Filtrar por categoría |

Full-text index de MongoDB sobre `title + content + tags`.

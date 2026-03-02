# ADR-007: Tenant Theming

## Status
Accepted

## Decision
- 5 predefined color palettes stored as CSS custom properties on `:root`
- Dark mode via TailwindCSS `class` strategy (toggle adds/removes `dark` class on `<html>`)
- Tenant selects palette in Settings → stored in backend Branding model
- On load, palette is fetched and applied via CSS variables
- Each palette includes: primary, accent, background, surface, text, border, success, warning, error

## Palettes
| Name | Primary | Accent |
|------|---------|--------|
| Profesional Azul | #2563EB | #3B82F6 |
| Cálido Terracota | #C2410C | #EA580C |
| Moderno Oscuro | #1E293B | #6366F1 |
| Sereno Verde | #059669 | #10B981 |
| Neutro Elegante | #6B7280 | #8B5CF6 |

## Consequences
- Adding new palettes = adding CSS variables (no code changes)
- Dark mode works independently of palette selection
- Palette changes apply instantly (CSS variables, no reload)

# ADR-004: Feature Folders Architecture

## Status
Accepted

## Context
Need modular architecture that scales with the number of domain modules.

## Decision
Each domain is a self-contained folder under `src/features/`:

```
features/[domain]/
  components/    # UI components exclusive to this domain
  hooks/         # TanStack Query hooks + custom hooks
  services/      # Axios API calls (plain objects, no classes)
  stores/        # Zustand slices (if needed)
  schemas/       # Zod validation schemas
  types.ts       # TypeScript types
  index.ts       # Public barrel export
```

## Rules
1. Features **never** import from other features directly
2. Shared logic goes to `components/shared/` or `lib/`
3. Each feature exports only via `index.ts` barrel file
4. ESLint `no-restricted-imports` enforces boundaries

## Consequences
- Each feature can be understood in isolation
- Easy to delete/refactor a feature without side effects
- Clear dependency graph

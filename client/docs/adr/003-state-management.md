# ADR-003: State Management

## Status
Accepted

## Context
Need to manage both server state (API data) and client state (UI, auth).

## Decision
- **Server state**: TanStack Query (queries, mutations, cache, invalidation)
- **Client state**: Zustand (auth store, UI preferences, tenant context)
- No Redux, no Context API for global state

## Consequences
- Clear separation: TanStack Query owns all API data, Zustand owns UI/auth state
- Simple API: no boilerplate (vs Redux)
- Zustand persists only non-sensitive data (theme, sidebar state)

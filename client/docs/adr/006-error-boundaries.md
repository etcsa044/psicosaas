# ADR-006: Error Boundary Strategy

## Status
Accepted

## Decision
Three levels of error boundaries:

1. **`app/error.tsx`** — Global: catastrophic fallback (logo + retry + support link)
2. **`app/(auth)/error.tsx`** — Dashboard: maintains sidebar/topbar, error in content area
3. **`app/(auth)/[module]/error.tsx`** — Module: isolated failure, retry per module

API errors follow a standard mapping from backend codes to user-friendly messages. Raw backend errors are never shown to users.

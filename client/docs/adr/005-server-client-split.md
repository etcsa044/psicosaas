# ADR-005: Server vs Client Components

## Status
Accepted

## Context
Next.js App Router defaults to Server Components. Need strategy for when to use each.

## Decision

| Use Case | Component Type | Reason |
|----------|---------------|--------|
| Landing, Pricing | Server | SEO, no JS needed |
| Login/Register | Client | Forms, token handling |
| Dashboard layout shell | Server | Static, reads cookie |
| Dashboard content | Client | TanStack Query, interactivity |
| Settings forms | Client | React Hook Form |
| Error boundaries | Client | Requires useState/reset |

**Pattern**: Page files (`page.tsx`) are thin Server Components that import Client Component views.

```tsx
// app/(auth)/patients/page.tsx — Server Component
import { PatientListView } from '@/features/patients';
export default function PatientsPage() {
    return <PatientListView />;
}
```

## Consequences
- Fast initial HTML streaming
- JavaScript only where needed
- SEO for public pages
- TanStack Query works correctly in Client Components

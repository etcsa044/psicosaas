# ADR-001: BFF Authentication Pattern

## Status
Accepted

## Context
The Express backend returns access + refresh tokens in the JSON response body. For security, tokens should not be stored in localStorage (XSS risk).

## Decision
Implement a Backend for Frontend (BFF) using Next.js API Routes:
- `POST /api/auth/login` → proxies to Express, sets refresh token as **HttpOnly, Secure, SameSite=Strict** cookie
- `POST /api/auth/refresh` → reads cookie, proxies to Express, rotates cookie
- `POST /api/auth/logout` → clears cookie, revokes token in Express
- Access token returned in response body → stored in memory (Zustand)

## Consequences
- Zero changes to Express backend
- Refresh token never accessible via JavaScript
- Access token survives only in-memory (lost on F5 → silent refresh recovers it)
- BFF adds ~50ms latency to auth operations (acceptable)

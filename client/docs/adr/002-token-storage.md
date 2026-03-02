# ADR-002: Token Storage Strategy

## Status
Accepted

## Context
Tokens must be protected from XSS attacks. localStorage/sessionStorage are vulnerable.

## Decision
- **Access token**: Stored in Zustand store (JavaScript memory only)
- **Refresh token**: HttpOnly cookie set by BFF (never accessible to JS)
- On page reload: AuthProvider triggers silent refresh to restore access token
- On tab close: Access token is lost, recovered on next load via cookie

## Consequences
- XSS cannot steal tokens
- Page refresh triggers one extra API call (silent refresh)
- Concurrent tabs share the same cookie but maintain independent access tokens in memory

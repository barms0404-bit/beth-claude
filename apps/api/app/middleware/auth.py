"""Supabase JWT verification.

Gated by `REQUIRE_AUTH` — when false (development default) every request passes
freely; when true the Authorization: Bearer <jwt> header is verified against
`SUPABASE_JWT_SECRET` (HS256, Supabase default).

WebSockets pass `?token=<jwt>` as a query parameter; `verify_ws_token()` handles
those connections.
"""

from __future__ import annotations

from typing import Any

import jwt as pyjwt
from fastapi import HTTPException, Query, Request, status

from app.config import get_settings


# Routes that bypass auth even when REQUIRE_AUTH=true.
PUBLIC_PATH_PREFIXES: tuple[str, ...] = (
    "/health",
    "/webhooks",   # signature-verified inside the handler
    "/reports",    # static-mounted archive HTML, non-sensitive
    "/docs",
    "/openapi.json",
)


def verify_jwt(token: str) -> dict[str, Any]:
    """Verify a Supabase HS256 JWT. Raises HTTPException(401) on failure."""
    settings = get_settings()
    if not settings.supabase_jwt_secret:
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "SUPABASE_JWT_SECRET not configured but REQUIRE_AUTH is on.",
        )
    try:
        return pyjwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "JWT expired")
    except pyjwt.InvalidTokenError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, f"Invalid JWT: {exc}")


async def auth_middleware(request: Request, call_next):
    """HTTP middleware — applies to every request when REQUIRE_AUTH=true."""
    settings = get_settings()
    if not settings.require_auth:
        return await call_next(request)

    path = request.url.path
    if any(path == p or path.startswith(p + "/") or path.startswith(p) for p in PUBLIC_PATH_PREFIXES):
        return await call_next(request)

    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.lower().startswith("bearer "):
        from starlette.responses import JSONResponse

        return JSONResponse({"detail": "Missing bearer token"}, status_code=401)
    try:
        claims = verify_jwt(auth_header.split(None, 1)[1])
    except HTTPException as exc:
        from starlette.responses import JSONResponse

        return JSONResponse({"detail": exc.detail}, status_code=exc.status_code)
    request.state.user = claims
    return await call_next(request)


async def verify_ws_token(token: str | None = Query(None)) -> dict[str, Any]:
    """WebSocket auth dependency — passes silently when REQUIRE_AUTH=false."""
    settings = get_settings()
    if not settings.require_auth:
        return {}
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing ?token query param")
    return verify_jwt(token)

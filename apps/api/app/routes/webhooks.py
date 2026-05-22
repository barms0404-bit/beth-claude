"""Resend webhook receiver — Svix-signed delivery / bounce / complaint events.

Resend signs every webhook with Svix using the format:

    HMAC-SHA256(secret, "{msg_id}.{timestamp}.{body}")

and ships the signatures in the ``svix-signature`` header as one or more
``v1,<base64sig>`` tokens, space-separated. We verify all of them constant-time.
The decoded HMAC key is the part after ``whsec_`` in the configured secret.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import logging

from fastapi import APIRouter, Header, HTTPException, Request, status

from app.config import get_settings

logger = logging.getLogger("webhooks")

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


def _verify_svix(
    body: bytes, msg_id: str, timestamp: str, signature_header: str, secret: str
) -> bool:
    if secret.startswith("whsec_"):
        secret = secret[len("whsec_") :]
    try:
        key = base64.b64decode(secret)
    except Exception:
        return False
    signed_payload = f"{msg_id}.{timestamp}.".encode() + body
    expected = base64.b64encode(hmac.new(key, signed_payload, hashlib.sha256).digest()).decode()
    for token in signature_header.split():
        if token.startswith("v1,") and hmac.compare_digest(expected, token[3:]):
            return True
    return False


@router.post("/resend")
async def resend_webhook(
    request: Request,
    svix_id: str = Header(..., alias="svix-id"),
    svix_timestamp: str = Header(..., alias="svix-timestamp"),
    svix_signature: str = Header(..., alias="svix-signature"),
):
    """Receive a Resend delivery/bounce/complaint event."""
    settings = get_settings()
    if not settings.resend_webhook_secret:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "RESEND_WEBHOOK_SECRET not configured.",
        )

    body = await request.body()
    if not _verify_svix(body, svix_id, svix_timestamp, svix_signature, settings.resend_webhook_secret):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid Svix signature")

    try:
        payload = await request.json()
    except Exception:
        payload = {}

    event_type = payload.get("type", "unknown")
    data = payload.get("data") or {}
    logger.info(
        "Resend event=%s email_id=%s to=%s",
        event_type,
        data.get("email_id"),
        data.get("to"),
    )
    # TODO(step 2): persist to the audit_log table once Supabase is wired.
    return {"ok": True, "event": event_type}

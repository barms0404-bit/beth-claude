"""Anthropic (Claude) adapter for the agent fleet.

Every agent shares this one client. The agent's *system prompt* is the large,
stable part of each request, so it is sent with ``cache_control`` — repeated
specialist runs within a report window read the prompt from cache instead of
re-billing it at full rate.
"""

from __future__ import annotations

import json
from dataclasses import dataclass

from anthropic import AsyncAnthropic
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import get_settings


@dataclass
class AgentReply:
    """One model turn: raw text plus token accounting for agent_runs telemetry."""

    text: str
    prompt_tokens: int = 0
    output_tokens: int = 0
    cache_read_tokens: int = 0

    def as_json(self) -> dict:
        """Parse the reply as JSON, tolerating ```json fences and prose padding."""
        body = self.text.strip()
        if body.startswith("```"):
            body = body.split("```", 2)[1]
            if body.startswith("json"):
                body = body[4:]
        start, end = body.find("{"), body.rfind("}")
        if start == -1 or end == -1:
            raise ValueError(f"No JSON object found in model reply: {self.text[:200]}")
        return json.loads(body[start : end + 1])


_client: AsyncAnthropic | None = None


def _get_client() -> AsyncAnthropic:
    global _client
    if _client is None:
        settings = get_settings()
        if not settings.has_anthropic:
            raise RuntimeError("ANTHROPIC_API_KEY is not set — see apps/api/.env.example")
        _client = AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _client


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=20))
async def call_agent(
    *,
    system_prompt: str,
    user_message: str,
    model: str | None = None,
    max_tokens: int = 4096,
    temperature: float = 0.4,
) -> AgentReply:
    """Run one agent turn. The system prompt is cached across calls."""
    settings = get_settings()
    resp = await _get_client().messages.create(
        model=model or settings.anthropic_model,
        max_tokens=max_tokens,
        temperature=temperature,
        system=[
            {
                "type": "text",
                "text": system_prompt,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[{"role": "user", "content": user_message}],
    )
    text = "".join(block.text for block in resp.content if block.type == "text")
    usage = resp.usage
    return AgentReply(
        text=text,
        prompt_tokens=getattr(usage, "input_tokens", 0),
        output_tokens=getattr(usage, "output_tokens", 0),
        cache_read_tokens=getattr(usage, "cache_read_input_tokens", 0) or 0,
    )

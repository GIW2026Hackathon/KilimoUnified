"""Optional OpenAI-compatible explanation adapter; never computes risk."""
import json
import os
import re
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.utils import timezone


def fallback_explanation(evaluation):
    return evaluation.explanation + " " + evaluation.recommended_action


def _verified_payload(evaluation):
    evidence = evaluation.evidence
    return {
        "risk_level": evaluation.risk_level,
        "inventory_risk_level": evaluation.inventory_risk_level,
        "evidence": {
            key: evidence[key]
            for key in ("evaluation_date", "inventory", "weather", "rule_ids", "thresholds_days")
            if key in evidence
        },
        "explanation": evaluation.explanation,
        "permitted_action": evaluation.recommended_action,
    }


def _valid_response(text, evaluation):
    if not isinstance(text, str):
        return False
    text = " ".join(text.split())
    if not 20 <= len(text) <= 700:
        return False
    mentioned_levels = set(re.findall(r"\b(LOW|MEDIUM|HIGH|UNKNOWN)\b", text, re.I))
    if any(level.upper() != evaluation.risk_level for level in mentioned_levels):
        return False
    # Keep generated prose number-free; exact figures and dates remain in the
    # deterministic evidence panel where they can be rendered from the DB.
    number_words = r"\b(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|hundred|thousand|million|billion)\b"
    if re.search(r"\d|" + number_words, text, re.I):
        return False
    if re.search(r"\b(?:guarantee[sd]?|certain(?:ly)?|will prevent|will cure)\b", text, re.I):
        return False
    return text


def explain_evaluation(evaluation, *, force=False):
    """Return cached or provider explanation; safely fall back when unavailable."""
    if evaluation.ai_explanation and not force:
        return {"text": evaluation.ai_explanation, "source": "AI", "status": "CACHED"}
    token = os.environ.get("MAZIWASHIELD_AI_API_KEY", "").strip()
    endpoint = os.environ.get("MAZIWASHIELD_AI_API_URL", "").strip()
    model = os.environ.get("MAZIWASHIELD_AI_MODEL", "").strip()
    if not (token and endpoint and model):
        return {"text": fallback_explanation(evaluation), "source": "RULES", "status": "NOT_CONFIGURED"}
    prompt = (
        "Explain this verified farm risk result in plain, concise language. Do not calculate or change risk. "
        "Use only supplied facts, distinguish missing/stale data, and recommend only the permitted action. "
        "Do not add measurements, dates, guarantees, or new advice. Return only the explanation.\n"
        + json.dumps(_verified_payload(evaluation), ensure_ascii=True)
    )
    body = json.dumps({"model": model, "messages": [{"role": "user", "content": prompt}], "max_tokens": 180}).encode()
    request = Request(endpoint, data=body, headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}, method="POST")
    try:
        with urlopen(request, timeout=8) as response:
            payload = json.loads(response.read(16000).decode("utf-8"))
        text = payload["choices"][0]["message"]["content"]
        valid = _valid_response(text, evaluation)
        if not valid:
            return {"text": fallback_explanation(evaluation), "source": "RULES", "status": "INVALID_RESPONSE"}
        evaluation.ai_explanation = valid
        evaluation.ai_generated_at = timezone.now()
        evaluation.save(update_fields=["ai_explanation", "ai_generated_at"])
        return {"text": valid, "source": "AI", "status": "GENERATED"}
    except HTTPError as error:
        if error.code in (401, 403):
            status = "AUTHORIZATION_ERROR"
        elif error.code == 429:
            status = "RATE_LIMITED"
        else:
            status = "PROVIDER_ERROR"
        return {
            "text": fallback_explanation(evaluation),
            "source": "RULES",
            "status": status,
            "http_status": error.code,
        }
    except (URLError, TimeoutError, OSError, ValueError, KeyError, TypeError):
        return {"text": fallback_explanation(evaluation), "source": "RULES", "status": "UNAVAILABLE"}

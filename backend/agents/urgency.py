from backend.groq_client import chat_json
from backend.models import ExtractionResult, UrgencyResult

SYSTEM_PROMPT = """You are a triage support assistant. Based on the flagged abnormal
lab values you are given, classify overall urgency into exactly one category:
- "Routine" (mildly out of range, no immediate concern)
- "Needs Attention" (moderately abnormal, see a doctor within days/weeks)
- "Urgent" (severely abnormal, or a dangerous combination, see a doctor soon)

Return ONLY a JSON object of this exact shape:
{
  "urgency": "Routine" | "Needs Attention" | "Urgent",
  "reasoning": "1-2 sentence explanation"
}"""


def run_urgency(extraction: ExtractionResult) -> UrgencyResult:
    flagged = [v for v in extraction.values if v.flag in ("high", "low")]

    if not flagged:
        return UrgencyResult(
            urgency="Routine",
            reasoning="No abnormal values were found in the extracted report.",
        )

    lines = [
        f"- {v.test_name}: {v.value} {v.unit} ({v.flag}, reference {v.reference_range})"
        for v in flagged
    ]
    user_prompt = "Flagged values:\n" + "\n".join(lines)

    raw = chat_json(SYSTEM_PROMPT, user_prompt)
    return UrgencyResult(urgency=raw["urgency"], reasoning=raw["reasoning"])

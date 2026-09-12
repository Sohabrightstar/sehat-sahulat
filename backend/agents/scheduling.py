"""
Design choice: slot SELECTION is deterministic Python (reliable for a live demo —
you do not want an LLM picking the wrong doctor on stage). The LLM is only used to
phrase a short human-readable reason, which is a nice-to-have, not the thing you can
afford to fail during judging. If the LLM call errors, we fall back to a canned reason
so the pipeline never breaks because of this step.
"""
import json
import os
from datetime import datetime
from backend.models import ExtractionResult, UrgencyResult, DoctorSlot, SchedulingResult
from backend.groq_client import chat_json

_HERE = os.path.dirname(os.path.abspath(__file__))
_SLOTS_PATH = os.path.join(_HERE, "..", "data", "doctor_slots.json")

# crude keyword -> specialty map; extend as needed for more test types
SPECIALTY_MAP = {
    "glucose": "Endocrinologist", "hba1c": "Endocrinologist", "a1c": "Endocrinologist",
    "cholesterol": "Cardiologist", "ldl": "Cardiologist", "hdl": "Cardiologist",
    "triglyceride": "Cardiologist",
    "creatinine": "Nephrologist", "egfr": "Nephrologist", "urea": "Nephrologist",
    "bun": "Nephrologist",
    "alt": "Hepatologist", "ast": "Hepatologist", "bilirubin": "Hepatologist",
    "hemoglobin": "Hematologist", "wbc": "Hematologist", "platelet": "Hematologist",
    "tsh": "Endocrinologist", "t3": "Endocrinologist", "t4": "Endocrinologist",
    "sodium": "General Physician", "potassium": "General Physician",
    "vitamin d": "General Physician", "vitamin b12": "General Physician", "b12": "General Physician",
}


def _load_slots() -> list[DoctorSlot]:
    with open(_SLOTS_PATH, "r", encoding="utf-8") as f:
        raw = json.load(f)
    return [DoctorSlot(**s) for s in raw]


def _pick_specialty(extraction: ExtractionResult) -> str:
    flagged = [v.test_name.lower() for v in extraction.values if v.flag in ("high", "low")]
    for name in flagged:
        for keyword, specialty in SPECIALTY_MAP.items():
            if keyword in name:
                return specialty
    return "General Physician"


def _select_slot(slots: list[DoctorSlot], specialty: str, urgency: str) -> DoctorSlot:
    matching = [s for s in slots if s.specialty == specialty] or slots  # fallback to any slot
    matching_sorted = sorted(matching, key=lambda s: datetime.strptime(s.date, "%Y-%m-%d"))

    if urgency == "Urgent":
        return matching_sorted[0]
    if urgency == "Needs Attention":
        return matching_sorted[0]  # earliest within the matching set
    # Routine: prefer government hospitals, still earliest among those
    gov = [s for s in matching_sorted if s.hospital_type == "government"]
    return gov[0] if gov else matching_sorted[0]


REASON_SYSTEM_PROMPT = """You are a booking assistant. Given an urgency level and the
doctor slot that was already chosen (by rule-based logic), write ONE short sentence
explaining why this slot fits the urgency level. Do not choose a different slot —
just explain the given one.

Return ONLY JSON: {"reason": "string"}"""


def run_scheduling(extraction: ExtractionResult, urgency: UrgencyResult) -> SchedulingResult:
    slots = _load_slots()
    specialty = _pick_specialty(extraction)
    chosen = _select_slot(slots, specialty, urgency.urgency)

    try:
        raw = chat_json(
            REASON_SYSTEM_PROMPT,
            f"Urgency: {urgency.urgency}\nChosen slot: {chosen.model_dump()}",
        )
        reason = raw.get("reason") or _fallback_reason(chosen, urgency.urgency)
    except Exception:
        reason = _fallback_reason(chosen, urgency.urgency)

    return SchedulingResult(chosen_slot=chosen, reason=reason)


def _fallback_reason(slot: DoctorSlot, urgency: str) -> str:
    return (
        f"Booked with {slot.doctor_name} ({slot.specialty}) on {slot.date} at {slot.time}, "
        f"the earliest matching slot appropriate for '{urgency}' urgency."
    )

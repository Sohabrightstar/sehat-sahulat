from backend.groq_client import chat_json
from backend.models import ExtractionResult, InterpretationResult, InterpretationItem
from backend.rag.knowledge_base import retrieve

SYSTEM_PROMPT = """You are a patient-friendly medical explainer. You will receive:
1. One flagged lab value (test name, value, reference range, flag).
2. Retrieved context from a trusted medical knowledge base.

Using ONLY the retrieved context plus general medical knowledge, explain the value in
simple English AND Urdu. Cover, briefly:
- What this test measures (1 sentence)
- What the result likely means (1-2 sentences)
- A general next step (e.g. "discuss with a doctor")

NEVER state a definitive diagnosis. Use phrases like "may indicate" or "is often
associated with."

Return ONLY a JSON object of this exact shape:
{
  "explanation_en": "string",
  "explanation_ur": "string",
  "next_step": "string"
}"""


GENERAL_EXPLANATION_PROMPT = """You are a patient-friendly medical explainer. You will receive
medical information extracted from a medical document (lab report, prescription, or
clinical note). Using general medical knowledge, explain it in simple English AND Urdu.
Cover, briefly:
- What this means in plain language
- Whether it appears normal or noteworthy based on the information given
- What the treatment or advice is generally for (when applicable)

NEVER state a definitive diagnosis. Use phrases like "may indicate" or "is often
associated with."

Return ONLY a JSON object of this exact shape:
{
  "explanation_en": "string",
  "explanation_ur": "string",
  "next_step": "string"
}"""


def _explain_flagged_lab_value(v) -> InterpretationItem:
    """RAG-grounded explanation for high/low lab values (existing behavior)."""
    query = f"{v.test_name} {v.flag} {v.value} {v.unit}"
    context_chunks = retrieve(query, top_k=3)
    context_block = "\n\n".join(context_chunks) if context_chunks else "(no context found)"

    user_prompt = (
        f"Lab value:\n"
        f"test_name: {v.test_name}\n"
        f"value: {v.value} {v.unit}\n"
        f"reference_range: {v.reference_range}\n"
        f"flag: {v.flag}\n\n"
        f"Retrieved context:\n{context_block}"
    )

    raw = chat_json(SYSTEM_PROMPT, user_prompt, max_tokens=1000)
    return InterpretationItem(
        test_name=v.test_name,
        explanation_en=raw.get("explanation_en", ""),
        explanation_ur=raw.get("explanation_ur", ""),
        next_step=raw.get("next_step", ""),
    )


def _explain_general(item_type: str, label: str, content: str) -> InterpretationItem:
    """Simple patient-friendly explanation for vitals, symptoms, impression, meds, advice."""
    user_prompt = (
        f"Item type: {item_type}\n"
        f"Content: {content}\n\n"
        f"Explain this to a patient in simple English and Urdu."
    )
    raw = chat_json(GENERAL_EXPLANATION_PROMPT, user_prompt, max_tokens=1000)
    return InterpretationItem(
        test_name=label,
        explanation_en=raw.get("explanation_en", ""),
        explanation_ur=raw.get("explanation_ur", ""),
        next_step=raw.get("next_step", ""),
    )


def run_interpretation(extraction: ExtractionResult) -> InterpretationResult:
    items = []

    # 1. Abnormal lab values — RAG-grounded explanation (existing behavior)
    flagged = [v for v in extraction.values if v.flag in ("high", "low")]
    for v in flagged:
        items.append(_explain_flagged_lab_value(v))

    # 2. Vital signs — simple explanation
    for v in extraction.vitals:
        content = f"{v.test_name}: {v.value} {v.unit}".strip()
        items.append(_explain_general("vital sign", v.test_name, content))

    # 3. Symptoms
    for s in extraction.symptoms:
        items.append(_explain_general("symptom", "Symptom", s))

    # 4. Clinical impression
    if extraction.impression:
        items.append(_explain_general("clinical impression", "Clinical Impression", extraction.impression))

    # 5. Medications / treatments
    for m in extraction.medications:
        items.append(_explain_general("medication", "Medication", m))

    # 6. Advice / instructions
    for a in extraction.advice:
        items.append(_explain_general("medical advice", "Advice", a))

    return InterpretationResult(items=items)
from backend.groq_client import chat_json_with_image
from backend.models import ExtractionResult, LabValue

SYSTEM_PROMPT = """You extract information from a medical document image (lab report, prescription, or clinical note).

Return ONLY one valid JSON object.

Use exactly this structure:

{
  "values": [
    {
      "test_name": "",
      "value": "",
      "unit": "",
      "reference_range": "",
      "flag": "normal"
    }
  ],
  "vitals": [
    {
      "test_name": "",
      "value": "",
      "unit": "",
      "reference_range": "",
      "flag": "normal"
    }
  ],
  "symptoms": ["", ""],
  "impression": "",
  "medications": ["", ""],
  "advice": ["", ""],
  "raw_notes": ""
}

Rules:
- Extract ONLY clearly visible information. Do not guess or invent.
- "values" = laboratory test results with numeric results (e.g., blood glucose, cholesterol).
- "vitals" = vital signs (e.g., BP, pulse, temperature, respiration rate).
- "symptoms" = patient-reported symptoms or chief complaints.
- "impression" = doctor's written diagnosis/impression (e.g., "hypoglycemia"). Copy exactly; do not diagnose.
- "medications" = prescribed medicines or treatments (e.g., "5% Dextrose IV").
- "advice" = instructions or recommendations given to the patient.
- If a field cannot be read, use an empty string.
- flag for values and vitals: must be exactly one of: normal, high, low, unknown. Use normal if within typical adult range, unknown if uncertain.
- If a section is not present, return an empty list or empty string.
- Keep raw_notes short.
- Return valid JSON only."""


def run_extraction(image_bytes: bytes, mime_type: str = "image/jpeg") -> ExtractionResult:
    raw = chat_json_with_image(
        system_prompt=SYSTEM_PROMPT,
        user_prompt="Extract the medical information from this image. Return JSON only.",
        image_bytes=image_bytes,
        mime_type=mime_type,
    )
    values = [LabValue(**v) for v in raw.get("values", [])]
    vitals = [LabValue(**v) for v in raw.get("vitals", [])]
    return ExtractionResult(
        values=values,
        vitals=vitals,
        symptoms=raw.get("symptoms", []),
        impression=raw.get("impression", ""),
        medications=raw.get("medications", []),
        advice=raw.get("advice", []),
        raw_notes=raw.get("raw_notes"),
    )

"""
Shared data contract between the 4 agents.
Everyone on the team should import from here rather than inventing their own shapes.
"""
from typing import List, Literal, Optional
from pydantic import BaseModel, Field


# ---- Stage 1: Extraction ----

class LabValue(BaseModel):
    test_name: str
    value: str
    unit: Optional[str] = ""
    reference_range: Optional[str] = ""
    flag: Literal["normal", "high", "low", "unknown"] = "unknown"


class ExtractionResult(BaseModel):
    values: List[LabValue]
    vitals: List[LabValue] = Field(default_factory=list)
    symptoms: List[str] = Field(default_factory=list)
    impression: str = ""
    medications: List[str] = Field(default_factory=list)
    advice: List[str] = Field(default_factory=list)
    raw_notes: Optional[str] = None  # anything the model couldn't cleanly parse


# ---- Stage 2: Interpretation (RAG-grounded) ----

class InterpretationItem(BaseModel):
    test_name: str
    explanation_en: str
    explanation_ur: str
    next_step: str


class InterpretationResult(BaseModel):
    items: List[InterpretationItem]
    disclaimer: str = (
        "This is not a medical diagnosis. Please consult a doctor for confirmation."
    )


# ---- Stage 3: Risk / Urgency ----

class UrgencyResult(BaseModel):
    urgency: Literal["Routine", "Needs Attention", "Urgent"]
    reasoning: str


# ---- Stage 4: Scheduling ----

class DoctorSlot(BaseModel):
    doctor_name: str
    specialty: str
    date: str
    time: str
    hospital_type: Literal["government", "private"]


class SchedulingResult(BaseModel):
    chosen_slot: DoctorSlot
    reason: str


# ---- Full pipeline response returned to the frontend ----

class PipelineResult(BaseModel):
    extraction: ExtractionResult
    interpretation: InterpretationResult
    urgency: UrgencyResult
    scheduling: SchedulingResult


# ---- AI Mentor chat models ----

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class MentorRequest(BaseModel):
    messages: List[ChatMessage] = Field(default_factory=list)


class MentorResponse(BaseModel):
    reply: Optional[str] = None
    error: Optional[str] = None


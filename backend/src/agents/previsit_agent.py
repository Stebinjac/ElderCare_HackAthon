"""
Appoint-Ready Pre-Visit Agent
Generates targeted health questions and produces a structured pre-visit report.
"""
import os
import json
from typing import Dict, Any, List, Optional
from groq import Groq
from supabase import Client


class PreVisitAgent:
    def __init__(self, supabase: Client):
        self.supabase = supabase
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY is required")
        self.client = Groq(api_key=api_key)
        self.model = "llama-3.1-8b-instant"

    def _get_patient_context(self, patient_id: str) -> Dict[str, Any]:
        """Fetch patient health context for smarter questions."""
        user_res = self.supabase.table("users").select("name, dob, guardian_phone").eq("id", patient_id).execute()
        user = user_res.data[0] if user_res.data else {}

        vitals_res = self.supabase.table("vitals").select("*").eq("patient_id", patient_id).order("logged_at", desc=True).limit(3).execute()
        vitals = vitals_res.data or []

        meds_res = self.supabase.table("medications").select("name, dosage, frequency").eq("patient_id", patient_id).execute()
        medications = meds_res.data or []

        try:
            reports_res = self.supabase.table("medical_reports").select("*").eq("patient_id", patient_id).order("created_at", desc=True).limit(3).execute()
            reports = reports_res.data or []
        except Exception:
            reports = []  # Table may not exist or have different columns

        return {
            "patient_name": user.get("name", "Unknown"),
            "dob": user.get("dob"),
            "vitals": vitals,
            "medications": medications,
            "recent_reports": reports,
        }

    def generate_questions(self, appointment_reason: str, patient_id: str) -> List[str]:
        """Generate 4-5 targeted pre-visit questions based on the appointment reason and patient history."""
        context = self._get_patient_context(patient_id)

        prompt = f"""You are a medical intake assistant. A patient has booked an appointment for: "{appointment_reason}".

Patient context:
- Name: {context['patient_name']}
- DOB: {context.get('dob', 'Unknown')}
- Current medications: {json.dumps(context['medications'], default=str) if context['medications'] else 'None on file'}
- Latest vitals: {json.dumps(context['vitals'][0], default=str) if context['vitals'] else 'None on file'}

Generate exactly 5 short, clear pre-visit screening questions. These should help the doctor prepare for the visit.

Rules:
- Keep questions SHORT (1 sentence each) and easy for elderly patients to understand
- Ask about: duration of symptoms, severity (1-10), any triggers, relevant medical history, and current self-care
- DO NOT ask about things already known (medications listed above)
- Return ONLY a JSON array of 5 strings, nothing else

Example output:
["How long have you been experiencing this issue?", "On a scale of 1-10, how severe is the discomfort?", "Does anything make it better or worse?", "Have you had this issue before?", "Are you currently doing anything to manage it?"]"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=500,
                temperature=0.3,
            )
            content = response.choices[0].message.content.strip()

            # Parse the JSON array from the response
            # Handle cases where LLM wraps it in markdown code blocks
            if "```" in content:
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
                content = content.strip()

            questions = json.loads(content)
            if isinstance(questions, list) and len(questions) > 0:
                return questions[:5]
        except Exception as e:
            print(f"[PreVisit] Error generating questions: {e}")

        # Fallback questions
        return [
            "How long have you been experiencing these symptoms?",
            "On a scale of 1 to 10, how would you rate the discomfort?",
            "Is there anything that makes it better or worse?",
            "Have you experienced this issue before?",
            "Is there anything else you'd like the doctor to know?",
        ]

    def generate_report(
        self, appointment_id: str, patient_id: str, appointment_reason: str,
        questions: List[str], answers: List[str],
    ) -> str:
        """Generate a structured Pre-Visit Report and save it to the appointment."""
        context = self._get_patient_context(patient_id)

        # Build Q&A section
        qa_text = "\n".join(
            f"Q: {q}\nA: {a}" for q, a in zip(questions, answers)
        )

        prompt = f"""You are a medical documentation assistant. Generate a concise, structured Pre-Visit Report for a doctor.

APPOINTMENT REASON: {appointment_reason}

PATIENT CONTEXT:
- Name: {context['patient_name']}
- DOB: {context.get('dob', 'Unknown')}
- Current Medications: {json.dumps(context['medications'], default=str) if context['medications'] else 'None'}
- Latest Vitals: {json.dumps(context['vitals'][0], default=str) if context['vitals'] else 'Not available'}
- Recent Medical Reports: {json.dumps([r.get('title','') + ': ' + r.get('summary','')[:100] for r in context['recent_reports']], default=str) if context['recent_reports'] else 'None'}

PATIENT QUESTIONNAIRE RESPONSES:
{qa_text}

Generate a structured report using this EXACT format (use markdown):

## Pre-Visit Report

**Patient:** [name]
**Visit Reason:** [reason]
**Report Date:** [today's date]

### Chief Complaint
[1-2 sentence summary of why the patient is visiting]

### Symptom Assessment
- **Duration:** [from answers]
- **Severity:** [from answers, e.g. 7/10]
- **Triggers/Patterns:** [from answers]
- **Previous Occurrence:** [from answers]

### Current Health Snapshot
- **Medications:** [list current meds]
- **Latest Vitals:** [BP, HR, SpO2 if available]

### Patient's Additional Notes
[anything else they mentioned]

### Key Flags for Doctor
[2-3 bullet points highlighting what the doctor should pay attention to based on ALL the data]

Keep it concise and professional. No unnecessary verbosity."""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1000,
                temperature=0.2,
            )
            report = response.choices[0].message.content.strip()
        except Exception as e:
            print(f"[PreVisit] Error generating report: {e}")
            report = self._fallback_report(context, appointment_reason, questions, answers)

        # Save report to the appointment
        try:
            self.supabase.table("appointments").update({
                "pre_visit_report": report,
                "pre_visit_status": "completed",
            }).eq("id", appointment_id).execute()
            print(f"[PreVisit] Report saved for appointment {appointment_id}")
        except Exception as e:
            print(f"[PreVisit] Error saving report: {e}")

        return report

    def _fallback_report(
        self, context: Dict, reason: str, questions: List[str], answers: List[str]
    ) -> str:
        """Generate a basic report without LLM if API fails."""
        qa = "\n".join(f"- **Q:** {q}\n  **A:** {a}" for q, a in zip(questions, answers))
        meds = ", ".join(m["name"] for m in context.get("medications", [])) or "None"

        return f"""## Pre-Visit Report

**Patient:** {context.get('patient_name', 'Unknown')}
**Visit Reason:** {reason}

### Questionnaire Responses
{qa}

### Current Medications
{meds}

### Note
This is an auto-generated summary. Please review the patient's full records for additional context."""

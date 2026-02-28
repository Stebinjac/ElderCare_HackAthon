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

    def conduct_interview_turn(self, appointment_reason: str, patient_id: str, chat_history: List[Dict[str, str]]) -> Dict[str, Any]:
        """Process the chat history and generate the next symptom question, or conclude the interview."""
        context = self._get_patient_context(patient_id)
        
        # Count how many questions the assistant has asked so far
        assistant_questions = sum(1 for m in chat_history if m["role"] == "assistant")
        
        if assistant_questions >= 5:
            return {"next_question": None, "is_complete": True}

        system_prompt = f"""You are a medical intake assistant conducting a pre-visit interview.
A patient has booked an appointment for: "{appointment_reason}".

Patient context:
- Name: {context['patient_name']}
- DOB: {context.get('dob', 'Unknown')}
- Current medications: {json.dumps(context['medications'], default=str) if context['medications'] else 'None on file'}
- Latest vitals: {json.dumps(context['vitals'][0], default=str) if context['vitals'] else 'None on file'}

Your goal is to ask 1 targeted screening question at a time to help the doctor prepare.
You have asked {assistant_questions} out of a maximum of 5 questions.

Rules:
1. Ask exactly ONE short, clear question directly related to the appointment reason or their previous answers.
2. Build upon their answers. Do not repeat questions.
3. If they have fully explained their symptoms before 5 questions, you can output exactly "INTERVIEW_COMPLETE".
4. Keep the question under 2 sentences.

Output ONLY your response text and nothing else."""

        messages = [{"role": "system", "content": system_prompt}]
        for msg in chat_history:
            messages.append({"role": msg["role"], "content": msg["content"]})
            
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=200,
                temperature=0.3,
            )
            content = response.choices[0].message.content.strip()
            
            if "INTERVIEW_COMPLETE" in content or assistant_questions >= 5:
                return {"next_question": None, "is_complete": True}
                
            return {"next_question": content, "is_complete": False}
            
        except Exception as e:
            print(f"[PreVisit] Error generating next question: {e}")
            return {"next_question": "Could you tell me anything else about how you're feeling?", "is_complete": assistant_questions >= 4}

    def generate_report(
        self, appointment_id: str, patient_id: str, appointment_reason: str,
        chat_history: List[Dict[str, str]], is_final: bool = False
    ) -> str:
        """Generate a structured Pre-Visit Report based on chat history, including AI Self-Evaluation."""
        if not chat_history:
            return ""
            
        context = self._get_patient_context(patient_id)

        # Build Q&A transcript
        transcript = ""
        for msg in chat_history:
            speaker = "Assistant" if msg["role"] == "assistant" else "Patient"
            transcript += f"**{speaker}:** {msg['content']}\n\n"

        prompt = f"""You are a medical documentation assistant evaluating a simulated interview between an AI assistant and a patient.
Generate a concise, structured Pre-Visit Report for the doctor, and provide a self-evaluation of the AI's performance.

APPOINTMENT REASON: {appointment_reason}

PATIENT CONTEXT:
- Name: {context['patient_name']}
- DOB: {context.get('dob', 'Unknown')}
- Current Medications: {json.dumps(context['medications'], default=str) if context['medications'] else 'None'}
- Latest Vitals: {json.dumps(context['vitals'][0], default=str) if context['vitals'] else 'Not available'}
- Recent Medical Reports: {json.dumps([r.get('title','') + ': ' + r.get('summary','')[:100] for r in context['recent_reports']], default=str) if context['recent_reports'] else 'None'}

INTERVIEW TRANSCRIPT:
{transcript}

Generate a structured report using exactly this markdown structure:

## Preliminary Health Report
**Patient:** {context['patient_name']}
**Visit Reason:** {appointment_reason}

### History of Present Illness (HPI)
[Synthesize the patient's symptoms, duration, triggers, and severity into 1-2 professional sentences.]

### Relevant Medical History (from EHR)
[List any relevant conditions or note 'None on file']

### Medications (from EHR and interview)
[List medications in context]

---

## AI Interview Evaluation
### Clinical Insights Extracted
[What key pieces of information did the AI successfully uncover that will help the doctor?]

### AI Self-Evaluation (Quality & Opportunities)
[Provide a frank, 2-3 bullet point evaluation of the AI's interviewing skills. Note strengths (e.g., "effectively narrowed down the timeline") and missed opportunities (e.g., "failed to ask about radiating pain", "question was too broad", "did not ask for pain scale").]"""

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
            report = self._fallback_report(context, appointment_reason, transcript)

        # Save report to the appointment
        try:
            # If it's a live update, we might set status to 'draft'. If final, 'completed'.
            status = "completed" if is_final else "draft"
            self.supabase.table("appointments").update({
                "pre_visit_report": report,
                "pre_visit_status": status,
            }).eq("id", appointment_id).execute()
            print(f"[PreVisit] Report saved for appointment {appointment_id}")
        except Exception as e:
            print(f"[PreVisit] Error saving report: {e}")

        return report

    def _fallback_report(
        self, context: Dict, reason: str, transcript: str
    ) -> str:
        """Generate a basic report without LLM if API fails."""
        meds = ", ".join(m["name"] for m in context.get("medications", [])) or "None"

        return f"""## Preliminary Health Report

**Patient:** {context.get('patient_name', 'Unknown')}
**Visit Reason:** {reason}

### Interview Transcript
{transcript}

### Current Medications
{meds}

---

## AI Interview Evaluation
**Status:** AI Evaluation Unavailable (API Error)
"""

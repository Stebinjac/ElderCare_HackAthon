import os
from google import genai
from typing import Dict, Any, List
from mcp_server import MCPServer
from supabase import Client

class AssistantAgent:
    def __init__(self, mcp: MCPServer, supabase: Client):
        self.mcp = mcp
        self.supabase = supabase
        api_key = os.getenv("GEMINI_API_KEY")
        self.client = genai.Client(api_key=api_key)
        self.model_id = "gemini-2.0-flash"

    async def answer_question(self, patient_id: str, question: str):
        """
        Answers health-related questions using RAG over patient data.
        """
        # 1. Retrieve Context from Supabase
        context_data = await self.get_patient_context(patient_id)
        
        # 2. Generate Response with Gemini
        prompt = (
            f"You are ElderCare Assistant, a helpful AI for seniors.\n"
            f"Answer the following question based ONLY on the patient's records provided below.\n"
            f"Answer in simple, friendly, non-clinical language. If the data is missing, say you don't know.\n\n"
            f"Patient Records: {context_data}\n\n"
            f"Question: {question}"
        )

        try:
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=prompt
            )
            answer = response.text
        except Exception as e:
            answer = "I'm sorry, I'm having trouble accessing your records right now. Please try again in a moment."
            print(f"[AssistantAgent Error] Gemini failed: {e}")

        return {"answer": answer}

    async def get_patient_context(self, patient_id: str) -> str:
        """
        Fetches vitals, meds, and appointments to build the RAG context.
        """
        context = []
        try:
            # Vitals
            vitals = self.supabase.table("vitals").select("*").eq("patient_id", patient_id).order("logged_at", descending=True).limit(5).execute()
            if vitals.data:
                context.append(f"Recent Vitals: {vitals.data}")

            # Medications
            meds = self.supabase.table("medications").select("*").eq("patient_id", patient_id).execute()
            if meds.data:
                context.append(f"Current Medications: {meds.data}")

            # Appointments
            apps = self.supabase.table("appointments").select("*").eq("patient_id", patient_id).order("date", descending=True).limit(3).execute()
            if apps.data:
                context.append(f"Upcoming/Recent Appointments: {apps.data}")

        except Exception as e:
            print(f"[AssistantAgent Error] Context fetch failed: {e}")
            raise e

        if not context:
            return "No medical records exist for this patient in the database."
            
        return "\n".join(context)

    async def handle_event(self, event_type: str, patient_id: str, payload: Dict[str, Any]):
        # RAG assistant is typically query-driven, but could react to events like 'NEW_RECORD_ADDED'
        pass

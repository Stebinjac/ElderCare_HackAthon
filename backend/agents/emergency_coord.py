import os
from google import genai
from typing import Dict, Any, List
from mcp_server import MCPServer
from supabase import Client

class EmergencyCoordAgent:
    def __init__(self, mcp: MCPServer, supabase: Client):
        self.mcp = mcp
        self.supabase = supabase
        api_key = os.getenv("GEMINI_API_KEY")
        self.client = genai.Client(api_key=api_key)
        self.model_id = "gemini-2.0-flash"

    async def handle_hospital_decision(self, patient_id: str, payload: Dict[str, Any]):
        """
        Triggered when a hospital is selected. Coordinates dispatch and hospital notification.
        """
        hospital = payload.get("hospital", {})
        emergency_context = payload.get("emergency_context", {})

        try:
            patient_data = self.supabase.table("patients").select("*").eq("id", patient_id).single().execute()
            if patient_data.data:
                patient = patient_data.data
            else:
                raise ValueError(f"No patient found with ID {patient_id}")
        except Exception as e:
            print(f"[EmergencyCoordAgent Error] Patient fetch failed: {e}")
            raise e

        # 2. Generate Medical Summary for ER Staff using Gemini
        prompt = (
            f"Generate a concise medical summary for emergency responders and ER staff.\n"
            f"Patient: {patient.get('name')}, age {patient.get('age')}\n"
            f"Known Conditions: {patient.get('conditions')}\n"
            f"Allergies: {patient.get('allergies')}\n"
            f"Current Emergency Vitals: {emergency_context}\n"
            f"Selected Hospital: {hospital.get('name')}\n"
            f"Keep it professional and high-priority."
        )

        try:
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=prompt
            )
            medical_summary = response.text
        except Exception as e:
            medical_summary = f"EMERGENCY: {patient.get('name')} approaching {hospital.get('name')}. Vitals: {emergency_context}"
            print(f"[Gemini Error] {e}")

        # 3. Mock Dispatch & Notification
        print(f"[EmergencyCoordAgent] MOCK: Sending summary to {hospital.get('name')} emergency desk...")
        print(f"[EmergencyCoordAgent] MOCK: Ambulance dispatched. Tracking ETA...")
        
        eta = "8 minutes" # Mocked ETA based on hospital selection

        # 4. Confirm Dispatch via MCP
        await self.mcp.publish_event(
            source_agent="emergency_coord_agent",
            target_agent="communication_agent",
            event_type="DISPATCH_CONFIRMED",
            patient_id=patient_id,
            payload={
                "hospital": hospital,
                "eta": eta,
                "medical_summary": medical_summary,
                "status": "Ambulance En Route"
            }
        )

        return {"status": "dispatched", "eta": eta}

    async def handle_event(self, event_type: str, patient_id: str, payload: Dict[str, Any]):
        if event_type == "HOSPITAL_DECISION":
            print(f"[EmergencyCoordAgent] Coordinating dispatch for patient {patient_id} to {payload.get('hospital', {}).get('name')}")
            await self.handle_hospital_decision(patient_id, payload)
        else:
            print(f"[EmergencyCoordAgent] Ignored event type: {event_type}")

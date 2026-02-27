import os
from google import genai
from typing import Dict, Any, List
from mcp_server import MCPServer
from supabase import Client

class CareDecisionAgent:
    def __init__(self, mcp: MCPServer, supabase: Client):
        self.mcp = mcp
        self.supabase = supabase
        api_key = os.getenv("GEMINI_API_KEY")
        self.client = genai.Client(api_key=api_key)
        self.model_id = "gemini-2.0-flash"

    async def handle_emergency(self, patient_id: str, payload: Dict[str, Any]):
        """
        Triggered by EMERGENCY_VITALS event. Decides the best course of action.
        """
        try:
            patient_data = self.supabase.table("patients").select("*").eq("id", patient_id).single().execute()
            if patient_data.data:
                patient = patient_data.data
            else:
                raise ValueError(f"No patient found with ID {patient_id}")
        except Exception as e:
            print(f"[CareDecisionAgent Error] Could not fetch patient data: {e}")
            raise e


        # 2. Mock Hospital Lookup
        hospitals = [
            {"name": "Apollo Hospital", "distance": "2.3km", "specialty": "Cardiac", "rating": 4.8},
            {"name": "KIMS Hospital", "distance": "4.1km", "specialty": "General", "rating": 4.5}
        ]

        # 3. Gemini Decision Logic (Reasoning)
        selected_hospital = hospitals[0]
        prompt = (
            f"As a medical dispatcher AI, justify selecting {selected_hospital['name']} for a patient "
            f"with these critical vitals: {payload.get('vitals')}. "
            f"Patient conditions: {patient.get('conditions')}. Keep it to 2 sentences."
        )
        
        try:
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=prompt
            )
            rationale = response.text
        except Exception as e:
            rationale = f"Selected {selected_hospital['name']} due to proximity and specialization."
            print(f"[Gemini Error] {e}")

        # 4. Publish Decision to MCP
        await self.mcp.publish_event(
            source_agent="care_decision_agent",
            target_agent="emergency_coord_agent",
            event_type="HOSPITAL_DECISION",
            patient_id=patient_id,
            payload={
                "hospital": selected_hospital,
                "rationale": rationale,
                "emergency_context": payload.get("vitals")
            }
        )

        return {"hospital": selected_hospital, "rationale": rationale}


    async def handle_event(self, event_type: str, patient_id: str, payload: Dict[str, Any]):

        """General event handler for MCP routing."""
        if event_type == "EMERGENCY_VITALS":
            print(f"[CareDecisionAgent] Received emergency event for patient {patient_id}. Analyzing...")
            await self.handle_emergency(patient_id, payload)
        else:
            print(f"[CareDecisionAgent] Ignored event type: {event_type}")

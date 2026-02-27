import os
from typing import Dict, Any
from mcp_server import MCPServer
from supabase import Client

class CommunicationAgent:
    def __init__(self, mcp: MCPServer, supabase: Client):
        self.mcp = mcp
        self.supabase = supabase
        # Twilio would be initialized here if needed in Python
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.phone_number = os.getenv("TWILIO_PHONE_NUMBER")

    async def handle_alert(self, patient_id: str, event_type: str, payload: Dict[str, Any]):
        """
        Sends notifications to guardians/doctors based on agent events.
        """
        # 1. Fetch Patient and Guardian Info
        try:
            # We need to get the guardian_phone from the users table linked via guardian_id in patients
            # Or if guardian_phone is on the user record of the patient itself (from the original schema)
            
            # Fetch patient record
            p_res = self.supabase.table("patients").select("name, guardian_id").eq("id", patient_id).single().execute()
            patient_name = p_res.data.get("name") if p_res.data else "Unknown Patient"
            guardian_id = p_res.data.get("guardian_id") if p_res.data else None
            
            guardian_phone = None
            if guardian_id:
                g_res = self.supabase.table("users").select("guardian_phone, phone").eq("id", guardian_id).single().execute()
                guardian_phone = g_res.data.get("phone") or g_res.data.get("guardian_phone")
            
            if not guardian_phone:
                print(f"[CommunicationAgent] WARNING: No guardian phone found for patient {patient_id}")
                guardian_phone = "UNKNOWN"

            # 2. Format Message
            message = f"🚨 ELDERCARE ALERT for {patient_name}: {event_type}. "
            if event_type == "DISPATCH_CONFIRMED":
                message += f"Ambulance en route to {payload.get('hospital', {}).get('name')}. ETA: {payload.get('eta')}"
            elif event_type == "EMERGENCY_VITALS":
                message += f"Critical readings detected: {payload.get('vitals')}"
            else:
                message += f"Details: {payload}"

            # 3. "Send" Notification
            print(f"\n--- REAL COMMUNICATION CHANNEL ---")
            print(f"To: {guardian_phone}")
            print(f"Message: {message}")
            print(f"----------------------------------\n")

            # In a real production setup, we'd use Twilio's Python SDK here
            # if self.account_sid and self.auth_token: ...

        except Exception as e:
            print(f"[CommunicationAgent Error] Failed to process alert: {e}")

    async def handle_event(self, event_type: str, patient_id: str, payload: Dict[str, Any]):
        # This agent responds to almost everything that needs notification
        allowed_events = ["EMERGENCY_VITALS", "DISPATCH_CONFIRMED", "WELLNESS_CHECK", "REFILL_ALERT"]
        if event_type in allowed_events:
            await self.handle_alert(patient_id, event_type, payload)

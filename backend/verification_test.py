import asyncio
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load env from parent dir
load_dotenv(dotenv_path="../.env.local")

from mcp_server import MCPServer
from agents.health_monitor import HealthMonitorAgent
from agents.care_decision import CareDecisionAgent
from agents.emergency_coord import EmergencyCoordAgent
from agents.wellness import WellnessAgent
from agents.assistant import AssistantAgent

async def run_verification():
    print("--- STARTING AGENT VERIFICATION ---")
    
    # 1. Setup
    SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    mcp = MCPServer(supabase)
    
    health = HealthMonitorAgent(mcp)
    care = CareDecisionAgent(mcp, supabase)
    coord = EmergencyCoordAgent(mcp, supabase)
    wellness = WellnessAgent(mcp, supabase)
    assistant = AssistantAgent(mcp, supabase)
    
    mcp.register_agent("health_monitoring_agent", health)
    mcp.register_agent("care_decision_agent", care)
    mcp.register_agent("emergency_coord_agent", coord)
    
    class MockCommAgent:
        async def handle_event(self, event_type, patient_id, payload):
            print(f"[COMM AGENT] Received: {event_type} for {patient_id}")
            print(f"             Payload: {payload}")
    
    mcp.register_agent("communication_agent", MockCommAgent())

    # 2. Test Emergency Flow
    print("\n[Test 1] Testing Emergency Flow (BP Surge)...")
    patient_id = "test-patient-uuid" # We'll just use a mock string for logic check
    vitals = {"bp_systolic": 195, "bp_diastolic": 120, "heart_rate": 105}
    
    # Health -> Care Decision -> Emergency Coord -> Communication
    await health.analyze_vitals(patient_id, vitals)
    
    # 3. Test Wellness Logic
    print("\n[Test 2] Testing Wellness Agent...")
    wellness_result = await wellness.analyze_mood(patient_id, "I feel very lonely and my back hurts.")
    print(f"Wellness Response: {wellness_result['response']}")
    print(f"Mood Score: {wellness_result['mood']}")

    # 4. Test Assistant RAG Logic
    print("\n[Test 3] Testing Assistant Agent (RAG Context)...")
    # This might fail if the patient_id doesn't exist in Supabase, but we check catching
    assistant_result = await assistant.answer_question(patient_id, "What medicines should I take?")
    print(f"Assistant Answer: {assistant_result['answer']}")

    print("\n--- VERIFICATION COMPLETE ---")

if __name__ == "__main__":
    asyncio.run(run_verification())

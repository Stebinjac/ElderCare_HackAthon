import os
import asyncio
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from dotenv import load_dotenv
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime

load_dotenv(dotenv_path="../.env.local")

app = FastAPI(title="ElderCare AI API")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase Setup
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase environment variables")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Initialize MCP Server
from mcp_server import MCPServer
mcp = MCPServer(supabase)

# Initialize and Register Agents
from agents.health_monitor import HealthMonitorAgent
from agents.care_decision import CareDecisionAgent
from agents.emergency_coord import EmergencyCoordAgent
from agents.wellness import WellnessAgent
from agents.assistant import AssistantAgent

from agents.communication import CommunicationAgent

health_agent = HealthMonitorAgent(mcp, supabase)
care_agent = CareDecisionAgent(mcp, supabase)
coord_agent = EmergencyCoordAgent(mcp, supabase)
wellness_agent = WellnessAgent(mcp, supabase)
assistant_agent = AssistantAgent(mcp, supabase)
comm_agent = CommunicationAgent(mcp, supabase)

mcp.register_agent("health_monitoring_agent", health_agent)
mcp.register_agent("care_decision_agent", care_agent)
mcp.register_agent("emergency_coord_agent", coord_agent)
mcp.register_agent("mental_wellness_agent", wellness_agent)
mcp.register_agent("assistant_agent", assistant_agent)
mcp.register_agent("communication_agent", comm_agent)

# --- Medication & Wellness Scheduler ---
scheduler = AsyncIOScheduler()

async def medication_reminder_task():
    print(f"\n[Scheduler] Running Medication Reminders @ {datetime.now()}")
    # Logic: Query medications where timing includes current time slot
    try:
        # For demo purposes, we log the intent. In prod, we'd filter timing array in Supabase
        meds = supabase.table("medications").select("name, timing, patient_id").execute()
        for med in meds.data:
            # Simple mock check for timing
            print(f"- Reminder for {med['name']} (Patient: {med['patient_id']})")
    except Exception as e:
        print(f"[Scheduler Error] {e}")

async def refill_check_task():
    print(f"\n[Scheduler] Checking for low medication stock...")
    try:
        # Query medications where stock is low
        low_stock = supabase.table("medications").select("*").lt("stock_count", 5).execute()
        for med in low_stock.data:
            print(f"⚠️ LOW STOCK ALERT: {med['name']} (Count: {med['stock_count']}) for Patient {med['patient_id']}")
            # Trigger Communication Agent
            await mcp.publish_event(
                source_agent="medication_system",
                target_agent="communication_agent",
                event_type="REFILL_ALERT",
                patient_id=med["patient_id"],
                payload={"medication": med["name"], "stock": med["stock_count"]}
            )
    except Exception as e:
        print(f"[Refill Check Error] {e}")

async def wellness_checkin_trigger():
    print(f"\n[Scheduler] Triggering Daily Wellness Check-ins...")
    # Trigger morning greetings for all patients
    pass

@app.on_event("startup")
async def startup_event():
    scheduler.add_job(medication_reminder_task, 'interval', minutes=30)
    scheduler.add_job(refill_check_task, 'interval', hours=12)
    scheduler.add_job(wellness_checkin_trigger, 'cron', hour=9)
    scheduler.start()

# --- API Endpoints ---

@app.get("/")
async def root():
    return {"message": "ElderCare AI Backend is Running"}

@app.post("/api/agents/health-monitoring")
async def health_monitoring_endpoint(request: Request):
    data = await request.json()
    patient_id = data.get("patient_id")
    vitals_data = data  # The frontend sends the vitals object directly
    
    if not patient_id:
        raise HTTPException(status_code=400, detail="patient_id is required")
        
    result = await health_agent.analyze_vitals(patient_id, vitals_data)
    return {"data": result}

@app.post("/api/agents/chat")
async def chat_with_assistant(request: Request):
    data = await request.json()
    patient_id = data.get("patient_id")
    message = data.get("message")
    
    if not patient_id:
        raise HTTPException(status_code=400, detail="patient_id is required")
        
    # Route to RAG assistant
    result = await assistant_agent.answer_question(patient_id, message)
    return result

@app.post("/api/agents/wellness")
async def wellness_chat(request: Request):
    data = await request.json()
    patient_id = data.get("patient_id")
    message = data.get("message")
    history = data.get("history", [])
    
    if not patient_id:
        raise HTTPException(status_code=400, detail="patient_id is required")
    
    result = await wellness_agent.analyze_mood(patient_id, message, history)
    return result

@app.post("/test-communication")
async def test_communication(patient_id: str = None):
    """
    Simulates a high BP reading and triggers the agent communication flow.
    Ensures a real patient ID is used or errors out.
    """
    if not patient_id or patient_id == "any-id":
        patients = supabase.table("patients").select("id").limit(1).execute()
        if patients.data:
            patient_id = patients.data[0]["id"]
        else:
            raise HTTPException(status_code=404, detail="No patients found in DB for testing.")

    vitals = {
        "bp_systolic": 190,
        "bp_diastolic": 115,
        "heart_rate": 95,
        "notes": "Simulated emergency for comms test"
    }

    print(f"\n--- STARTING COMMUNICATION TEST FOR PATIENT {patient_id} ---")
    result = await health_agent.analyze_vitals(patient_id, vitals)
    
    return {
        "status": "triggered",
        "patient_id": patient_id,
        "initial_analysis": result,
        "process": "Check terminal for MCP logs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

"""
AgentCare Backend — FastAPI Server
Provides the /chat endpoint for the AI chatbot system.
"""
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from supabase import create_client, Client
from pydantic import BaseModel
from typing import Optional, List, Dict

from orchestrator import AgentOrchestrator
from agents.previsit_agent import PreVisitAgent

load_dotenv()

app = FastAPI(title="AgentCare Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

orchestrator = AgentOrchestrator(supabase)
previsit_agent = PreVisitAgent(supabase)


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    patient_id: str
    history: Optional[List[ChatMessage]] = None
    lat: Optional[float] = None
    lng: Optional[float] = None


@app.get("/")
async def root():
    return {"status": "AgentCare Backend Online"}


@app.post("/chat")
async def chat(req: ChatRequest):
    """Process a chat message through the AI agent."""
    try:
        print(f"[AgentCare] Chat request: {req.message} | Lat: {req.lat}, Lng: {req.lng}")
        history_dicts = [{"role": m.role, "content": m.content} for m in req.history] if req.history else []
        result = await orchestrator.chat(req.patient_id, req.message, history_dicts, lat=req.lat, lng=req.lng)
        return result
    except Exception as e:
        print(f"[AgentCare] Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class LocationRequest(BaseModel):
    latitude: float
    longitude: float

@app.post("/api/nearby-hospitals")
async def nearby_hospitals(req: LocationRequest):
    """Direct endpoint to fetch nearby hospitals."""
    from agents.tools import find_nearest_hospital
    try:
        result = await find_nearest_hospital(latitude=req.latitude, longitude=req.longitude)
        return result.get("hospitals", [])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Pre-Visit Endpoints ────────────────────────────────────────────────────────

class PreVisitInterviewRequest(BaseModel):
    appointment_id: str
    appointment_reason: str
    patient_id: str
    chat_history: List[Dict[str, str]]

@app.post("/api/previsit/interview-turn")
async def previsit_interview_turn(req: PreVisitInterviewRequest):
    """Process a turn in the pre-visit interview. Generates next question AND live report draft."""
    try:
        # 1. Get the next question (or conclude)
        turn_result = previsit_agent.conduct_interview_turn(
            appointment_reason=req.appointment_reason,
            patient_id=req.patient_id,
            chat_history=req.chat_history
        )
        
        # 2. Generate the live report draft
        # If the interview is complete, passing is_final=True saves it as 'completed'
        report = previsit_agent.generate_report(
            appointment_id=req.appointment_id,
            patient_id=req.patient_id,
            appointment_reason=req.appointment_reason,
            chat_history=req.chat_history,
            is_final=turn_result["is_complete"]
        )
        
        return {
            "next_question": turn_result["next_question"],
            "is_complete": turn_result["is_complete"],
            "live_report": report
        }
    except Exception as e:
        print(f"[PreVisit] Error in interview turn: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/previsit/report/{appointment_id}")
async def get_previsit_report(appointment_id: str):
    """Fetch the pre-visit report for a specific appointment."""
    try:
        res = supabase.table("appointments").select(
            "pre_visit_report, pre_visit_status"
        ).eq("id", appointment_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Appointment not found")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

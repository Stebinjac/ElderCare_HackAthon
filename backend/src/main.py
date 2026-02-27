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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

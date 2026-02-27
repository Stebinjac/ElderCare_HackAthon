import os
from google import genai
from typing import Dict, Any, List
from mcp_server import MCPServer
from supabase import Client
from datetime import datetime, timedelta

class WellnessAgent:
    def __init__(self, mcp: MCPServer, supabase: Client):
        self.mcp = mcp
        self.supabase = supabase
        api_key = os.getenv("GEMINI_API_KEY")
        self.client = genai.Client(api_key=api_key)
        self.model_id = "gemini-2.0-flash"

    async def analyze_mood(self, patient_id: str, message: str, history: List[Dict[str, str]] = []):
        """
        Analyzes patient message for sentiment and clinical significance.
        """
        prompt = (
            f"As an empathetic health companion for the elderly, respond to this message: '{message}'.\n"
            f"Context: {history}\n\n"
            f"Also, provide a JSON analysis including 'sentiment' (0-10 scale), 'keywords' (lonely, pain, etc.), "
            f"and 'distress_flag' (true/false). Result format: Response text followed by JSON."
        )

        try:
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=prompt
            )
            # Simple parsing of response (expecting text + JSON)
            raw_text = response.text
            # For hackathon demo, we'll extract analysis with a simple heuristic or Gemini's structured output
            # In production, we'd use responseMimeType: "application/json" but here we need the chat text too.
            
            # Simulated parsing logic:
            ai_response = raw_text.split("{")[0].strip()
            analysis_part = "{" + raw_text.split("{")[-1] if "{" in raw_text else '{"sentiment": 5, "distress_flag": false}'
            
            import json
            try:
                analysis = json.loads(analysis_part)
            except:
                analysis = {"sentiment": 5, "distress_flag": False}

        except Exception as e:
            ai_response = "I'm here for you. Tell me more about how you feel."
            analysis = {"sentiment": 5, "distress_flag": False}
            print(f"[WellnessAgent Error] Gemini failed: {e}")

        # 1. Store Mood in DB
        try:
            # We use mcp_events or a dedicated mood table if available.
            # For now, let's log as an MCP event to trigger potential CommunicationAgent alerts
            await self.mcp.publish_event(
                source_agent="mental_wellness_agent",
                target_agent="communication_agent" if analysis.get("distress_flag") else "audit_log",
                event_type="WELLNESS_CHECK",
                patient_id=patient_id,
                payload={
                    "sentiment_score": analysis.get("sentiment"),
                    "distress_flag": analysis.get("distress_flag"),
                    "summary": ai_response[:100]
                }
            )
        except Exception as e:
            print(f"[WellnessAgent Error] MCP publish failed: {e}")

        # 2. Check for Consecutive Distress
        if analysis.get("distress_flag"):
            await self.check_distress_trend(patient_id)

        return {"response": ai_response, "mood": analysis.get("sentiment"), "suggestion": "Try a short walk" if analysis.get("sentiment") < 5 else None}

    async def check_distress_trend(self, patient_id: str):
        """
        Checks if the patient has had multiple consecutive days of distress.
        """
        print(f"[WellnessAgent] Checking mood history for patient {patient_id}...")
        try:
            # Query last 3 wellness checks
            res = self.supabase.table("mcp_events") \
                .select("payload") \
                .eq("patient_id", patient_id) \
                .eq("event_type", "WELLNESS_CHECK") \
                .order("created_at", descending=True) \
                .limit(3) \
                .execute()
            
            if res.data and len(res.data) >= 3:
                distress_count = sum(1 for e in res.data if e.get("payload", {}).get("distress_flag"))
                if distress_count >= 2:
                    print(f"[WellnessAgent] ALERT: Persistent distress detected for {patient_id}. Escalating...")
                    await self.mcp.publish_event(
                        source_agent="mental_wellness_agent",
                        target_agent="communication_agent",
                        event_type="PERSISTENT_DISTRESS_ALERT",
                        patient_id=patient_id,
                        payload={"distress_count": distress_count, "period": "Last 3 check-ins"}
                    )
        except Exception as e:
            print(f"[WellnessAgent Error] Trend check failed: {e}")

    async def handle_event(self, event_type: str, patient_id: str, payload: Dict[str, Any]):
        # Wellness agent typically initiates or is called by UI
        pass

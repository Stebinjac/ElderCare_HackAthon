"""
AgentCare Orchestrator
Uses Groq (LLaMA 3.3 70B) function-calling to interpret user messages and autonomously execute tools.
"""
import os
import json
import asyncio
import re
from typing import Dict, Any, List, Optional

from groq import Groq
from supabase import Client

from agents.tools import (
    get_health_summary,
    get_appointments,
    book_appointment,
    find_nearest_hospital,
    send_emergency_alert,
    get_medications,
    get_available_doctors,
)

# ── Tool declarations ──────────────────────────────────────────────────────────

BASE_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_health_summary",
            "description": "Get the patient's current health summary including vitals and medications.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_appointments",
            "description": "List the patient's upcoming and past appointments.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_available_doctors",
            "description": (
                "Fetch the list of available doctors. "
                "Call this BEFORE booking to choose the right doctor."
            ),
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "find_nearest_hospital",
            "description": "Find nearest hospitals. Provide a city name if known; otherwise, it will use the user's current location.",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "City name to search in (optional)."},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "send_emergency_alert",
            "description": "Send an emergency SMS alert to the patient's guardian.",
            "parameters": {
                "type": "object",
                "properties": {
                    "message": {"type": "string", "description": "Alert message (optional)"},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_medications",
            "description": "Get the patient's current medications list.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
]

BOOK_TOOL = {
    "type": "function",
    "function": {
        "name": "book_appointment",
        "description": (
            "Book an appointment with a specific doctor from get_available_doctors. "
            "Always set doctor_name (exact name from doctors list), reason (short label), "
            "and patient_notes (full 2-3 sentence symptom summary for the doctor)."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "doctor_name": {
                    "type": "string",
                    "description": "Exact name of the chosen doctor from get_available_doctors."
                },
                "date": {"type": "string", "description": "Date in YYYY-MM-DD (optional, defaults to tomorrow)"},
                "time": {"type": "string", "description": "Time in HH:MM (optional, auto-selects first available)"},
                "reason": {
                    "type": "string",
                    "description": "Short appointment label, e.g. 'Knee pain consultation'"
                },
                "patient_notes": {
                    "type": "string",
                    "description": (
                        "Full symptom summary for the doctor. Include: main symptom, duration, "
                        "severity, and everything the patient described. "
                        "Example: 'Patient reports sharp knee pain for 3 days rated 7/10. "
                        "Worsens when bending. No prior injury. Mild swelling noted.'"
                    )
                },
            },
            "required": ["doctor_name", "reason", "patient_notes"],
        },
    },
}

# ── Prompts ────────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are AgentCare, a warm and caring AI health assistant for elderly patients.

## CORE RULE: THE 2-PHASE BOOKING PROTOCOL
You CANNOT book an appointment in a single message. It is strictly forbidden.
You MUST follow these two phases in order:

### PHASE 1: INTAKE (You are currently here if the patient just asked to book)
If the patient asks for a doctor, an appointment, or a checkup, you MUST ask ONE clarifying question about their symptoms.
Example: "I can help with that. Could you tell me what symptoms you are experiencing?"
DO NOT CALL `get_available_doctors` YET.
DO NOT CALL `book_appointment` YET.
Just ask the question and wait for the patient to reply.

### PHASE 2: DOCTOR SELECTION & BOOKING (You are here ONLY IF the patient has described their symptoms)
Once the patient has answered your question and described their symptoms:
1. FIRST, call `get_available_doctors` to see who is on staff. Wait for the result.
2. NEXT, match the patient's symptoms to the correct doctor's speciality.
3. FINALLY, call `book_appointment` using the EXACT name of the doctor from the list.
   - Include a detailed `patient_notes` summary (2-3 sentences) describing their symptoms for the doctor.

## EMERGENCY PROTOCOL
If the patient mentions chest pain, stroke, breathlessness, or "emergency", skip all rules.
IMMEDIATELY call `find_nearest_hospital` AND `send_emergency_alert`.

## LOCATION HANDLING
Use the user's live location (provided as metadata) automatically for searches. Coordinates are handled by the system; do not ask the user for them.

## TONE
Be warm, reassuring, and keep your questions short for elderly patients.
"""

# The prompt given when the LLM is explicitly BLOCKED from booking
INTAKE_PROMPT = """You are AgentCare, a warm AI health assistant for elderly patients.

The patient wants to book an appointment, but you DO NOT have enough information about their symptoms yet.
You DO NOT have access to the booking tool right now.

**Your ONLY job in this message is to ask ONE short, warm question to find out what is bothering them (their symptoms).**
Example: "I'd be happy to help you book an appointment. Could you tell me a little bit about what symptoms you're experiencing?"

Do not attempt to call any tools. Just ask the question and wait for them to reply."""

# ── Helpers ────────────────────────────────────────────────────────────────────

EMERGENCY_KEYWORDS = re.compile(
    r"\b(emergency|can't breathe|chest pain|heart attack|stroke|unconscious|fainted|dying|collapsed)\b",
    re.IGNORECASE,
)

def _is_emergency(message: str) -> bool:
    return bool(EMERGENCY_KEYWORDS.search(message))

def _needs_intake(message: str, history: List[Dict]) -> bool:
    """
    Returns True if the patient is trying to book an appointment, BUT
    we haven't had a proper back-and-forth about symptoms yet.
    """
    msg_lower = message.lower()
    is_booking_request = any(word in msg_lower for word in ["book", "appointment", "doctor", "schedule", "checkup", "check-up"])
    
    if not is_booking_request:
        return False
        
    # If it's a booking request, check if they actually provided a symptom in this message
    # If the message is very short (like "book an appointment"), they definitely didn't
    if len(message.split()) <= 4:
        return True
        
    # Check if the AI recently asked them a question
    ai_msgs = [m for m in history[-4:] if m.get("role") == "assistant"]
    if not ai_msgs:
        return True # They just walked up and said "book appointment with Dr X"
        
    last_ai_msg = ai_msgs[-1]["content"] or ""
    
    # If the AI asked a question, and the user is replying...
    if "?" in last_ai_msg:
        # We assume they are answering the symptom question
        return False
        
    # Otherwise, they are probably just throwing a booking request at us out of nowhere
    return True


# ── Orchestrator ───────────────────────────────────────────────────────────────

class AgentOrchestrator:
    def __init__(self, supabase: Client):
        self.supabase = supabase
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY is required in .env")
        self.client = Groq(api_key=api_key)
        self.model = "llama-3.3-70b-versatile"

    async def _execute_tool(self, tool_name: str, args: Dict[str, Any], patient_id: str, lat: Optional[float] = None, lng: Optional[float] = None) -> Dict[str, Any]:
        """Execute a tool function by name."""
        args = args or {}
        if tool_name == "get_health_summary":
            return await get_health_summary(self.supabase, patient_id)
        elif tool_name == "get_appointments":
            return await get_appointments(self.supabase, patient_id)
        elif tool_name == "get_available_doctors":
            return await get_available_doctors(self.supabase)
        elif tool_name == "book_appointment":
            return await book_appointment(
                self.supabase, patient_id,
                doctor_name=args.get("doctor_name"),
                date=args.get("date"),
                time=args.get("time"),
                reason=args.get("reason"),
                patient_notes=args.get("patient_notes"),
            )
        elif tool_name == "find_nearest_hospital":
            return await find_nearest_hospital(
                patient_city=args.get("city"),
                latitude=lat or args.get("latitude"),
                longitude=lng or args.get("longitude")
            )
        elif tool_name == "send_emergency_alert":
            return await send_emergency_alert(self.supabase, patient_id, message=args.get("message"))
        elif tool_name == "get_medications":
            return await get_medications(self.supabase, patient_id)
        else:
            return {"error": f"Unknown tool: {tool_name}"}

    async def chat(self, patient_id: str, message: str, history: List[Dict] = None, lat: Optional[float] = None, lng: Optional[float] = None) -> Dict[str, Any]:
        """Process a user chat message, execute any tool calls, and return the response."""
        actions_taken = []
        history = history or []

        # ── Fast paths and Gates ───────────────────────────────────────────────
        if _is_emergency(message):
            tools = BASE_TOOLS + [BOOK_TOOL]
            system_prompt = SYSTEM_PROMPT
        elif _needs_intake(message, history):
            tools = BASE_TOOLS 
            system_prompt = INTAKE_PROMPT
        else:
            tools = BASE_TOOLS + [BOOK_TOOL]
            system_prompt = SYSTEM_PROMPT

        # ── Build message history ──────────────────────────────────────────────
        messages = [{"role": "system", "content": system_prompt}]
        for msg in history:
            messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": message})

        # ── Agentic loop ───────────────────────────────────────────────────────
        max_iterations = 8
        for _ in range(max_iterations):
            try:
                kwargs = {
                    "model": self.model,
                    "messages": messages,
                    "max_tokens": 4096,
                }
                if tools:
                    kwargs["tools"] = tools
                    kwargs["tool_choice"] = "auto"

                response = self.client.chat.completions.create(**kwargs)
            except Exception as e:
                error_msg = str(e)
                print(f"[AgentCare] Groq API error: {error_msg}")
                if "rate_limit" in error_msg.lower() or "429" in error_msg:
                    return {
                        "response": "I'm experiencing high demand right now. Please wait a moment and try again.",
                        "actions": actions_taken,
                    }
                return {
                    "response": f"Sorry, I encountered an error: {error_msg[:150]}",
                    "actions": actions_taken,
                }

            choice = response.choices[0]

            # No tool calls → final text response
            if not tools or choice.finish_reason != "tool_calls" or not choice.message.tool_calls:
                return {
                    "response": choice.message.content or "",
                    "actions": actions_taken,
                }

            messages.append(choice.message)

            for tool_call in choice.message.tool_calls:
                tool_name = tool_call.function.name
                try:
                    tool_args = json.loads(tool_call.function.arguments) if tool_call.function.arguments else {}
                except json.JSONDecodeError:
                    tool_args = {}

                print(f"[AgentCare] Executing tool: {tool_name}({tool_args})")

                result = await self._execute_tool(tool_name, tool_args, patient_id, lat=lat, lng=lng)
                actions_taken.append({
                    "tool": tool_name,
                    "args": tool_args,
                    "result": result,
                })

                # Add tool result to messages
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": json.dumps(result, default=str),
                })

        return {
            "response": "I've completed the requested actions.",
            "actions": actions_taken,
        }

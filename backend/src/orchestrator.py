"""
AgentCare Orchestrator
Uses Groq (LLaMA 3.3 70B) function-calling to interpret user messages and autonomously execute tools.
"""
import os
import json
import asyncio
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
)

# --- Tool Declarations (OpenAI-compatible format) ---
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_health_summary",
            "description": "Get the patient's health summary: latest vitals, medications, and profile.",
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
            "name": "book_appointment",
            "description": "Book a new appointment. Use logical defaults if specific details are missing.",
            "parameters": {
                "type": "object",
                "properties": {
                    "doctor_name": {"type": "string", "description": "Name of the doctor (optional)"},
                    "specialty": {"type": "string", "description": "Medical specialty. Allowed: Cardiology, Orthopedics, Geriatrics, Neurology, Psychiatry, General Practice."},
                    "date": {"type": "string", "description": "Date in YYYY-MM-DD format (defaults to tomorrow)"},
                    "time": {"type": "string", "description": "Time in HH:MM format (defaults to 10:00 AM)"},
                    "reason": {"type": "string", "description": "Reason for the visit"},
                },
                "required": [],
            },
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
            "description": "Send an emergency SMS alert to the guardian.",
            "parameters": {
                "type": "object",
                "properties": {
                    "message": {"type": "string", "description": "Custom alert message."},
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

SYSTEM_PROMPT = """You are AgentCare, an AI assistant for elderly patients. 
Your goal is to assist with health inquiries, book appointments, and handle emergencies.

INSTRUCTIONS:
1. Always use tools to take action. Do not just describe your intention.
2. If symptoms are mentioned, map them to a specialty:
   - Heart/BP -> Cardiology
   - Bones/Joints/Back -> Orthopedics
   - Head/Memory/Nerves -> Neurology
   - Old age/Falling -> Geriatrics
   - Mental health/Sleep -> Psychiatry
   - Fever/General -> General Practice
3. For appointments, if date/time is missing, assume Tomorrow at 10:00 AM.
4. In an EMERGENCY, call BOTH `find_nearest_hospital` and `send_emergency_alert`.
5. Be warm, reassuring, and concise.
"""


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
        if tool_name == "get_health_summary":
            return await get_health_summary(self.supabase, patient_id)
        elif tool_name == "get_appointments":
            return await get_appointments(self.supabase, patient_id)
        elif tool_name == "book_appointment":
            return await book_appointment(
                self.supabase, patient_id,
                doctor_name=args.get("doctor_name"),
                specialty=args.get("specialty"),
                date=args.get("date"),
                time=args.get("time"),
                reason=args.get("reason"),
            )
        elif tool_name == "find_nearest_hospital":
            # Prefer coordinates from the request if available
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

        # Build messages for Groq
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        if history:
            for msg in history:
                messages.append({"role": msg["role"], "content": msg["content"]})

        messages.append({"role": "user", "content": message})

        # Multi-turn tool-use loop
        max_iterations = 5
        for iteration in range(max_iterations):
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    tools=TOOLS,
                    tool_choice="auto",
                    max_tokens=4096,
                )
            except Exception as e:
                error_msg = str(e)
                print(f"[AgentCare] Groq API error: {error_msg}")
                if "rate_limit" in error_msg.lower() or "429" in error_msg:
                    return {
                        "response": "I'm experiencing high demand. Please wait a few seconds and try again.",
                        "actions": actions_taken,
                    }
                return {
                    "response": f"Sorry, I encountered an error: {error_msg[:150]}",
                    "actions": actions_taken,
                }

            choice = response.choices[0]

            # If no tool calls, we have the final response
            if choice.finish_reason != "tool_calls" or not choice.message.tool_calls:
                final_text = choice.message.content or ""
                return {
                    "response": final_text,
                    "actions": actions_taken,
                }

            # Process tool calls
            # Add the assistant's message with tool_calls to the conversation
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

        # If we exhausted iterations, return what we have
        return {
            "response": "I've completed the requested actions. Please check the results below.",
            "actions": actions_taken,
        }

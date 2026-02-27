"""
AgentCare Orchestrator
Uses Groq (LLaMA 3.3 70B) function-calling to interpret user messages and autonomously execute tools.
"""
import os
import json
import asyncio
from typing import Dict, Any, List

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
            "description": "Get the patient's current health summary including latest vitals, medications, and profile info.",
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
            "description": "Book a new appointment with a doctor. Finds the assigned doctor automatically if not specified.",
            "parameters": {
                "type": "object",
                "properties": {
                    "doctor_name": {"type": "string", "description": "Name of the doctor (optional, auto-selects if not given)"},
                    "specialty": {"type": "string", "description": "Medical specialty needed. Allowed: 'Cardiology' (heart), 'Orthopedics' (bones/joints), 'Geriatrics' (elders), 'Neurology' (brain/nerves), 'Psychiatry' (mental health), 'General Practice' (general issues)."},
                    "date": {"type": "string", "description": "Appointment date in YYYY-MM-DD format (optional, defaults to tomorrow)"},
                    "time": {"type": "string", "description": "Appointment time in HH:MM format (optional, auto-selects first available)"},
                    "reason": {"type": "string", "description": "Reason for the appointment"},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "find_nearest_hospital",
            "description": "Find the nearest hospitals to the patient using live map data. Returns hospital name, address, phone, and Google Maps link.",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "City name to search near (e.g. 'Kochi','Mumbai', 'New York',)"},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "send_emergency_alert",
            "description": "Send an emergency SMS alert to the patient's registered guardian.",
            "parameters": {
                "type": "object",
                "properties": {
                    "message": {"type": "string", "description": "Custom alert message (optional)"},
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

SYSTEM_PROMPT = """You are AgentCare, an AI health assistant for elderly patients in the ElderCare platform.

Your capabilities:
- Fetch and explain health summaries (vitals, medications)
- Book appointments with specific doctors or specialists (e.g., "Find a cardiologist")
- Find nearest hospitals using live map data
- Send emergency alerts to guardians via SMS
- List upcoming appointments

Rules:
1. BE PROACTIVE: If the user mentions a problem, call the tool IMMEDIATELY. Do NOT ask "Can I book?" or "At what time?". Just do it using logical defaults.
2. LOGICAL DEFAULTS: If date/time is not given, ALWAYS assume:
   - Date: Tomorrow (or next available weekday)
   - Time: 10:00 AM (or first available morning slot)
   - Doctor: Search by specialty based on symptoms.
3. SYMPTOM-TO-SPECIALTY MAPPING:
   - "Heart", "Chest Pain", "Palpitations", "BP" -> Cardiology
   - "Bones", "Fracture", "Joints", "Back pain", "Spine" -> Orthopedics
   - "Headache", "Memory", "Nerves", "Stroke", "Dizziness" -> Neurology
   - "Old age", "Weakness", "Falling", "Geriatric" -> Geriatrics
   - "Anxiety", "Sadness", "Depression", "Sleep issues", "Mental" -> Psychiatry
   - "Fever", "Cough", "General checkup", "Infection" -> General Practice
4. NO BACK-QUESTIONING: Do not ask "at what time" or "which doctor". Pick the best specialist and the first available slot. Report the confirmation to the user.
5. EMERGENCY: If it sounds life-threatening, call `find_nearest_hospital` AND `send_emergency_alert` FIRST, then report.
6. CLARITY: After booking, say: "I've booked you a specialist for [Issue]. Doctor [Name] will see you tomorrow at [Time]."
"""


class AgentOrchestrator:
    def __init__(self, supabase: Client):
        self.supabase = supabase
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY is required in .env")
        self.client = Groq(api_key=api_key)
        self.model = "llama-3.3-70b-versatile"

    async def _execute_tool(self, tool_name: str, args: Dict[str, Any], patient_id: str) -> Dict[str, Any]:
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
            return await find_nearest_hospital(patient_city=args.get("city"))
        elif tool_name == "send_emergency_alert":
            return await send_emergency_alert(self.supabase, patient_id, message=args.get("message"))
        elif tool_name == "get_medications":
            return await get_medications(self.supabase, patient_id)
        else:
            return {"error": f"Unknown tool: {tool_name}"}

    async def chat(self, patient_id: str, message: str, history: List[Dict] = None) -> Dict[str, Any]:
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

                result = await self._execute_tool(tool_name, tool_args, patient_id)
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

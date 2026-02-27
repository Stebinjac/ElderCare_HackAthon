import os
import json
from datetime import datetime
from typing import Dict, Any
from supabase import Client

class MCPServer:
    def __init__(self, supabase_client: Client):
        self.supabase = supabase_client
        self.agents = {}

    def register_agent(self, agent_name: str, agent_instance: Any):
        """Register an agent instance to the MCP server."""
        self.agents[agent_name] = agent_instance
        print(f"[MCP] Agent '{agent_name}' registered.")

    async def publish_event(self, source_agent: str, target_agent: str, event_type: str, patient_id: str, payload: Dict[str, Any]):
        """
        Publishes an event to the MCP bus, logs it to Supabase, and routes it to the target agent.
        """
        event_data = {
            "source_agent": source_agent,
            "target_agent": target_agent,
            "event_type": event_type,
            "patient_id": patient_id,
            "payload": payload,
            "created_at": datetime.utcnow().isoformat()
        }

        print(f"\n[MCP EVENT] {source_agent} -> {target_agent}: {event_type} (Patient: {patient_id})")

        # 1. Audit Log in Supabase
        try:
            print(f"[MCP LOG] Saving event to DB...")
            self.supabase.table("mcp_events").insert(event_data).execute()
            print(f"[MCP LOG] Event saved.")
        except Exception as e:
            print(f"[MCP ERROR] Supabase Log Failed: {e}")


        # 2. Routing Logic
        if target_agent in self.agents:
            agent = self.agents[target_agent]
            # Route based on event type if the agent has a handler
            if hasattr(agent, "handle_event"):
                await agent.handle_event(event_type, patient_id, payload)
            else:
                print(f"[MCP WARNING] Agent '{target_agent}' has no 'handle_event' method.")
        else:
            print(f"[MCP INFO] No active subscriber for '{target_agent}'. Event buffered in DB.")
        
        return event_data


# Singleton instance of MCP Server will be initialized in main.py

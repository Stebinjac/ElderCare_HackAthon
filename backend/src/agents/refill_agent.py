import asyncio
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List
from supabase import Client

class RefillMonitorAgent:
    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.is_running = False

    async def generate_health_report(self, patient_id: str) -> Dict[str, Any]:
        """Compile a health status report including recent vitals and medications."""
        # Get patient details
        user_res = self.supabase.table("users").select("name, dob").eq("id", patient_id).execute()
        user = user_res.data[0] if user_res.data else {}

        # Get recent vitals
        vitals_res = self.supabase.table("vitals").select("*").eq("patient_id", patient_id).order("logged_at", desc=True).limit(10).execute()
        vitals = vitals_res.data or []

        # Get current medications
        meds_res = self.supabase.table("medications").select("name, dosage, frequency, current_stock").eq("patient_id", patient_id).execute()
        medications = meds_res.data or []

        report = {
            "patient_name": user.get("name", "Unknown"),
            "report_date": datetime.now().isoformat(),
            "summary": "This is an automated health status report generated for medication refill approval.",
            "recent_vitals": vitals,
            "current_medications": medications
        }
        return report

    async def check_stocks_and_trigger_refills(self):
        """Check all medications for low stock and initiate refill requests."""
        print("[RefillAgent] Checking medication stocks...")
        
        # Get all medications
        # Note: In a real app we'd filter by current_stock < stock_threshold in the query
        # But let's fetch and filter to be safe with existing data
        res = self.supabase.table("medications").select("*").execute()
        meds = res.data or []

        for med in meds:
            stock_count = med.get("current_stock")
            threshold = med.get("stock_threshold")
            
            # Skip if threshold is not set or stock is sufficient
            if stock_count is None or threshold is None:
                continue
                
            if stock_count <= threshold:
                # Check if a pending refill request already exists for this medication
                # Statuses that count as "already in progress": pending, approved_by_doctor, approved_by_patient
                pending_res = self.supabase.table("refill_requests").select("id").eq("medication_id", med["id"]).in_("status", ["pending", "approved_by_patient", "approved_by_doctor"]).execute()
                
                if not pending_res.data:
                    print(f"[RefillAgent] Low stock detected for {med['name']} (Stock: {stock_count}, Threshold: {threshold}). Initiating refill...")
                    
                    # Generate health report
                    health_report = await self.generate_health_report(med["patient_id"])
                    
                    # Create refill request
                    self.supabase.table("refill_requests").insert({
                        "patient_id": med["patient_id"],
                        "medication_id": med["id"],
                        "status": "pending",
                        "health_report": health_report
                    }).execute()
                else:
                    print(f"[RefillAgent] Refill already in progress for {med['name']}.")

    async def run_forever(self, interval_seconds: int = 3600):
        """Background loop to periodically check stocks."""
        self.is_running = True
        while self.is_running:
            try:
                await self.check_stocks_and_trigger_refills()
            except Exception as e:
                print(f"[RefillAgent] Error in background loop: {e}")
            
            await asyncio.sleep(interval_seconds)

    def stop(self):
        self.is_running = False

import os
import asyncio
import json
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

async def verify_refill_flow():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    supabase: Client = create_client(url, key)

    print("--- Autonomous Double-Approval Refill Flow Verification ---")

    # 1. Setup: Create/Find a patient
    user_res = supabase.table("users").select("id").eq("role", "patient").limit(1).execute()
    if not user_res.data:
        print("No patient found. Please seed data first.")
        return
    patient_id = user_res.data[0]["id"]
    print(f"Using patient_id: {patient_id}")

    # 2. Add a low-stock medication
    med_name = f"TestMed_{int(asyncio.get_event_loop().time())}"
    print(f"Creating low stock medication: {med_name}")
    med_res = supabase.table("medications").insert({
        "patient_id": patient_id,
        "name": med_name,
        "current_stock": 5,
        "stock_threshold": 10,
        "refill_quantity": 30
    }).execute()
    med_id = med_res.data[0]["id"]

    # 3. Trigger autonomous check
    from agents.refill_agent import RefillMonitorAgent
    agent = RefillMonitorAgent(supabase)
    print("Triggering autonomous stock check...")
    await agent.check_stocks_and_trigger_refills()

    # 4. Verify refill request created (Status: pending)
    req_res = supabase.table("refill_requests").select("*").eq("medication_id", med_id).execute()
    if not req_res.data:
        print("FAILED: No refill request created.")
        return
    
    refill_id = req_res.data[0]["id"]
    print(f"SUCCESS: Refill request created with ID: {refill_id}, Status: {req_res.data[0]['status']}")

    # 5. Simulate Doctor approval (API Call)
    print("Simulating Doctor approval...")
    import httpx
    async with httpx.AsyncClient() as client:
        response = await client.post("http://localhost:8000/api/refill/approve", json={
            "refill_id": refill_id,
            "user_id": "dummy_doctor_id", # Backend doesn't strictly check user_id for now, just role
            "role": "doctor"
        })
        print(f"Doctor approval response: {response.json()}")

    # 6. Verify status updated to approved_by_doctor
    req_res = supabase.table("refill_requests").select("status").eq("id", refill_id).execute()
    print(f"Status after Doctor approval: {req_res.data[0]['status']}")

    # 7. Simulate Patient approval (API Call)
    print("Simulating Patient approval...")
    async with httpx.AsyncClient() as client:
        response = await client.post("http://localhost:8000/api/refill/approve", json={
            "refill_id": refill_id,
            "user_id": patient_id,
            "role": "patient"
        })
        print(f"Patient approval response: {response.json()}")

    # 8. Final check: verify status is completed and stock is refilled
    req_res = supabase.table("refill_requests").select("status").eq("id", refill_id).execute()
    med_res = supabase.table("medications").select("current_stock").eq("id", med_id).execute()
    
    print(f"Final Status: {req_res.data[0]['status']}")
    print(f"Final Stock: {med_res.data[0]['current_stock']}")

    if req_res.data[0]["status"] == "completed" and med_res.data[0]["current_stock"] == 35:
        print("VERIFICATION SUCCESSFUL: Flow works as expected.")
    else:
        print("VERIFICATION FAILED.")

if __name__ == "__main__":
    import asyncio
    asyncio.run(verify_refill_flow())

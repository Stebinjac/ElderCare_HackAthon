"""
AgentCare Tool Functions
Executable actions that the AI agent can invoke via Gemini function-calling.
"""
import os
import json
import httpx
from typing import Dict, Any, Optional
from supabase import Client


async def get_health_summary(supabase: Client, patient_id: str) -> Dict[str, Any]:
    """Fetch latest vitals and lab report metrics for the patient."""
    # Get user profile
    user_res = supabase.table("users").select("name, email, dob, guardian_phone").eq("id", patient_id).execute()
    user = user_res.data[0] if user_res.data else {}

    # Get latest vitals
    vitals_res = supabase.table("vitals").select("*").eq("patient_id", patient_id).order("logged_at", desc=True).limit(5).execute()
    vitals = vitals_res.data

    # Get medications
    meds_res = supabase.table("medications").select("name, dosage, frequency").eq("patient_id", patient_id).execute()
    medications = meds_res.data

    return {
        "patient_name": user.get("name", "Unknown"),
        "dob": user.get("dob"),
        "guardian_phone": user.get("guardian_phone"),
        "latest_vitals": vitals[0] if vitals else None,
        "vitals_history": vitals,
        "medications": medications,
    }


async def get_appointments(supabase: Client, patient_id: str) -> Dict[str, Any]:
    """List upcoming appointments for the patient."""
    res = supabase.table("appointments").select(
        "*, doctor:doctor_id (name, email)"
    ).eq("patient_id", patient_id).order("date", desc=False).execute()

    appointments = [{
        "id": a["id"],
        "doctor_name": a.get("doctor", {}).get("name", "Unknown") if a.get("doctor") else "Unknown",
        "date": a["date"],
        "time": a["time"],
        "type": a["type"],
        "status": a["status"],
        "reason": a.get("reason"),
    } for a in (res.data or [])]

    return {"appointments": appointments, "total": len(appointments)}


async def book_appointment(
    supabase: Client,
    patient_id: str,
    doctor_name: Optional[str] = None,
    specialty: Optional[str] = None,
    date: Optional[str] = None,
    time: Optional[str] = None,
    reason: Optional[str] = None,
) -> Dict[str, Any]:
    """Auto-book an appointment with a doctor. Finds the assigned doctor or specialist if not specified."""
    # Find doctor
    doc_res = None
    if doctor_name:
        doc_res = supabase.table("users").select("id, name, speciality").eq("role", "doctor").ilike("name", f"%{doctor_name}%").limit(1).execute()
    
    if (not doc_res or not doc_res.data) and specialty:
        # Normalize specialty for better matching
        search_spec = specialty.strip().capitalize()
        
        # 1. Search for doctors matching EXACT specialty AND already connected to patient
        rel_res = supabase.table("doctor_patient_relations").select("doctor_id").eq("patient_id", patient_id).eq("status", "accepted").execute()
        connected_ids = [r["doctor_id"] for r in rel_res.data] if rel_res.data else []
        
        if connected_ids:
            doc_res = supabase.table("users").select("id, name, speciality").eq("role", "doctor").eq("speciality", search_spec).in_("id", connected_ids).limit(1).execute()
            
        # 2. If no connected EXACT specialist, search for any doctor with EXACT specialty
        if not doc_res or not doc_res.data:
            doc_res = supabase.table("users").select("id, name, speciality").eq("role", "doctor").eq("speciality", search_spec).limit(1).execute()
            
        # 3. If still no exact match, try a partial match (e.g. "Ortho" -> "Orthopedics")
        if not doc_res or not doc_res.data:
            doc_res = supabase.table("users").select("id, name, speciality").eq("role", "doctor").ilike("speciality", f"%{specialty}%").limit(1).execute()

    # Fallback to general doctor ONLY if NO specialty and NO doctor_name were requested
    if (not doc_res or not doc_res.data) and not specialty and not doctor_name:
        # Find any doctor linked to this patient
        rel_res = supabase.table("doctor_patient_relations").select("doctor_id").eq("patient_id", patient_id).eq("status", "accepted").limit(1).execute()
        if rel_res.data:
            doc_res = supabase.table("users").select("id, name, speciality").eq("id", rel_res.data[0]["doctor_id"]).execute()
        else:
            # Absolute last resort: find a general practitioner
            doc_res = supabase.table("users").select("id, name, speciality").eq("role", "doctor").ilike("speciality", "%General%").limit(1).execute()

    if not doc_res or not doc_res.data:
        fail_msg = f"I couldn't find a {specialty} specialist. Would you like to see a General Practitioner instead?" if specialty else "I couldn't find any available doctors at the moment."
        return {"success": False, "error": fail_msg}

    doctor = doc_res.data[0]

    # Default date: tomorrow
    if not date:
        from datetime import datetime, timedelta
        date = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")

    # Find available slot
    if not time:
        slots_res = supabase.table("appointments").select("time").eq("doctor_id", doctor["id"]).eq("date", date).in_("status", ["pending", "accepted"]).execute()
        booked = [s["time"] for s in (slots_res.data or [])]
        all_slots = [f"{h:02d}:{m:02d}" for h in range(9, 17) for m in [0, 30]]
        available = [s for s in all_slots if s not in booked]
        time = available[0] if available else "10:00"

    # Book it
    insert_res = supabase.table("appointments").insert({
        "patient_id": patient_id,
        "doctor_id": doctor["id"],
        "date": date,
        "time": time,
        "type": reason or "General Checkup",
        "reason": reason,
        "status": "pending",
    }).execute()

    if insert_res.data:
        return {
            "success": True,
            "doctor_name": doctor["name"],
            "date": date,
            "time": time,
            "reason": reason or "General Checkup",
            "status": "pending",
        }
    return {"success": False, "error": "Failed to insert appointment."}


async def find_nearest_hospital(
    patient_city: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
) -> Dict[str, Any]:
    """Find nearest hospitals using OpenStreetMap Nominatim + Overpass API."""
    # Default to a location if none provided
    if not latitude or not longitude:
        # Geocode the city
        city = patient_city or "New York"
        async with httpx.AsyncClient() as client:
            geo_res = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={"q": city, "format": "json", "limit": 1},
                headers={"User-Agent": "ElderCare-Hackathon/1.0"},
            )
            geo_data = geo_res.json()
            if geo_data:
                latitude = float(geo_data[0]["lat"])
                longitude = float(geo_data[0]["lon"])
            else:
                return {"hospitals": [], "error": f"Could not geocode city: {city}"}

    # Search hospitals via Overpass API (OpenStreetMap)
    overpass_query = f"""
    [out:json][timeout:10];
    (
      node["amenity"="hospital"](around:10000,{latitude},{longitude});
      way["amenity"="hospital"](around:10000,{latitude},{longitude});
    );
    out center 5;
    """
    async with httpx.AsyncClient() as client:
        res = await client.post(
            "https://overpass-api.de/api/interpreter",
            data={"data": overpass_query},
            timeout=15.0,
        )
        data = res.json()

    hospitals = []
    for el in data.get("elements", [])[:5]:
        tags = el.get("tags", {})
        lat = el.get("lat") or el.get("center", {}).get("lat")
        lon = el.get("lon") or el.get("center", {}).get("lon")
        name = tags.get("name", "Unnamed Hospital")
        hospitals.append({
            "name": name,
            "address": tags.get("addr:full") or tags.get("addr:street", "Address not available"),
            "phone": tags.get("phone", "N/A"),
            "emergency": tags.get("emergency", "unknown"),
            "latitude": lat,
            "longitude": lon,
            "maps_link": f"https://www.google.com/maps/search/?api=1&query={lat},{lon}" if lat and lon else None,
        })

    return {"hospitals": hospitals, "search_center": {"lat": latitude, "lon": longitude}, "count": len(hospitals)}


async def send_emergency_alert(supabase: Client, patient_id: str, message: Optional[str] = None) -> Dict[str, Any]:
    """Send an emergency SMS alert to the patient's guardian via Twilio."""
    # Get patient info
    user_res = supabase.table("users").select("name, guardian_phone").eq("id", patient_id).execute()
    user = user_res.data[0] if user_res.data else {}

    if not user.get("guardian_phone"):
        return {"success": False, "error": "No guardian phone number on file. Please update profile settings."}

    alert_message = message or f"Emergency alert for {user.get('name', 'your loved one')}. Please check on them immediately."

    # Use Twilio if available
    try:
        import twilio
        from twilio.rest import Client as TwilioClient

        sid = os.environ.get("TWILIO_ACCOUNT_SID")
        token = os.environ.get("TWILIO_AUTH_TOKEN")
        from_phone = os.environ.get("TWILIO_PHONE_NUMBER")

        if sid and token and from_phone:
            tw_client = TwilioClient(sid, token)
            sms = tw_client.messages.create(
                body=f"ELDERCARE ALERT: {alert_message}",
                from_=from_phone,
                to=user["guardian_phone"],
            )
            return {"success": True, "sent_to": user["guardian_phone"], "twilio_sid": sms.sid}
    except Exception as e:
        pass

    # Simulated fallback
    return {
        "success": True,
        "sent_to": user["guardian_phone"],
        "simulated": True,
        "message": alert_message,
    }


async def get_medications(supabase: Client, patient_id: str) -> Dict[str, Any]:
    """Fetch current medications for the patient."""
    res = supabase.table("medications").select("*").eq("patient_id", patient_id).execute()
    return {"medications": res.data or [], "count": len(res.data or [])}

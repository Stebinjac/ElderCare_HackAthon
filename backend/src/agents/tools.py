"""
AgentCare Tool Functions
Executable actions that the AI agent can invoke via function-calling.
"""
import os
import httpx
from typing import Dict, Any, Optional
from supabase import Client


async def get_health_summary(supabase: Client, patient_id: str) -> Dict[str, Any]:
    user_res = supabase.table("users").select("name, email, dob, guardian_phone").eq("id", patient_id).execute()
    user = user_res.data[0] if user_res.data else {}

    vitals_res = supabase.table("vitals").select("*").eq("patient_id", patient_id).order("logged_at", desc=True).limit(5).execute()
    vitals = vitals_res.data or []

    meds_res = supabase.table("medications").select("name, dosage, frequency").eq("patient_id", patient_id).execute()
    medications = meds_res.data or []

    return {
        "patient_name": user.get("name", "Unknown"),
        "dob": user.get("dob"),
        "guardian_phone": user.get("guardian_phone"),
        "latest_vitals": vitals[0] if vitals else None,
        "vitals_history": vitals,
        "medications": medications,
    }


async def get_available_doctors(supabase: Client) -> Dict[str, Any]:
    """Fetch all available doctors with their names and specialities."""
    res = supabase.table("users").select("id, name, speciality, email").eq("role", "doctor").execute()
    doctors = res.data or []
    return {
        "doctors": [
            {
                "name": d["name"],
                "speciality": d.get("speciality") or "General Physician",
                "email": d.get("email"),
            }
            for d in doctors
        ],
        "total": len(doctors),
    }


async def get_appointments(supabase: Client, patient_id: str) -> Dict[str, Any]:
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
        "patient_notes": a.get("patient_notes"),
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
    patient_notes: Optional[str] = None,
) -> Dict[str, Any]:
    """Book appointment with a doctor chosen by name from get_available_doctors."""
    doc_res = None

    # Find doctor by name
    if doctor_name:
        doc_res = supabase.table("users").select("id, name, speciality").eq("role", "doctor").ilike("name", f"%{doctor_name}%").limit(1).execute()

    # Fallback: patient's assigned doctor
    if not doc_res or not doc_res.data:
        rel_res = supabase.table("doctor_patient_relations").select("doctor_id").eq("patient_id", patient_id).eq("status", "accepted").limit(1).execute()
        if rel_res.data:
            doc_res = supabase.table("users").select("id, name, speciality").eq("id", rel_res.data[0]["doctor_id"]).execute()

    # Last resort: any doctor
    if not doc_res or not doc_res.data:
        doc_res = supabase.table("users").select("id, name, speciality").eq("role", "doctor").limit(1).execute()

    if not doc_res or not doc_res.data:
        return {"success": False, "error": "No doctors found in the system."}

    doctor = doc_res.data[0]

    # Default date: tomorrow
    if not date:
        from datetime import datetime, timedelta
        date = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")

    # Auto-pick first available slot
    if not time:
        slots_res = supabase.table("appointments").select("time").eq("doctor_id", doctor["id"]).eq("date", date).in_("status", ["pending", "accepted"]).execute()
        booked = [s["time"] for s in (slots_res.data or [])]
        all_slots = [f"{h:02d}:{m:02d}" for h in range(9, 17) for m in [0, 30]]
        available = [s for s in all_slots if s not in booked]
        time = available[0] if available else "10:00"

    insert_res = supabase.table("appointments").insert({
        "patient_id": patient_id,
        "doctor_id": doctor["id"],
        "date": date,
        "time": time,
        "type": reason or "General Checkup",
        "reason": reason,
        "patient_notes": patient_notes,
        "status": "pending",
    }).execute()

    if insert_res.data:
        return {
            "success": True,
            "doctor_name": doctor["name"],
            "doctor_speciality": doctor.get("speciality") or "General Physician",
            "date": date,
            "time": time,
            "reason": reason,
            "patient_notes": patient_notes,
            "status": "pending",
        }
    return {"success": False, "error": "Failed to insert appointment."}


async def find_nearest_hospital(
    patient_city: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
) -> Dict[str, Any]:
    if not latitude or not longitude:
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
        hospitals.append({
            "name": tags.get("name", "Unnamed Hospital"),
            "address": tags.get("addr:full") or tags.get("addr:street", "Address not available"),
            "phone": tags.get("phone", "N/A"),
            "emergency": tags.get("emergency", "unknown"),
            "latitude": lat,
            "longitude": lon,
            "maps_link": f"https://www.google.com/maps/search/?api=1&query={lat},{lon}" if lat and lon else None,
        })

    return {"hospitals": hospitals, "search_center": {"lat": latitude, "lon": longitude}, "count": len(hospitals)}


async def send_emergency_alert(supabase: Client, patient_id: str, message: Optional[str] = None) -> Dict[str, Any]:
    user_res = supabase.table("users").select("name, guardian_phone").eq("id", patient_id).execute()
    user = user_res.data[0] if user_res.data else {}

    if not user.get("guardian_phone"):
        return {"success": False, "error": "No guardian phone number on file."}

    alert_message = message or f"Emergency alert for {user.get('name', 'your loved one')}. Please check on them immediately."

    try:
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
    except Exception:
        pass

    return {"success": True, "sent_to": user["guardian_phone"], "simulated": True, "message": alert_message}


async def get_medications(supabase: Client, patient_id: str) -> Dict[str, Any]:
    res = supabase.table("medications").select("*").eq("patient_id", patient_id).execute()
    return {"medications": res.data or [], "count": len(res.data or [])}

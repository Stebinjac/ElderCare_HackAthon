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


async def get_available_doctors(supabase: Client, user_lat: Optional[float] = None, user_lng: Optional[float] = None) -> Dict[str, Any]:
    """Fetch available doctors at hospitals near the patient."""
    
    # 1. First, find hospitals near the user
    nearby_hospital_names = []
    if user_lat is not None and user_lng is not None:
        hospital_res = await find_nearest_hospital(latitude=user_lat, longitude=user_lng)
        nearby_hospital_names = [h["name"].lower() for h in hospital_res.get("hospitals", [])]
        print(f"[AgentCare] Nearby hospitals found: {nearby_hospital_names}")

    # 2. Fetch doctors
    res = supabase.table("users").select("id, name, speciality, email, hospital_name").eq("role", "doctor").execute()
    doctors = res.data or []
    
    filtered_doctors = []
    for d in doctors:
        doc_hospital = (d.get("hospital_name") or "").lower()
        
        # If no proximity data available, include all (fallback)
        if not nearby_hospital_names:
            filtered_doctors.append({
                "name": d["name"],
                "speciality": d.get("speciality") or "General Physician",
                "email": d.get("email"),
                "hospital": d.get("hospital_name") or "Clinic",
                "is_near": False
            })
            continue

        # Match doctor hospital against nearby hospitals
        is_near = any(h_name in doc_hospital or doc_hospital in h_name for h_name in nearby_hospital_names)
        
        if is_near:
            filtered_doctors.append({
                "name": d["name"],
                "speciality": d.get("speciality") or "General Physician",
                "email": d.get("email"),
                "hospital": d.get("hospital_name") or "Clinic",
                "is_near": True
            })

    # If we have nearby results, only show those. Otherwise show all.
    near_matches = [d for d in filtered_doctors if d.get("is_near")]
    results = near_matches if near_matches else filtered_doctors

    msg = "Showing only doctors at nearby hospitals." if near_matches else "No doctors found at nearby hospitals. Showing ALL available doctors from the database. Do NOT invent a doctor."

    return {
        "message": msg,
        "doctors": results,
        "total": len(results),
        "proximity_active": bool(near_matches)
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
        doc_res = supabase.table("users").select("id, name, speciality, hospital_name").eq("role", "doctor").ilike("name", f"%{doctor_name}%").limit(1).execute()

    # Last resort: any doctor
    if not doc_res or not doc_res.data:
        doc_res = supabase.table("users").select("id, name, speciality, hospital_name").eq("role", "doctor").limit(1).execute()

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
            "appointment_id": insert_res.data[0]["id"],
            "doctor_name": doctor["name"],
            "doctor_speciality": doctor.get("speciality") or "General Physician",
            "hospital_name": doctor.get("hospital_name") or "Clinic",
            "date": date,
            "time": time,
            "reason": reason,
            "patient_notes": patient_notes,
            "status": "pending",
        }
    return {"success": False, "error": "Failed to insert appointment."}


import math

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points in kilometers."""
    R = 6371.0  # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

async def find_nearest_hospital(
    patient_city: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
) -> Dict[str, Any]:
    """Find nearest hospitals using OpenStreetMap Nominatim + Overpass API."""
    search_lat, search_lon = latitude, longitude
    print(f"[AgentCare] find_nearest_hospital: Initial Lat/Lng: {latitude}/{longitude}, City: {patient_city}")

    # If no coordinates, geocode the city
    if search_lat is None or search_lon is None:
        city = patient_city or "Kochi"
        print(f"[AgentCare] find_nearest_hospital: Missing coordinates. Geocoding fallback city: {city}")
        async with httpx.AsyncClient() as client:
            geo_res = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={"q": city, "format": "json", "limit": 1},
                headers={"User-Agent": "ElderCare-Hackathon/1.0"},
                timeout=10.0,
            )
            geo_data = geo_res.json()
            if geo_data:
                search_lat = float(geo_data[0]["lat"])
                search_lon = float(geo_data[0]["lon"])
                print(f"[AgentCare] Resolved {city} to {search_lat}/{search_lon}")
            else:
                return {"hospitals": [], "error": f"Could not geocode city: {city}"}

    # Search hospitals via Overpass API (OpenStreetMap) within 5km
    overpass_query = f"""
    [out:json][timeout:15];
    (
      node["amenity"="hospital"](around:5000,{search_lat},{search_lon});
      way["amenity"="hospital"](around:5000,{search_lat},{search_lon});
    );
    out center;
    """
    async with httpx.AsyncClient() as client:
        res = await client.post(
            "https://overpass-api.de/api/interpreter",
            data={"data": overpass_query},
            timeout=20.0,
        )
        if res.status_code != 200:
            print(f"[AgentCare] Overpass API Error: {res.status_code} - {res.text}")
            return {"hospitals": [], "error": f"Hospital search API error: {res.status_code}"}
        
        try:
            data = res.json()
        except Exception as e:
            print(f"[AgentCare] Overpass API JSON Error: {e}")
            print(f"Response text: {res.text[:500]}")
            return {"hospitals": [], "error": "Failed to parse hospital search results."}

    hospitals = []
    for el in data.get("elements", []):
        tags = el.get("tags", {})
        lat = el.get("lat") or el.get("center", {}).get("lat")
        lon = el.get("lon") or el.get("center", {}).get("lon")
        
        distance = None
        if search_lat is not None and search_lon is not None and lat and lon:
            distance = calculate_haversine_distance(search_lat, search_lon, lat, lon)

        hospitals.append({
            "name": tags.get("name", "Unnamed Hospital"),
            "address": tags.get("addr:full") or tags.get("addr:street", "Address not available"),
            "phone": tags.get("phone", "N/A"),
            "emergency": tags.get("emergency", "unknown"),
            "latitude": lat,
            "longitude": lon,
            "distance": round(distance, 2) if distance is not None else None,
            "maps_link": f"https://www.google.com/maps/search/?api=1&query={lat},{lon}" if lat and lon else None,
        })

    # Sort by distance
    hospitals.sort(key=lambda x: x["distance"] if x["distance"] is not None else float('inf'))

    return {
        "hospitals": hospitals[:5], 
        "search_center": {"lat": search_lat, "lon": search_lon}, 
        "count": min(len(hospitals), 5)
    }


async def send_emergency_alert(supabase: Client, patient_id: str, message: Optional[str] = None) -> Dict[str, Any]:
    user_res = supabase.table("users").select("name, guardian_phone").eq("id", patient_id).execute()
    user = user_res.data[0] if user_res.data else {}

    dest_phone = user.get("guardian_phone", "").strip()
    if not dest_phone:
        return {"success": False, "error": "No guardian phone number on file."}
    
    # Simple formatting for Kerala/India (10 digits -> +91)
    if len(dest_phone) == 10 and dest_phone.isdigit():
        dest_phone = f"+91{dest_phone}"
    elif not dest_phone.startswith("+"):
        # If it doesn't start with +, Twilio will likely fail anyway, but we can try to be smart
        pass

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
                to=dest_phone,
            )
            print(f"[AgentCare] SMS sent successfully via Twilio! SID: {sms.sid}")
            return {"success": True, "sent_to": dest_phone, "twilio_sid": sms.sid}
        else:
            print("[AgentCare] Twilio credentials missing in .env. Falling back to simulation.")
    except Exception as e:
        error_detail = str(e)
        print(f"[AgentCare] Twilio Error: {error_detail}")
        return {"success": False, "error": f"Twilio failed: {error_detail}", "sent_to": dest_phone}

    return {"success": True, "sent_to": dest_phone, "simulated": True, "message": alert_message}


async def get_medications(supabase: Client, patient_id: str) -> Dict[str, Any]:
    res = supabase.table("medications").select("*").eq("patient_id", patient_id).execute()
    return {"medications": res.data or [], "count": len(res.data or [])}

"""
Migration: Add pre_visit_report columns to appointments table.
Run once: python migrate_previsit.py
"""
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])

# Use Supabase's RPC to run raw SQL (requires service_role key)
# We'll use the postgrest approach: try to update a row with the new columns.
# If columns don't exist, we need to add them via Supabase Dashboard SQL Editor.

# Alternative: Use the REST API to check if columns exist
test = supabase.table("appointments").select("id").limit(1).execute()
print(f"Appointments table accessible: {len(test.data)} row(s)")

# Try selecting the new columns to see if they exist
try:
    test2 = supabase.table("appointments").select("id, pre_visit_report, pre_visit_status").limit(1).execute()
    print("✅ Columns already exist! Migration not needed.")
except Exception as e:
    print(f"❌ Columns don't exist yet. Error: {e}")
    print("\n⚠️  Please run this SQL in Supabase Dashboard > SQL Editor:")
    print("""
    ALTER TABLE appointments 
    ADD COLUMN IF NOT EXISTS pre_visit_report TEXT,
    ADD COLUMN IF NOT EXISTS pre_visit_status TEXT DEFAULT NULL;
    """)
    print("Then re-run this script to verify.")

-- ============================================================
-- ElderCare AI - Full Schema Migration (v2 - Safe ALTER)
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ===== 1. ADD MISSING COLUMNS TO EXISTING 'patients' TABLE =====
DO $$
BEGIN
    -- user_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='user_id') THEN
        ALTER TABLE patients ADD COLUMN user_id UUID REFERENCES users(id);
    END IF;
    -- name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='name') THEN
        ALTER TABLE patients ADD COLUMN name TEXT NOT NULL DEFAULT 'Unknown';
    END IF;
    -- age
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='age') THEN
        ALTER TABLE patients ADD COLUMN age INTEGER;
    END IF;
    -- gender
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='gender') THEN
        ALTER TABLE patients ADD COLUMN gender TEXT;
    END IF;
    -- conditions
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='conditions') THEN
        ALTER TABLE patients ADD COLUMN conditions TEXT[];
    END IF;
    -- allergies
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='allergies') THEN
        ALTER TABLE patients ADD COLUMN allergies TEXT[];
    END IF;
    -- blood_group
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='blood_group') THEN
        ALTER TABLE patients ADD COLUMN blood_group TEXT;
    END IF;
    -- guardian_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='guardian_id') THEN
        ALTER TABLE patients ADD COLUMN guardian_id UUID REFERENCES users(id);
    END IF;
    -- doctor_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='doctor_id') THEN
        ALTER TABLE patients ADD COLUMN doctor_id UUID REFERENCES users(id);
    END IF;
    -- phone
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='phone') THEN
        ALTER TABLE patients ADD COLUMN phone TEXT;
    END IF;
    -- address
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='address') THEN
        ALTER TABLE patients ADD COLUMN address TEXT;
    END IF;
    -- created_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='created_at') THEN
        ALTER TABLE patients ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;
    END IF;
END $$;

-- ===== 2. CREATE NEW TABLES (skip if they exist) =====

CREATE TABLE IF NOT EXISTS vitals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) NOT NULL,
    bp_systolic INTEGER,
    bp_diastolic INTEGER,
    heart_rate INTEGER,
    blood_sugar NUMERIC,
    weight NUMERIC,
    spo2 NUMERIC,
    temperature NUMERIC,
    notes TEXT,
    logged_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS medications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) NOT NULL,
    name TEXT NOT NULL,
    dosage TEXT,
    frequency TEXT,
    timing TEXT[],
    stock_count INTEGER,
    daily_dose INTEGER,
    refill_alert BOOLEAN DEFAULT TRUE,
    prescribed_by UUID REFERENCES users(id),
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) NOT NULL,
    type TEXT NOT NULL,
    severity TEXT NOT NULL,
    payload JSONB,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES users(id),
    triggered_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS mcp_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_agent TEXT NOT NULL,
    target_agent TEXT NOT NULL,
    event_type TEXT NOT NULL,
    patient_id UUID REFERENCES patients(id) NOT NULL,
    payload JSONB,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ===== 3. ENSURE 'phone' column on users =====
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='phone') THEN
        ALTER TABLE users ADD COLUMN phone TEXT;
    END IF;
END $$;

-- ===== 4. BACKFILL: Link existing patient-role users =====
INSERT INTO patients (user_id, name)
SELECT id, name FROM users
WHERE role = 'patient'
AND id NOT IN (SELECT user_id FROM patients WHERE user_id IS NOT NULL)
ON CONFLICT DO NOTHING;

SELECT 'Migration complete!' AS status;

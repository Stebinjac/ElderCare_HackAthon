-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Vitals Table
CREATE TABLE IF NOT EXISTS vitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    bp_systolic INTEGER NOT NULL,
    bp_diastolic INTEGER NOT NULL,
    heart_rate INTEGER NOT NULL,
    spo2 INTEGER NOT NULL,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Medications Table
CREATE TABLE IF NOT EXISTS medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    dosage TEXT,
    frequency TEXT,
    started_at DATE,
    notes TEXT
);

-- Hospitals Table
CREATE TABLE IF NOT EXISTS hospitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    specialization TEXT[],
    er_available BOOLEAN DEFAULT TRUE,
    address TEXT,
    contact_phone TEXT
);

-- MCP Events (Audit Log)
CREATE TABLE IF NOT EXISTS mcp_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_agent TEXT NOT NULL,
    target_agent TEXT,
    event_type TEXT NOT NULL,
    patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    payload JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Patients Table (Adapter)
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    guardian_id UUID REFERENCES users(id),
    doctor_id UUID REFERENCES users(id),
    city TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed test data
INSERT INTO hospitals (name, city, specialization, er_available) VALUES
('City General Hospital', 'New York', ARRAY['Cardiology', 'Emergency', 'Neurology'], true),
('St. Judes Medical Center', 'New York', ARRAY['Geriatrics', 'Orthopedics', 'Emergency'], true),
('Sunset Health Clinic', 'New York', ARRAY['General', 'Emergency'], true)
ON CONFLICT DO NOTHING;

import { pgTable, text, timestamp, uuid, integer, decimal, boolean, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    role: text('role').notNull().default('patient'), // patient or doctor
    phone: text('phone'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const patients = pgTable('patients', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id), // Direct link to user if they are the patient
    name: text('name').notNull(),
    age: integer('age'),
    gender: text('gender'),
    conditions: text('conditions').array(),
    allergies: text('allergies').array(),
    bloodGroup: text('blood_group'),
    guardianId: uuid('guardian_id').references(() => users.id),
    doctorId: uuid('doctor_id').references(() => users.id),
    phone: text('phone'),
    address: text('address'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const doctorPatientRelations = pgTable('doctor_patient_relations', {
    id: uuid('id').defaultRandom().primaryKey(),
    doctorId: uuid('doctor_id').references(() => users.id).notNull(),
    patientId: uuid('patient_id').references(() => patients.id).notNull(),
    status: text('status').notNull().default('pending'), // pending, accepted, rejected
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const vitals = pgTable('vitals', {
    id: uuid('id').defaultRandom().primaryKey(),
    patientId: uuid('patient_id').references(() => patients.id).notNull(),
    bpSystolic: integer('bp_systolic'),
    bpDiastolic: integer('bp_diastolic'),
    heartRate: integer('heart_rate'),
    bloodSugar: decimal('blood_sugar'),
    weight: decimal('weight'),
    spo2: decimal('spo2'),
    temperature: decimal('temperature'),
    notes: text('notes'),
    loggedAt: timestamp('logged_at').defaultNow().notNull(),
});

export const medications = pgTable('medications', {
    id: uuid('id').defaultRandom().primaryKey(),
    patientId: uuid('patient_id').references(() => patients.id).notNull(),
    name: text('name').notNull(),
    dosage: text('dosage'),
    frequency: text('frequency'),
    timing: text('timing').array(),
    stockCount: integer('stock_count'),
    dailyDose: integer('daily_dose'),
    refillAlert: boolean('refill_alert').default(true),
    prescribedBy: uuid('prescribed_by').references(() => users.id),
    startDate: timestamp('start_date'),
    endDate: timestamp('end_date'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const appointments = pgTable('appointments', {
    id: uuid('id').defaultRandom().primaryKey(),
    patientId: uuid('patient_id').references(() => patients.id).notNull(),
    doctorId: uuid('doctor_id').references(() => users.id).notNull(),
    date: text('date').notNull(), // Format: YYYY-MM-DD
    time: text('time').notNull(), // Format: HH:MM
    status: text('status').notNull().default('pending'), // pending, accepted, rejected, completed
    type: text('type').notNull().default('General Checkup'),
    reason: text('reason'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const alerts = pgTable('alerts', {
    id: uuid('id').defaultRandom().primaryKey(),
    patientId: uuid('patient_id').references(() => patients.id).notNull(),
    type: text('type').notNull(), // EMERGENCY_VITALS | INACTIVITY | TREND_WARNING
    severity: text('severity').notNull(), // CRITICAL | HIGH | MEDIUM | INFO
    payload: jsonb('payload'),
    resolved: boolean('resolved').default(false),
    resolvedBy: uuid('resolved_by').references(() => users.id),
    triggeredAt: timestamp('triggered_at').defaultNow().notNull(),
});

export const mcpEvents = pgTable('mcp_events', {
    id: uuid('id').defaultRandom().primaryKey(),
    sourceAgent: text('source_agent').notNull(),
    targetAgent: text('target_agent').notNull(),
    eventType: text('event_type').notNull(),
    patientId: uuid('patient_id').references(() => patients.id).notNull(),
    payload: jsonb('payload'),
    processed: boolean('processed').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

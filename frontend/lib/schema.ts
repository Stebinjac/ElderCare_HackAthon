import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    role: text('role').notNull().default('patient'), // patient or doctor
    guardianPhone: text('guardian_phone'),
    phone: text('phone'),
    dob: text('dob'),
    speciality: text('speciality'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const doctorPatientRelations = pgTable('doctor_patient_relations', {
    id: uuid('id').defaultRandom().primaryKey(),
    doctorId: uuid('doctor_id').references(() => users.id).notNull(),
    patientId: uuid('patient_id').references(() => users.id).notNull(),
    status: text('status').notNull().default('pending'), // pending, accepted, rejected
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const appointments = pgTable('appointments', {
    id: uuid('id').defaultRandom().primaryKey(),
    patientId: uuid('patient_id').references(() => users.id).notNull(),
    doctorId: uuid('doctor_id').references(() => users.id).notNull(),
    date: text('date').notNull(), // Format: YYYY-MM-DD
    time: text('time').notNull(), // Format: HH:MM
    status: text('status').notNull().default('pending'), // pending, accepted, rejected, completed
    type: text('type').notNull().default('General Checkup'),
    reason: text('reason'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

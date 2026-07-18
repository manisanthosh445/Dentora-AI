-- SQL Idempotent Schema Setup for Chaitanya Care Dental
-- Execute this script inside your Supabase SQL Editor (SQL Editor -> New Query)

-- 1. Patients Table
CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  patient_id TEXT UNIQUE,
  full_name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  phone TEXT,
  date_of_birth TEXT,
  blood_group TEXT,
  allergies TEXT,
  chief_complaint TEXT,
  medical_history TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read for all users" ON patients;
CREATE POLICY "Allow read for all users" ON patients FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow write/insert for all users" ON patients;
CREATE POLICY "Allow write/insert for all users" ON patients FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for all users" ON patients;
CREATE POLICY "Allow update for all users" ON patients FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete for all users" ON patients;
CREATE POLICY "Allow delete for all users" ON patients FOR DELETE USING (true);


-- 2. Doctors (Staff Members) Table
CREATE TABLE IF NOT EXISTS doctors (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  specialization TEXT,
  role TEXT DEFAULT 'Doctor',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read for all users" ON doctors;
CREATE POLICY "Allow read for all users" ON doctors FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow write/insert for all users" ON doctors;
CREATE POLICY "Allow write/insert for all users" ON doctors FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for all users" ON doctors;
CREATE POLICY "Allow update for all users" ON doctors FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete for all users" ON doctors;
CREATE POLICY "Allow delete for all users" ON doctors FOR DELETE USING (true);

-- Populate default doctors (Idempotent seed data)
INSERT INTO doctors (id, name, specialization, role) VALUES 
('1', 'Dr. Chaitanya', 'Endodontist', 'Doctor'),
('2', 'Dr. Anusha', 'Orthodontist', 'Doctor'),
('3', 'Dr. Vikram', 'Pedodontist', 'Doctor')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  specialization = EXCLUDED.specialization,
  role = EXCLUDED.role;


-- 3. Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id TEXT REFERENCES doctors(id) ON DELETE SET NULL,
  patient_name TEXT,
  doctor_name TEXT,
  appointment_date DATE,
  appointment_time TEXT,
  treatment_type TEXT,
  notes TEXT,
  status TEXT DEFAULT 'Scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read for all users" ON appointments;
CREATE POLICY "Allow read for all users" ON appointments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow write/insert for all users" ON appointments;
CREATE POLICY "Allow write/insert for all users" ON appointments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for all users" ON appointments;
CREATE POLICY "Allow update for all users" ON appointments FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete for all users" ON appointments;
CREATE POLICY "Allow delete for all users" ON appointments FOR DELETE USING (true);


-- 4. Consultations Table
CREATE TABLE IF NOT EXISTS consultations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id TEXT REFERENCES doctors(id) ON DELETE SET NULL,
  patient_name TEXT,
  doctor_name TEXT,
  transcription TEXT,
  clinical_summary TEXT,
  soap_notes TEXT,
  diagnosis TEXT,
  treatment_plan TEXT,
  follow_up_advice TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read for all users" ON consultations;
CREATE POLICY "Allow read for all users" ON consultations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow write/insert for all users" ON consultations;
CREATE POLICY "Allow write/insert for all users" ON consultations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for all users" ON consultations;
CREATE POLICY "Allow update for all users" ON consultations FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete for all users" ON consultations;
CREATE POLICY "Allow delete for all users" ON consultations FOR DELETE USING (true);


-- 5. Prescriptions Table
CREATE TABLE IF NOT EXISTS prescriptions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT,
  doctor_name TEXT,
  medication_name TEXT,
  dosage TEXT,
  frequency TEXT,
  duration TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read for all users" ON prescriptions;
CREATE POLICY "Allow read for all users" ON prescriptions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow write/insert for all users" ON prescriptions;
CREATE POLICY "Allow write/insert for all users" ON prescriptions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for all users" ON prescriptions;
CREATE POLICY "Allow update for all users" ON prescriptions FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete for all users" ON prescriptions;
CREATE POLICY "Allow delete for all users" ON prescriptions FOR DELETE USING (true);


-- 6. Treatments Table
CREATE TABLE IF NOT EXISTS treatments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT,
  doctor_name TEXT,
  treatment_name TEXT,
  tooth_number TEXT,
  notes TEXT,
  status TEXT,
  cost NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read for all users" ON treatments;
CREATE POLICY "Allow read for all users" ON treatments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow write/insert for all users" ON treatments;
CREATE POLICY "Allow write/insert for all users" ON treatments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for all users" ON treatments;
CREATE POLICY "Allow update for all users" ON treatments FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete for all users" ON treatments;
CREATE POLICY "Allow delete for all users" ON treatments FOR DELETE USING (true);


-- 7. Billing Table
CREATE TABLE IF NOT EXISTS billing (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT,
  invoice_number TEXT,
  amount NUMERIC,
  status TEXT,
  due_date TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE billing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read for all users" ON billing;
CREATE POLICY "Allow read for all users" ON billing FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow write/insert for all users" ON billing;
CREATE POLICY "Allow write/insert for all users" ON billing FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for all users" ON billing;
CREATE POLICY "Allow update for all users" ON billing FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete for all users" ON billing;
CREATE POLICY "Allow delete for all users" ON billing FOR DELETE USING (true);


-- 8. Queue Table
CREATE TABLE IF NOT EXISTS queue (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT,
  doctor_name TEXT,
  reason TEXT,
  status TEXT,
  checkin_time TEXT,
  priority TEXT DEFAULT 'Normal',
  token TEXT,
  estimated_wait INTEGER DEFAULT 15,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read for all users" ON queue;
CREATE POLICY "Allow read for all users" ON queue FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow write/insert for all users" ON queue;
CREATE POLICY "Allow write/insert for all users" ON queue FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for all users" ON queue;
CREATE POLICY "Allow update for all users" ON queue FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete for all users" ON queue;
CREATE POLICY "Allow delete for all users" ON queue FOR DELETE USING (true);


-- 9. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT,
  type TEXT,
  message TEXT,
  sent_date TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read for all users" ON notifications;
CREATE POLICY "Allow read for all users" ON notifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow write/insert for all users" ON notifications;
CREATE POLICY "Allow write/insert for all users" ON notifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for all users" ON notifications;
CREATE POLICY "Allow update for all users" ON notifications FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete for all users" ON notifications;
CREATE POLICY "Allow delete for all users" ON notifications FOR DELETE USING (true);


-- 10. Dental Charts Table
CREATE TABLE IF NOT EXISTS dental_charts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  chart_data TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE dental_charts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read for all users" ON dental_charts;
CREATE POLICY "Allow read for all users" ON dental_charts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow write/insert for all users" ON dental_charts;
CREATE POLICY "Allow write/insert for all users" ON dental_charts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for all users" ON dental_charts;
CREATE POLICY "Allow update for all users" ON dental_charts FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete for all users" ON dental_charts;
CREATE POLICY "Allow delete for all users" ON dental_charts FOR DELETE USING (true);


-- 11. X-Rays Table
CREATE TABLE IF NOT EXISTS xrays (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT,
  diagnosis TEXT,
  cavities TEXT,
  bone_loss TEXT,
  impacted_teeth TEXT,
  fractures TEXT,
  treatment_plan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE xrays ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read for all users" ON xrays;
CREATE POLICY "Allow read for all users" ON xrays FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow write/insert for all users" ON xrays;
CREATE POLICY "Allow write/insert for all users" ON xrays FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for all users" ON xrays;
CREATE POLICY "Allow update for all users" ON xrays FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete for all users" ON xrays;
CREATE POLICY "Allow delete for all users" ON xrays FOR DELETE USING (true);


-- 12. Reminders Table
CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT,
  medicine_name TEXT,
  dosage TEXT,
  timing TEXT,
  food_relation TEXT,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read for all users" ON reminders;
CREATE POLICY "Allow read for all users" ON reminders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow write/insert for all users" ON reminders;
CREATE POLICY "Allow write/insert for all users" ON reminders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for all users" ON reminders;
CREATE POLICY "Allow update for all users" ON reminders FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete for all users" ON reminders;
CREATE POLICY "Allow delete for all users" ON reminders FOR DELETE USING (true);


-- 13. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_name TEXT,
  action TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read for all users" ON audit_logs;
CREATE POLICY "Allow read for all users" ON audit_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow write/insert for all users" ON audit_logs;
CREATE POLICY "Allow write/insert for all users" ON audit_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for all users" ON audit_logs;
CREATE POLICY "Allow update for all users" ON audit_logs FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete for all users" ON audit_logs;
CREATE POLICY "Allow delete for all users" ON audit_logs FOR DELETE USING (true);

-- Upgrade Reminders Table with EMR columns
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS prescription_id TEXT;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS doctor_name TEXT;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS frequency TEXT;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS duration TEXT;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS instructions TEXT;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS reminder_time TEXT;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS scheduled_date TEXT;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS taken_time TEXT;


-- 14. Medicine Reminders Table
CREATE TABLE IF NOT EXISTS medicine_reminders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  prescription_id TEXT,
  medicine_name TEXT,
  dosage TEXT,
  instructions TEXT,
  reminder_time TEXT,
  start_date TEXT,
  end_date TEXT,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE medicine_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read for all users" ON medicine_reminders;
CREATE POLICY "Allow read for all users" ON medicine_reminders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow write/insert for all users" ON medicine_reminders;
CREATE POLICY "Allow write/insert for all users" ON medicine_reminders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for all users" ON medicine_reminders;
CREATE POLICY "Allow update for all users" ON medicine_reminders FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete for all users" ON medicine_reminders;
CREATE POLICY "Allow delete for all users" ON medicine_reminders FOR DELETE USING (true);


-- 15. Extended Billing and Payments Table Setup
ALTER TABLE billing ADD COLUMN IF NOT EXISTS appointment_id TEXT REFERENCES appointments(id) ON DELETE SET NULL;
ALTER TABLE billing ADD COLUMN IF NOT EXISTS doctor_id TEXT REFERENCES doctors(id) ON DELETE SET NULL;
-- placeholder if needed
ALTER TABLE billing ADD COLUMN IF NOT EXISTS doctor_name TEXT;
ALTER TABLE billing ADD COLUMN IF NOT EXISTS treatment_name TEXT;
ALTER TABLE billing ADD COLUMN IF NOT EXISTS total_amount NUMERIC DEFAULT 0;
ALTER TABLE billing ADD COLUMN IF NOT EXISTS amount_paid NUMERIC DEFAULT 0;
ALTER TABLE billing ADD COLUMN IF NOT EXISTS remaining_balance NUMERIC DEFAULT 0;
ALTER TABLE billing ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE billing ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'Unpaid';
ALTER TABLE billing ADD COLUMN IF NOT EXISTS consultation_charges NUMERIC DEFAULT 0;
ALTER TABLE billing ADD COLUMN IF NOT EXISTS treatment_charges NUMERIC DEFAULT 0;
ALTER TABLE billing ADD COLUMN IF NOT EXISTS procedure_charges NUMERIC DEFAULT 0;
ALTER TABLE billing ADD COLUMN IF NOT EXISTS medicine_charges NUMERIC DEFAULT 0;
ALTER TABLE billing ADD COLUMN IF NOT EXISTS lab_charges NUMERIC DEFAULT 0;
ALTER TABLE billing ADD COLUMN IF NOT EXISTS additional_charges NUMERIC DEFAULT 0;
ALTER TABLE billing ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0;
ALTER TABLE billing ADD COLUMN IF NOT EXISTS tax NUMERIC DEFAULT 0;
ALTER TABLE billing ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE billing ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Recreate payments table with correct compatible foreign key column types (billing.id is UUID, patients.id is TEXT)
DROP TABLE IF EXISTS payments CASCADE;

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES billing(id) ON DELETE CASCADE,
  billing_id UUID REFERENCES billing(id) ON DELETE CASCADE,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  payment_date TEXT,
  payment_time TEXT,
  amount NUMERIC DEFAULT 0,
  payment_method TEXT,
  transaction_reference TEXT,
  collected_by TEXT,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read for all users" ON payments;
CREATE POLICY "Allow read for all users" ON payments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow write/insert for all users" ON payments;
CREATE POLICY "Allow write/insert for all users" ON payments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for all users" ON payments;
CREATE POLICY "Allow update for all users" ON payments FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete for all users" ON payments;
CREATE POLICY "Allow delete for all users" ON payments FOR DELETE USING (true);

-- Proper indexing setup for query optimization
CREATE INDEX IF NOT EXISTS idx_billing_patient_id ON billing(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_billing_id ON payments(billing_id);
CREATE INDEX IF NOT EXISTS idx_payments_patient_id ON payments(patient_id);


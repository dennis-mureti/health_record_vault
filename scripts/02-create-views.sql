-- Database Views for Different User Types

-- Doctor View (Full Access)
CREATE VIEW IF NOT EXISTS doctor_view AS
SELECT 
    p.patient_id,
    p.first_name,
    p.last_name,
    p.date_of_birth,
    p.gender,
    p.phone,
    p.email,
    p.address,
    mr.record_id,
    mr.record_type,
    mr.title,
    mr.description,
    mr.diagnosis_code,
    mr.record_date,
    pr.prescription_id,
    pr.medication_name,
    pr.dosage,
    pr.frequency,
    pr.status as prescription_status
FROM patients p
LEFT JOIN medical_records mr ON p.patient_id = mr.patient_id
LEFT JOIN prescriptions pr ON p.patient_id = pr.patient_id;

-- Pharmacist View (Prescription Access)
CREATE VIEW IF NOT EXISTS pharmacist_view AS
SELECT 
    p.patient_id,
    p.first_name,
    p.last_name,
    p.date_of_birth,
    pr.prescription_id,
    pr.medication_name,
    pr.dosage,
    pr.frequency,
    pr.duration,
    pr.instructions,
    pr.status,
    pr.prescribed_date,
    u.username as doctor_name
FROM patients p
JOIN prescriptions pr ON p.patient_id = pr.patient_id
JOIN users u ON pr.doctor_id = u.user_id
WHERE pr.status = 'pending';

-- Nurse View (Non-sensitive Records)
CREATE VIEW IF NOT EXISTS nurse_view AS
SELECT 
    p.patient_id,
    p.first_name,
    p.last_name,
    p.date_of_birth,
    p.gender,
    p.phone,
    p.emergency_contact_name,
    p.emergency_contact_phone,
    mr.record_id,
    mr.record_type,
    mr.title,
    mr.record_date,
    a.appointment_id,
    a.appointment_date,
    a.status as appointment_status
FROM patients p
LEFT JOIN medical_records mr ON p.patient_id = mr.patient_id AND mr.is_sensitive = 0
LEFT JOIN appointments a ON p.patient_id = a.patient_id;

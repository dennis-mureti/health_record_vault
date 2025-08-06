-- Add more sample data to demonstrate encryption and hashing

-- Insert additional users with hashed passwords
INSERT INTO users (username, password_hash, user_type, email, two_fa_secret) VALUES
('admin_user', '$2b$10$rOzJqQZ9X8qVqVqVqVqVqOzJqQZ9X8qVqVqVqVqVqOzJqQZ9X8qVq', 'admin', 'admin@hospital.com', 'JBSWY3DPEHPK3PXP'),
('dr_johnson', '$2b$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123', 'doctor', 'dr.johnson@hospital.com', NULL),
('nurse_brown', '$2b$10$1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOP', 'nurse', 'brown@hospital.com', 'MFRGG2LTMVZXIZLSMUQQ====');

-- Insert more patients
INSERT INTO patients (first_name, last_name, date_of_birth, gender, phone, email, address, emergency_contact_name, emergency_contact_phone) VALUES
('Sarah', 'Williams', '1988-09-12', 'F', '+1234567894', 'sarah.williams@email.com', '789 Pine St, City, State', 'Mike Williams', '+1234567895'),
('Robert', 'Davis', '1975-11-30', 'M', '+1234567896', 'robert.davis@email.com', '321 Elm Ave, City, State', 'Lisa Davis', '+1234567897'),
('Emily', 'Brown', '1992-04-18', 'F', '+1234567898', 'emily.brown@email.com', '654 Maple Dr, City, State', 'Tom Brown', '+1234567899');

-- Insert sensitive medical records (these will be encrypted)
INSERT INTO medical_records (patient_id, doctor_id, record_type, title, description, diagnosis_code, is_sensitive, record_date) VALUES
(1, 1, 'mental_health', 'Depression Treatment', 'Patient showing signs of major depressive disorder. Started on antidepressant medication. Regular therapy sessions recommended.', 'F32.9', 1, '2024-01-22'),
(2, 1, 'genetic', 'Genetic Testing Results', 'BRCA1 gene mutation detected. Increased risk for breast and ovarian cancer. Genetic counseling provided.', 'Z15.01', 1, '2024-01-28'),
(3, 2, 'mental_health', 'Anxiety Disorder', 'Generalized anxiety disorder with panic attacks. Prescribed anti-anxiety medication and cognitive behavioral therapy.', 'F41.1', 1, '2024-02-01'),
(4, 2, 'diagnosis', 'Hypertension Follow-up', 'Blood pressure well controlled on current medication. Continue current treatment plan.', 'I10', 0, '2024-02-03'),
(5, 1, 'treatment', 'Physical Therapy', 'Post-surgical rehabilitation for knee replacement. Good progress noted.', 'Z51.89', 0, '2024-02-05');

-- Insert more prescriptions
INSERT INTO prescriptions (patient_id, doctor_id, medication_name, dosage, frequency, duration, instructions, prescribed_date, status) VALUES
(3, 1, 'Sertraline', '50mg', 'Once daily', '90 days', 'Take in the morning with food', '2024-01-22', 'pending'),
(4, 2, 'Lorazepam', '0.5mg', 'As needed', '30 days', 'For anxiety attacks only', '2024-02-01', 'pending'),
(5, 1, 'Amlodipine', '5mg', 'Once daily', '30 days', 'Take at the same time each day', '2024-02-03', 'dispensed'),
(1, 1, 'Ibuprofen', '400mg', 'Three times daily', '14 days', 'Take with food to prevent stomach upset', '2024-02-05', 'pending');

-- Insert more appointments
INSERT INTO appointments (patient_id, doctor_id, appointment_date, duration, status, notes) VALUES
(3, 1, '2024-02-20 09:00:00', 45, 'scheduled', 'Follow-up for depression treatment'),
(4, 2, '2024-02-22 14:30:00', 30, 'scheduled', 'Anxiety management check-up'),
(5, 1, '2024-02-25 11:00:00', 30, 'scheduled', 'Routine blood pressure check'),
(1, 1, '2024-02-28 10:15:00', 60, 'scheduled', 'Comprehensive health assessment');

-- Insert access logs to show system activity
INSERT INTO access_logs (user_id, action, table_name, record_id, ip_address, timestamp) VALUES
(1, 'LOGIN', 'users', NULL, '192.168.1.100', '2024-02-01 08:30:00'),
(1, 'SELECT', 'medical_records', NULL, '192.168.1.100', '2024-02-01 08:35:00'),
(1, 'INSERT', 'medical_records', 6, '192.168.1.100', '2024-02-01 09:15:00'),
(2, 'LOGIN', 'users', NULL, '192.168.1.101', '2024-02-01 10:00:00'),
(2, 'SELECT', 'prescriptions', NULL, '192.168.1.101', '2024-02-01 10:05:00'),
(3, 'LOGIN', 'users', NULL, '192.168.1.102', '2024-02-01 14:00:00'),
(3, 'SELECT', 'patients', NULL, '192.168.1.102', '2024-02-01 14:10:00'),
(1, 'DECRYPT_DATA', 'medical_records', 1, '192.168.1.100', '2024-02-01 15:30:00'),
(4, 'LOGIN', 'users', NULL, '192.168.1.103', '2024-02-01 16:00:00'),
(4, 'DATABASE_VIEW', 'all_tables', NULL, '192.168.1.103', '2024-02-01 16:15:00');

-- Sample Data for Testing

-- Insert sample users
INSERT INTO users (username, password_hash, user_type, email) VALUES
('dr_smith', '$2b$10$rOzJqQZ9X8qVqVqVqVqVqOzJqQZ9X8qVqVqVqVqVqOzJqQZ9X8qVq', 'doctor', 'dr.smith@hospital.com'),
('pharmacist_jones', '$2b$10$rOzJqQZ9X8qVqVqVqVqVqOzJqQZ9X8qVqVqVqVqVqOzJqQZ9X8qVq', 'pharmacist', 'jones@pharmacy.com'),
('nurse_wilson', '$2b$10$rOzJqQZ9X8qVqVqVqVqVqOzJqQZ9X8qVqVqVqVqVqOzJqQZ9X8qVq', 'nurse', 'wilson@hospital.com'),
('patient_doe', '$2b$10$rOzJqQZ9X8qVqVqVqVqVqOzJqQZ9X8qVqVqVqVqVqOzJqQZ9X8qVq', 'patient', 'john.doe@email.com');

-- Insert sample patients
INSERT INTO patients (user_id, first_name, last_name, date_of_birth, gender, phone, email, address, emergency_contact_name, emergency_contact_phone) VALUES
(4, 'John', 'Doe', '1985-06-15', 'M', '+1234567890', 'john.doe@email.com', '123 Main St, City, State', 'Jane Doe', '+1234567891'),
(NULL, 'Alice', 'Johnson', '1990-03-22', 'F', '+1234567892', 'alice.johnson@email.com', '456 Oak Ave, City, State', 'Bob Johnson', '+1234567893');

-- Insert sample medical records
INSERT INTO medical_records (patient_id, doctor_id, record_type, title, description, diagnosis_code, is_sensitive, record_date) VALUES
(1, 1, 'diagnosis', 'Hypertension', 'Patient diagnosed with high blood pressure', 'I10', 0, '2024-01-15'),
(1, 1, 'mental_health', 'Anxiety Disorder', 'Patient experiencing anxiety symptoms', 'F41.9', 1, '2024-01-20'),
(2, 1, 'diagnosis', 'Type 2 Diabetes', 'Patient diagnosed with diabetes mellitus', 'E11', 0, '2024-01-25');

-- Insert sample prescriptions
INSERT INTO prescriptions (patient_id, doctor_id, medication_name, dosage, frequency, duration, instructions, prescribed_date) VALUES
(1, 1, 'Lisinopril', '10mg', 'Once daily', '30 days', 'Take with food', '2024-01-15'),
(2, 1, 'Metformin', '500mg', 'Twice daily', '30 days', 'Take with meals', '2024-01-25');

-- Insert sample appointments
INSERT INTO appointments (patient_id, doctor_id, appointment_date, duration, status) VALUES
(1, 1, '2024-02-15 10:00:00', 30, 'scheduled'),
(2, 1, '2024-02-16 14:00:00', 45, 'scheduled');

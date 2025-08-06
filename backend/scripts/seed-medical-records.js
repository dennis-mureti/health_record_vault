// backend/scripts/seed-medical-records.js

const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Path to your SQLite database
const dbPath = path.join(__dirname, "..", "data", "health_records.db");
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
    process.exit(1);
  }
  console.log("Connected to the SQLite database.");
});

// Map record types to allowed values
const RECORD_TYPES = {
  consultation: "diagnosis",
  "lab result": "lab_result",
  surgery: "treatment",
};

const medical_records = [
  {
    patient_id: 1,
    doctor_id: 1,
    record_type: "diagnosis",
    title: "Hypertension Diagnosis",
    description: "Patient presents with elevated blood pressure",
    diagnosis_code: "I10",
    is_sensitive: 0,
    record_date: "2025-07-01",
  },
  {
    patient_id: 2,
    doctor_id: 1,
    record_type: "lab_result",
    title: "Cholesterol Test Results",
    description: "Elevated cholesterol levels detected",
    diagnosis_code: "E78.5",
    is_sensitive: 0,
    record_date: "2025-07-03",
  },
  {
    patient_id: 3,
    doctor_id: 2,
    record_type: "diagnosis",
    title: "Type 2 Diabetes",
    description: "Initial diagnosis of Type 2 Diabetes",
    diagnosis_code: "E11.9",
    is_sensitive: 0,
    record_date: "2025-07-04",
  },
  {
    patient_id: 4,
    doctor_id: 2,
    record_type: "treatment",
    title: "Appendectomy",
    description: "Emergency appendectomy performed",
    diagnosis_code: "K35.80",
    is_sensitive: 1,
    record_date: "2025-07-06",
  },
  {
    patient_id: 1,
    doctor_id: 3,
    record_type: "diagnosis",
    title: "Asthma Management",
    description: "Follow-up for asthma management",
    diagnosis_code: "J45.909",
    is_sensitive: 0,
    record_date: "2025-07-08",
  },
  {
    patient_id: 5,
    doctor_id: 1,
    record_type: "lab_result",
    title: "Annual Physical - Normal Results",
    description: "All lab results within normal range",
    diagnosis_code: "Z00.00",
    is_sensitive: 0,
    record_date: "2025-07-10",
  },
  {
    patient_id: 6,
    doctor_id: 2,
    record_type: "diagnosis",
    title: "Migraine Headaches",
    description: "Chronic migraine management",
    diagnosis_code: "G43.909",
    is_sensitive: 0,
    record_date: "2025-07-11",
  },
  {
    patient_id: 7,
    doctor_id: 3,
    record_type: "diagnosis",
    title: "Seasonal Allergies",
    description: "Allergy consultation and treatment",
    diagnosis_code: "J30.9",
    is_sensitive: 0,
    record_date: "2025-07-12",
  },
  {
    patient_id: 8,
    doctor_id: 1,
    record_type: "lab_result",
    title: "Anemia Panel",
    description: "Low hemoglobin levels detected",
    diagnosis_code: "D64.9",
    is_sensitive: 0,
    record_date: "2025-07-13",
  },
  {
    patient_id: 9,
    doctor_id: 2,
    record_type: "diagnosis",
    title: "Chronic Back Pain",
    description: "Lower back pain management",
    diagnosis_code: "M54.50",
    is_sensitive: 0,
    record_date: "2025-07-14",
  },
  {
    patient_id: 10,
    doctor_id: 3,
    record_type: "mental_health",
    title: "Depression Evaluation",
    description: "Initial evaluation for depressive symptoms",
    diagnosis_code: "F32.9",
    is_sensitive: 1,
    record_date: "2025-07-15",
  },
  {
    patient_id: 1,
    doctor_id: 1,
    record_type: "lab_result",
    title: "ECG Results",
    description: "Normal sinus rhythm",
    diagnosis_code: "I47.9",
    is_sensitive: 0,
    record_date: "2025-07-16",
  },
];

// First, verify the table exists
db.get(
  "SELECT name FROM sqlite_master WHERE type='table' AND name='medical_records'",
  [],
  (err, row) => {
    if (err) {
      console.error("Error checking for table:", err.message);
      return db.close();
    }

    if (!row) {
      console.error("Error: medical_records table does not exist");
      return db.close();
    }

    console.log("Found medical_records table, starting to insert records...");

    const stmt = db.prepare(`
      INSERT INTO medical_records 
        (patient_id, doctor_id, record_type, title, description, diagnosis_code, is_sensitive, record_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    medical_records.forEach((record, index) => {
      stmt.run(
        record.patient_id,
        record.doctor_id,
        record.record_type,
        record.title,
        record.description,
        record.diagnosis_code,
        record.is_sensitive,
        record.record_date,
        function (err) {
          if (err) {
            return console.error("Error inserting record:", err.message);
          }
          console.log(`Inserted record ${index + 1} with ID: ${this.lastID}`);
        }
      );
    });

    stmt.finalize((err) => {
      if (err) {
        console.error("Error finalizing statement:", err.message);
      } else {
        console.log(
          "Successfully seeded medical_records table with sample data."
        );
      }
      db.close();
    });
  }
);

const sqlite3 = require("sqlite3").verbose();
const { open } = require("sqlite");
const path = require("path");

let db = null;

async function openDb() {
  if (!db) {
    try {
      db = await open({
        filename: path.join(__dirname, "../data/health_records.db"),
        driver: sqlite3.Database,
      });
      console.log(
        "Opening SQLite DB at:",
        path.join(__dirname, "../data/health_records.db")
      );

      // Enable foreign keys
      await db.exec("PRAGMA foreign_keys = ON");
    } catch (error) {
      console.error("Failed to open database:", error);
      throw error;
    }
  }
  return db;
}

async function initializeDatabase() {
  try {
    const database = await openDb();

    // Create tables with proper error handling
    const createTables = async () => {
      // Users table
      await database
        .exec(
          `
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR(50) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            user_type TEXT CHECK(user_type IN ('doctor', 'pharmacist', 'nurse', 'patient', 'admin')) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            two_fa_secret VARCHAR(32),
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `
        )
        .catch((err) => {
          throw new Error(`Failed to create users table: ${err.message}`);
        });

      // Verify users table was created
      const tables = await database.all(`
        SELECT name FROM sqlite_master WHERE type='table'
      `);

      if (!tables.find((table) => table.name === "users")) {
        throw new Error("Users table was not created successfully");
      }

      // Patients table
      await database
        .exec(
          `
        CREATE TABLE IF NOT EXISTS patients (
            patient_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            first_name VARCHAR(50) NOT NULL,
            last_name VARCHAR(50) NOT NULL,
            date_of_birth DATE NOT NULL,
            gender TEXT CHECK(gender IN ('M', 'F', 'Other')) NOT NULL,
            phone VARCHAR(20),
            email VARCHAR(100),
            address TEXT,
            emergency_contact_name VARCHAR(100),
            emergency_contact_phone VARCHAR(20),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        )
      `
        )
        .catch((err) => {
          throw new Error(`Failed to create patients table: ${err.message}`);
        });

      // Medical Records table
      await database
        .exec(
          `
        CREATE TABLE IF NOT EXISTS medical_records (
            record_id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            doctor_id INTEGER NOT NULL,
            record_type TEXT CHECK(record_type IN ('diagnosis', 'treatment', 'lab_result', 'mental_health', 'genetic')) NOT NULL,
            title VARCHAR(200) NOT NULL,
            description TEXT,
            diagnosis_code VARCHAR(20),
            is_sensitive BOOLEAN DEFAULT 0,
            record_date DATE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
            FOREIGN KEY (doctor_id) REFERENCES users(user_id)
        )
      `
        )
        .catch((err) => {
          throw new Error(
            `Failed to create medical_records table: ${err.message}`
          );
        });

      // Prescriptions table
      await database
        .exec(
          `
        CREATE TABLE IF NOT EXISTS prescriptions (
            prescription_id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            doctor_id INTEGER NOT NULL,
            pharmacist_id INTEGER,
            medication_name VARCHAR(100) NOT NULL,
            dosage VARCHAR(50) NOT NULL,
            frequency VARCHAR(50) NOT NULL,
            duration VARCHAR(50) NOT NULL,
            instructions TEXT,
            status TEXT CHECK(status IN ('pending', 'dispensed', 'cancelled')) DEFAULT 'pending',
            prescribed_date DATE NOT NULL,
            dispensed_date DATE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
            FOREIGN KEY (doctor_id) REFERENCES users(user_id),
            FOREIGN KEY (pharmacist_id) REFERENCES users(user_id)
        )
      `
        )
        .catch((err) => {
          throw new Error(
            `Failed to create prescriptions table: ${err.message}`
          );
        });

      // Appointments table
      await database
        .exec(
          `
        CREATE TABLE IF NOT EXISTS appointments (
            appointment_id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            doctor_id INTEGER NOT NULL,
            appointment_date DATETIME NOT NULL,
            duration INTEGER DEFAULT 30,
            status TEXT CHECK(status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
            FOREIGN KEY (doctor_id) REFERENCES users(user_id)
        )
      `
        )
        .catch((err) => {
          throw new Error(
            `Failed to create appointments table: ${err.message}`
          );
        });

      // Access Logs table
      await database
        .exec(
          `
        CREATE TABLE IF NOT EXISTS access_logs (
            log_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            action VARCHAR(50) NOT NULL,
            table_name VARCHAR(50) NOT NULL,
            record_id INTEGER,
            ip_address VARCHAR(45),
            user_agent TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        )
      `
        )
        .catch((err) => {
          throw new Error(`Failed to create access_logs table: ${err.message}`);
        });

      // Create views
      await database
        .exec(
          `
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
        LEFT JOIN prescriptions pr ON p.patient_id = pr.patient_id
      `
        )
        .catch((err) => {
          throw new Error(`Failed to create doctor_view: ${err.message}`);
        });

      await database
        .exec(
          `
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
        WHERE pr.status = 'pending'
      `
        )
        .catch((err) => {
          throw new Error(`Failed to create pharmacist_view: ${err.message}`);
        });

      await database
        .exec(
          `
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
        LEFT JOIN appointments a ON p.patient_id = a.patient_id
      `
        )
        .catch((err) => {
          throw new Error(`Failed to create nurse_view: ${err.message}`);
        });

      console.log("Database tables and views created successfully");
    };

    await createTables();
    return database;
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
}

module.exports = {
  openDb,
  initializeDatabase,
};

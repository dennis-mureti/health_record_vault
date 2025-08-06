const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { openDb } = require("../config/database");

// Initialize database
const createRecordsTable = async () => {
  const db = await openDb();
  const sql = `
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
  `;
  await db.run(sql);
};

// Initialize the database
createRecordsTable();

// Get all records with optional filtering
router.get("/", authenticateToken, async (req, res) => {
  try {
    console.log("GET /api/records - Query params:", req.query);
    const { type, patient_id } = req.query;
    const db = await openDb();

    // First, let's get basic record data without the joins
    let sql = `
      SELECT mr.*,
             p.first_name as patient_first_name,
             p.last_name as patient_last_name,
             u.username as doctor_username,
             u.user_type as doctor_role
      FROM medical_records mr
      LEFT JOIN patients p ON mr.patient_id = p.patient_id
      LEFT JOIN users u ON mr.doctor_id = u.user_id
    `;

    const params = [];
    const conditions = [];

    if (type && type !== "all") {
      conditions.push("mr.record_type = ?");
      params.push(type);
    }

    if (patient_id) {
      const patient_id_num = parseInt(patient_id, 10);
      if (isNaN(patient_id_num)) {
        return res.status(400).json({ message: "Invalid patient_id" });
      }
      conditions.push("mr.patient_id = ?");
      params.push(patient_id_num);
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY mr.record_date DESC";

    console.log("Executing SQL:", sql);
    console.log("With parameters:", params);

    const records = await db.all(sql, params);
    console.log(`Found ${records.length} records`);

    // Transform the data to match the expected frontend format
    const transformedRecords = records.map((record) => ({
      id: record.record_id,
      patientId: record.patient_id,
      doctorId: record.doctor_id,
      recordType: record.record_type,
      title: record.title,
      description: record.description,
      diagnosisCode: record.diagnosis_code,
      isSensitive: Boolean(record.is_sensitive),
      visitDate: record.record_date,
      createdAt: record.created_at,
      patientName:
        record.patient_first_name && record.patient_last_name
          ? `${record.patient_first_name} ${record.patient_last_name}`
          : "Unknown Patient",
      doctorName: record.doctor_username || "Unknown Doctor",
      doctorRole: record.doctor_role || "Unknown Role",
    }));

    res.json(transformedRecords);
  } catch (error) {
    console.error("Error in GET /api/records:", error);
    res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get all records for a patient (doctor/nurse only)
router.get("/patient/:patient_id", authenticateToken, async (req, res) => {
  try {
    const db = await openDb();
    const records = await db.all(
      "SELECT * FROM medical_records WHERE patient_id = ? ORDER BY record_date DESC",
      [req.params.patient_id]
    );
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single record
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const db = await openDb();
    const record = await db.get(
      "SELECT * FROM medical_records WHERE record_id = ?",
      [req.params.id]
    );
    if (!record) return res.status(404).json({ message: "Record not found" });
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new medical record (doctor only)
router.post("/", authenticateToken, async (req, res) => {
  try {
    const db = await openDb();
    const {
      patient_id,
      record_type,
      title,
      description,
      diagnosis_code,
      is_sensitive,
      record_date,
    } = req.body;

    const result = await db.run(
      "INSERT INTO medical_records (patient_id, doctor_id, record_type, title, description, diagnosis_code, is_sensitive, record_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        patient_id,
        req.user.id,
        record_type,
        title,
        description,
        diagnosis_code,
        is_sensitive,
        record_date,
      ]
    );

    res.status(201).json({ record_id: result.lastID });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update medical record (doctor only)
router.patch("/:id", authenticateToken, async (req, res) => {
  try {
    const db = await openDb();
    const record = await db.get(
      "SELECT * FROM medical_records WHERE record_id = ?",
      [req.params.id]
    );
    if (!record) return res.status(404).json({ message: "Record not found" });

    const columns = Object.keys(req.body)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = [...Object.values(req.body), req.params.id];

    await db.run(
      `UPDATE medical_records SET ${columns}, created_at = CURRENT_TIMESTAMP WHERE record_id = ?`,
      values
    );

    res.json({ ...record, ...req.body });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete medical record (doctor only)
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const db = await openDb();
    const record = await db.get(
      "SELECT * FROM medical_records WHERE record_id = ?",
      [req.params.id]
    );
    if (!record) return res.status(404).json({ message: "Record not found" });

    await db.run("DELETE FROM medical_records WHERE record_id = ?", [
      req.params.id,
    ]);

    res.json({ message: "Record deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

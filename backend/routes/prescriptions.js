const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { openDb } = require("../config/database");

// Initialize database
// const db = new sqlite3.Database("./database.sqlite");

// Create prescriptions table if it doesn't exist
const createPrescriptionsTable = async () => {
  const db = await openDb();
  const sql = `
    CREATE TABLE IF NOT EXISTS prescriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patientId INTEGER NOT NULL,
      doctorId INTEGER NOT NULL,
      medication TEXT NOT NULL,
      dosage TEXT NOT NULL,
      frequency TEXT NOT NULL,
      duration TEXT NOT NULL,
      startDate DATE NOT NULL,
      endDate DATE,
      instructions TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patientId) REFERENCES patients(id),
      FOREIGN KEY (doctorId) REFERENCES users(id)
    )
  `;
  await db.run(sql);
};

// Initialize the database
createPrescriptionsTable();

// Get all prescriptions for a patient (doctor/nurse only)
router.get("/patient/:patientId", authenticateToken, async (req, res) => {
  try {
    const db = await openDb();
    const user = req.user;
    if (!["doctor", "nurse"].includes(user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const prescriptions = await db.all(
      "SELECT * FROM prescriptions WHERE patientId = ? ORDER BY startDate DESC",
      [req.params.patientId]
    );
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single prescription
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const db = await openDb();
    const user = req.user;
    if (!["doctor", "nurse"].includes(user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const prescription = await db.get(
      "SELECT * FROM prescriptions WHERE id = ?",
      [req.params.id]
    );

    if (!prescription)
      return res.status(404).json({ message: "Prescription not found" });
    res.json(prescription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new prescription (doctor only)
router.post("/", authenticateToken, async (req, res) => {
  try {
    const db = await openDb();
    const user = req.user;
    if (user.role !== "doctor") {
      return res.status(403).json({ message: "Access denied" });
    }

    const {
      patientId,
      medication,
      dosage,
      frequency,
      duration,
      startDate,
      endDate,
      instructions,
    } = req.body;

    const result = await db.run(
      "INSERT INTO prescriptions (patientId, doctorId, medication, dosage, frequency, duration, startDate, endDate, instructions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        patientId,
        user.id,
        medication,
        dosage,
        frequency,
        duration,
        startDate,
        endDate,
        instructions,
      ]
    );

    res.status(201).json({ id: result.lastID });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update prescription (doctor only)
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const db = await openDb();
    const user = req.user;
    if (user.role !== "doctor") {
      return res.status(403).json({ message: "Access denied" });
    }

    const {
      medication,
      dosage,
      frequency,
      duration,
      startDate,
      endDate,
      instructions,
    } = req.body;

    const result = await db.run(
      "UPDATE prescriptions SET medication = ?, dosage = ?, frequency = ?, duration = ?, startDate = ?, endDate = ?, instructions = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
      [
        medication,
        dosage,
        frequency,
        duration,
        startDate,
        endDate,
        instructions,
        req.params.id,
      ]
    );

    if (result.changes === 0) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    res.json({ message: "Prescription updated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete prescription (doctor only)
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const db = await openDb();
    const user = req.user;
    if (user.role !== "doctor") {
      return res.status(403).json({ message: "Access denied" });
    }

    const result = await db.run("DELETE FROM prescriptions WHERE id = ?", [
      req.params.id,
    ]);

    if (result.changes === 0) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    res.json({ message: "Prescription deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

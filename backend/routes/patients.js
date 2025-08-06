const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { openDb } = require("../config/database");

// Initialize database
const createPatientsTable = async () => {
  const db = await openDb();
  const sql = `
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      dateOfBirth DATE NOT NULL,
      gender TEXT CHECK(gender IN ('male', 'female', 'other')) NOT NULL,
      phoneNumber TEXT,
      email TEXT,
      address TEXT,
      medicalHistory TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await db.run(sql);
};

// Initialize the database
createPatientsTable();

// Get all patients (doctor/nurse only)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const db = await openDb();
    const user = req.user;
    if (!["doctor", "nurse"].includes(user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const patients = await db.all(
      "SELECT * FROM patients ORDER BY lastName, firstName"
    );
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single patient
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const db = await openDb();
    const user = req.user;
    if (!["doctor", "nurse"].includes(user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const patient = await db.get("SELECT * FROM patients WHERE id = ?", [
      req.params.id,
    ]);

    if (!patient) return res.status(404).json({ message: "Patient not found" });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new patient (doctor/nurse only)
router.post("/", authenticateToken, async (req, res) => {
  try {
    const db = await openDb();
    const user = req.user;
    if (!["doctor", "nurse"].includes(user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phoneNumber,
      email,
      address,
      medicalHistory,
    } = req.body;

    const result = await db.run(
      "INSERT INTO patients (firstName, lastName, dateOfBirth, gender, phoneNumber, email, address, medicalHistory) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        firstName,
        lastName,
        dateOfBirth,
        gender,
        phoneNumber,
        email,
        address,
        medicalHistory,
      ]
    );

    res.status(201).json({ id: result.lastID });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update patient (doctor/nurse only)
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const db = await openDb();
    const user = req.user;
    if (!["doctor", "nurse"].includes(user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phoneNumber,
      email,
      address,
      medicalHistory,
    } = req.body;

    const result = await db.run(
      "UPDATE patients SET firstName = ?, lastName = ?, dateOfBirth = ?, gender = ?, phoneNumber = ?, email = ?, address = ?, medicalHistory = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
      [
        firstName,
        lastName,
        dateOfBirth,
        gender,
        phoneNumber,
        email,
        address,
        medicalHistory,
        req.params.id,
      ]
    );

    if (result.changes === 0) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.json({ message: "Patient updated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete patient (doctor/nurse only)
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const db = await openDb();
    const user = req.user;
    if (!["doctor", "nurse"].includes(user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const result = await db.run("DELETE FROM patients WHERE id = ?", [
      req.params.id,
    ]);

    if (result.changes === 0) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.json({ message: "Patient deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

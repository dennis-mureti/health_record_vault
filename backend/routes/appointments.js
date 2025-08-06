const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { openDb } = require("../config/database");

// Initialize database
const createAppointmentsTable = async () => {
  const db = await openDb();
  const sql = `
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patientId INTEGER NOT NULL,
      doctorId INTEGER NOT NULL,
      appointmentDate DATE NOT NULL,
      appointmentTime TIME NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      type TEXT NOT NULL,
      notes TEXT,
      reason TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patientId) REFERENCES patients(id),
      FOREIGN KEY (doctorId) REFERENCES users(id)
    )
  `;
  await db.run(sql);
};

// Initialize the database
createAppointmentsTable();

// Get all appointments for a patient (doctor/nurse/receptionist only)
router.get("/patient/:patientId", authenticateToken, async (req, res) => {
  try {
    const db = await openDb();
    const user = req.user;
    if (!["doctor", "nurse", "receptionist"].includes(user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const appointments = await db.all(
      "SELECT * FROM appointments WHERE patientId = ? ORDER BY appointmentDate DESC",
      [req.params.patientId]
    );
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all appointments for a doctor (doctor only)
router.get("/doctor/:doctorId", authenticateToken, async (req, res) => {
  try {
    const db = await openDb();
    const user = req.user;
    if (user.role !== "doctor" || user.id !== parseInt(req.params.doctorId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const appointments = await db.all(
      "SELECT * FROM appointments WHERE doctorId = ? ORDER BY appointmentDate DESC",
      [req.params.doctorId]
    );
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single appointment
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const db = await openDb();
    const user = req.user;
    if (!["doctor", "nurse", "receptionist"].includes(user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const appointment = await db.get(
      "SELECT * FROM appointments WHERE id = ?",
      [req.params.id]
    );

    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new appointment (receptionist only)
router.post("/", authenticateToken, async (req, res) => {
  try {
    const db = await openDb();
    const user = req.user;
    if (user.role !== "receptionist") {
      return res.status(403).json({ message: "Access denied" });
    }

    const {
      patientId,
      doctorId,
      appointmentDate,
      appointmentTime,
      type,
      notes,
      reason,
    } = req.body;

    const result = await db.run(
      "INSERT INTO appointments (patientId, doctorId, appointmentDate, appointmentTime, type, notes, reason) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        patientId,
        doctorId,
        appointmentDate,
        appointmentTime,
        type,
        notes,
        reason,
      ]
    );

    res.status(201).json({ id: result.lastID });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update appointment (doctor/receptionist only)
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const db = await openDb();
    const user = req.user;
    if (user.role !== "doctor" && user.role !== "receptionist") {
      return res.status(403).json({ message: "Access denied" });
    }

    const appointment = await db.get(
      "SELECT * FROM appointments WHERE id = ?",
      [req.params.id]
    );

    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    if (user.role === "doctor" && user.id !== appointment.doctorId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { appointmentDate, appointmentTime, status, type, notes, reason } =
      req.body;

    const result = await db.run(
      "UPDATE appointments SET appointmentDate = ?, appointmentTime = ?, status = ?, type = ?, notes = ?, reason = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
      [
        appointmentDate,
        appointmentTime,
        status,
        type,
        notes,
        reason,
        req.params.id,
      ]
    );

    if (result.changes === 0) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json({ message: "Appointment updated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete appointment (doctor/receptionist only)
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const db = await openDb();
    const user = req.user;
    if (user.role !== "doctor" && user.role !== "receptionist") {
      return res.status(403).json({ message: "Access denied" });
    }

    const appointment = await db.get(
      "SELECT * FROM appointments WHERE id = ?",
      [req.params.id]
    );

    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    if (user.role === "doctor" && user.id !== appointment.doctorId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const result = await db.run("DELETE FROM appointments WHERE id = ?", [
      req.params.id,
    ]);

    if (result.changes === 0) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json({ message: "Appointment deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

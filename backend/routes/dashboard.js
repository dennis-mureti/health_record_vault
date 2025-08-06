const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");

// Example dashboard summary route
router.get("/", authenticateToken, async (req, res) => {
  try {
    // Replace with your actual DB logic
    const dbModule = require("../config/database");
    const db = await dbModule.openDb();
    const [patients, records, prescriptions, appointments] = await Promise.all([
      db.get("SELECT COUNT(*) as count FROM patients"),
      db.get("SELECT COUNT(*) as count FROM medical_records"),
      db.get("SELECT COUNT(*) as count FROM prescriptions"),
      db.get("SELECT COUNT(*) as count FROM appointments"),
    ]);

    res.json({
      stats: {
        patients: patients.count,
        records: records.count,
        prescriptions: prescriptions.count,
        appointments: appointments.count,
      },
      userType: req.user.userType, // from JWT
      recentActivity: [], // Add if you want to show recent actions
    });
  } catch (err) {
    console.error("[DASHBOARD API ERROR]", err);
    res
      .status(500)
      .json({ message: "Failed to load dashboard data", error: err.message });
  }
});

module.exports = router;

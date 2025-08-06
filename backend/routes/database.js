const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { openDb } = require("../config/database");
const fs = require("fs");
const path = require("path");

// Get database statistics (admin only)
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    const db = await openDb();
    const user = req.user;
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    // Get table counts
    const stats = await db.all(
      `SELECT name, 
              (SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = t.name) as count 
       FROM sqlite_master t 
       WHERE t.type = 'table'`
    );

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create database backup (admin only)
router.post("/backup", authenticateToken, async (req, res) => {
  try {
    const db = await openDb();
    const user = req.user;
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const backupPath = path.join(__dirname, "../backup");
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFile = path.join(backupPath, `backup-${timestamp}.sqlite`);

    // Copy database file
    const sourcePath = path.join(__dirname, "../database.sqlite");
    fs.copyFileSync(sourcePath, backupFile);

    res.json({ message: "Database backup created successfully", backupFile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// List available backups (admin only)
router.get("/tables", authenticateToken, async (req, res) => {
  try {
    const db = await openDb();
    const user = req.user;

    // Allow both user.role and user.userType for admin check
    const isAdmin = user.role === "admin" || user.userType === "admin";
    if (!isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Get all table names
    const tables = await db.all(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';`
    );

    const tablesData = {};
    for (const { name } of tables) {
      // Get schema
      const schema = await db.all(`PRAGMA table_info(${name});`);
      // Get data
      const data = await db.all(`SELECT * FROM ${name};`);
      // Row count
      const count = data.length;
      // Heuristic for encrypted/hashed columns (customize for your schema)
      const hasEncryptedData = schema.some((col) =>
        col.name.toLowerCase().includes("encrypted")
      );
      const hasHashedData = schema.some((col) =>
        col.name.toLowerCase().includes("hash")
      );

      tablesData[name] = {
        schema,
        data,
        count,
        hasEncryptedData,
        hasHashedData,
      };
    }

    res.json({
      tables: tablesData,
      userType: user.userType || user.role,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete backup (admin only)
router.delete("/backup/:filename", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const backupPath = path.join(__dirname, "../backup", req.params.filename);
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ message: "Backup not found" });
    }

    fs.unlinkSync(backupPath);
    res.json({ message: "Backup deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

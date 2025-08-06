const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const sqlite3 = require("sqlite3").verbose();

// Initialize database
const db = new sqlite3.Database("./database.sqlite");

// Create audit logs table if it doesn't exist
const createAuditLogsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      action TEXT NOT NULL,
      entityType TEXT NOT NULL,
      entityId TEXT,
      oldData TEXT,
      newData TEXT,
      ipAddress TEXT,
      userAgent TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `;
  db.run(sql);
};

// Initialize the database
createAuditLogsTable();

// Log audit event (internal use)
const logAuditEvent = (
  userId,
  action,
  entityType,
  entityId,
  oldData,
  newData,
  ipAddress,
  userAgent
) => {
  db.run(
    "INSERT INTO audit_logs (userId, action, entityType, entityId, oldData, newData, ipAddress, userAgent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [
      userId,
      action,
      entityType,
      entityId,
      oldData,
      newData,
      ipAddress,
      userAgent,
    ]
  );
};

// Get audit logs (admin only)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const {
      userId,
      entityType,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;
    const offset = (page - 1) * limit;

    const whereClauses = [];
    const params = [];

    if (userId) {
      whereClauses.push("userId = ?");
      params.push(userId);
    }

    if (entityType) {
      whereClauses.push("entityType = ?");
      params.push(entityType);
    }

    if (startDate) {
      whereClauses.push("timestamp >= ?");
      params.push(startDate);
    }

    if (endDate) {
      whereClauses.push("timestamp <= ?");
      params.push(endDate);
    }

    const whereClause =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const logs = await new Promise((resolve, reject) => {
      db.all(
        `
        SELECT 
          al.*, 
          u.firstName, 
          u.lastName, 
          u.role 
        FROM audit_logs al
        LEFT JOIN users u ON al.userId = u.id
        ${whereClause}
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?
        `,
        [...params, limit, offset],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });

    // Get total count for pagination
    const total = await new Promise((resolve, reject) => {
      db.get(
        `SELECT COUNT(*) as count FROM audit_logs ${whereClause}`,
        params,
        (err, row) => {
          if (err) reject(err);
          resolve(row?.count || 0);
        }
      );
    });

    res.json({
      logs,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get audit log by ID (admin only)
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const log = await new Promise((resolve, reject) => {
      db.get(
        `
        SELECT 
          al.*, 
          u.firstName, 
          u.lastName, 
          u.role 
        FROM audit_logs al
        LEFT JOIN users u ON al.userId = u.id
        WHERE al.id = ?
        `,
        [req.params.id],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });

    if (!log) return res.status(404).json({ message: "Audit log not found" });
    res.json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Export audit logs (admin only)
router.get("/export", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { startDate, endDate } = req.query;
    const whereClauses = [];
    const params = [];

    if (startDate) {
      whereClauses.push("timestamp >= ?");
      params.push(startDate);
    }

    if (endDate) {
      whereClauses.push("timestamp <= ?");
      params.push(endDate);
    }

    const whereClause =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const logs = await new Promise((resolve, reject) => {
      db.all(
        `
        SELECT 
          al.*, 
          u.firstName, 
          u.lastName, 
          u.role 
        FROM audit_logs al
        LEFT JOIN users u ON al.userId = u.id
        ${whereClause}
        ORDER BY timestamp DESC
        `,
        params,
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });

    // Format data for CSV
    const csvData = logs.map((log) => {
      return {
        timestamp: log.timestamp,
        user: `${log.firstName} ${log.lastName} (${log.role})`,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
      };
    });

    // Convert to CSV
    const csv = require("csv-stringify");
    const csvString = await new Promise((resolve, reject) => {
      csv(
        csvData,
        {
          header: true,
          columns: Object.keys(csvData[0]),
        },
        (err, output) => {
          if (err) reject(err);
          resolve(output);
        }
      );
    });

    // Set headers and send file
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=audit-logs.csv");
    res.send(csvString);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// module.exports = {
//   router,
//   logAuditEvent,
// };
module.exports = router;

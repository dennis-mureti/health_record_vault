const jwt = require("jsonwebtoken")
const { openDb } = require("../config/database")

// JWT Authentication Middleware
async function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ error: "Access token required" })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")

    // Verify user still exists and is active
    const db = await openDb()
    const user = await db.get("SELECT user_id, username, user_type, is_active FROM users WHERE user_id = ?", [
      decoded.userId,
    ])

    if (!user || !user.is_active) {
      return res.status(401).json({ error: "Invalid or inactive user" })
    }

    req.user = {
      userId: user.user_id,
      username: user.username,
      userType: user.user_type,
    }

    next()
  } catch (error) {
    console.error("Token verification error:", error)
    return res.status(403).json({ error: "Invalid or expired token" })
  }
}

// Role-based Authorization Middleware
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" })
    }

    if (!allowedRoles.includes(req.user.userType)) {
      return res.status(403).json({
        error: "Insufficient privileges",
        required: allowedRoles,
        current: req.user.userType,
      })
    }

    next()
  }
}

// Audit logging middleware
async function logAccess(action, tableName, recordId = null) {
  return async (req, res, next) => {
    try {
      const db = await openDb()
      await db.run(
        "INSERT INTO access_logs (user_id, action, table_name, record_id, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)",
        [req.user?.userId, action, tableName, recordId, req.ip || req.connection.remoteAddress, req.get("User-Agent")],
      )
    } catch (error) {
      console.error("Audit logging error:", error)
    }
    next()
  }
}

module.exports = {
  authenticateToken,
  authorizeRoles,
  logAccess,
}

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const fs = require("fs");
const https = require("https");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const patientRoutes = require("./routes/patients");
const recordRoutes = require("./routes/records");
const prescriptionRoutes = require("./routes/prescriptions");
const appointmentRoutes = require("./routes/appointments");
const databaseRoutes = require("./routes/database");
const auditRoutes = require("./routes/audit");
const { authenticateToken } = require("./middleware/auth");
const { initializeDatabase } = require("./config/database");
const dashboardRouter = require("./routes/dashboard");
const settingsRouter = require("./routes/settings");
const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Initialize database before setting up routes
console.log("Starting database initialization...");
initializeDatabase()
  .then((db) => {
    console.log("Database tables and views created successfully");
    console.log("Database path:", db.filename);

    // Test database connection and verify tables
    return db
      .all("SELECT name FROM sqlite_master WHERE type='table'")
      .then((rows) => {
        console.log(
          "Database tables:",
          rows.map((row) => row.name)
        );
        const requiredTables = ["users", "patients", "medical_records"];
        const missingTables = requiredTables.filter(
          (table) => !rows.some((row) => row.name === table)
        );

        if (missingTables.length > 0) {
          throw new Error(
            `Missing required tables: ${missingTables.join(", ")}`
          );
        }
        return db;
      });
  })
  .then((db) => {
    // Routes
    app.use("/api/auth", authRoutes);
    app.use("/api/users", authenticateToken, userRoutes);
    app.use("/api/patients", authenticateToken, patientRoutes);
    app.use("/api/records", authenticateToken, recordRoutes);
    app.use("/api/prescriptions", authenticateToken, prescriptionRoutes);
    app.use("/api/appointments", authenticateToken, appointmentRoutes);
    app.use("/api/database", authenticateToken, databaseRoutes);
    app.use("/api/audit", authenticateToken, auditRoutes);
    app.use("/api/dashboard", authenticateToken, dashboardRouter);
    app.use("/api/settings", authenticateToken, settingsRouter);

    // Start HTTPS server
    const sslOptions = {
      key: fs.readFileSync(path.join(__dirname, "ssl", "private.key")),
      cert: fs.readFileSync(path.join(__dirname, "ssl", "certificate.crt")),
      // If you have a CA bundle, uncomment the next line:
      // ca: fs.readFileSync(path.join(__dirname, "ssl", "ca_bundle.crt")),
    };
    const PORT = process.env.PORT || 3002;
    https.createServer(sslOptions, app).listen(PORT, () => {
      console.log(`HTTPS server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database initialization failed:", error);
    process.exit(1);
  });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

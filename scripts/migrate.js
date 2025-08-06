// backend/scripts/migrate.js

const { initializeDatabase } = require("../config/database");

(async () => {
  try {
    await initializeDatabase();
    console.log("Database migration completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Database migration failed:", error);
    process.exit(1);
  }
})();

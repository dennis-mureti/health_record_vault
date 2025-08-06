const { openDb } = require("../config/database");

async function checkUsersSchema() {
  try {
    const db = await openDb();

    // Get table info
    console.log("Checking users table schema...");
    const tableInfo = await db.all("PRAGMA table_info(users)");
    console.log("\nUsers table columns:");
    console.table(tableInfo);

    // Get sample data
    const sampleData = await db.all("SELECT * FROM users LIMIT 1");
    console.log("\nSample user data:", sampleData);

    await db.close();
  } catch (error) {
    console.error("Error checking users schema:", error);
  }
}

checkUsersSchema();

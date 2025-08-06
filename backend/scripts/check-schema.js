const { openDb } = require("../db");

async function checkSchema() {
  try {
    const db = await openDb();

    // Get table info
    console.log("Checking medical_records table schema...");
    const tableInfo = await db.all("PRAGMA table_info(medical_records)");
    console.log("\nTable columns:");
    console.table(tableInfo);

    // Get foreign key info
    const fkInfo = await db.all("PRAGMA foreign_key_list(medical_records)");
    console.log("\nForeign keys:");
    console.table(fkInfo);

    // Get index info
    const indexInfo = await db.all("PRAGMA index_list(medical_records)");
    console.log("\nIndexes:");
    console.table(indexInfo);

    // Close the database connection
    await db.close();
  } catch (error) {
    console.error("Error checking schema:", error);
  }
}

checkSchema();

import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { openDb } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any

    // Only admins and doctors can view database tables
    if (!["admin", "doctor"].includes(decoded.userType)) {
      return NextResponse.json({ error: "Insufficient privileges" }, { status: 403 })
    }

    const db = await openDb()

    // Get all table names
    const tables = await db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `)

    const databaseData: any = {}

    // Fetch data from each table
    for (const table of tables) {
      const tableName = table.name

      // Get table schema
      const schema = await db.all(`PRAGMA table_info(${tableName})`)

      // Get table data
      const data = await db.all(`SELECT * FROM ${tableName} ORDER BY rowid DESC LIMIT 100`)

      // Get row count
      const countResult = await db.get(`SELECT COUNT(*) as count FROM ${tableName}`)

      databaseData[tableName] = {
        schema,
        data,
        count: countResult.count,
        hasEncryptedData: tableName === "medical_records",
        hasHashedData: tableName === "users",
      }
    }

    // Log database access
    await db.run("INSERT INTO access_logs (user_id, action, table_name, ip_address) VALUES (?, ?, ?, ?)", [
      decoded.userId,
      "DATABASE_VIEW",
      "all_tables",
      request.ip || "unknown",
    ])

    return NextResponse.json({
      tables: databaseData,
      userType: decoded.userType,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Database tables error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

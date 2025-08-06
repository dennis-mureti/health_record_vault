import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { openDb, encryptSensitiveData } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any

    const db = await openDb()

    let records = []

    // Apply access control based on user type
    if (decoded.userType === "doctor") {
      // Doctors can access all records
      records = await db.all(`
        SELECT mr.*, p.first_name, p.last_name 
        FROM medical_records mr 
        JOIN patients p ON mr.patient_id = p.patient_id
        ORDER BY mr.record_date DESC
      `)
    } else if (decoded.userType === "nurse") {
      // Nurses can only access non-sensitive records
      records = await db.all(`
        SELECT mr.*, p.first_name, p.last_name 
        FROM medical_records mr 
        JOIN patients p ON mr.patient_id = p.patient_id
        WHERE mr.is_sensitive = 0
        ORDER BY mr.record_date DESC
      `)
    } else if (decoded.userType === "patient") {
      // Patients can only access their own records
      const patient = await db.get("SELECT patient_id FROM patients WHERE user_id = ?", [decoded.userId])
      if (patient) {
        records = await db.all(
          `
          SELECT mr.*, p.first_name, p.last_name 
          FROM medical_records mr 
          JOIN patients p ON mr.patient_id = p.patient_id
          WHERE mr.patient_id = ?
          ORDER BY mr.record_date DESC
        `,
          [patient.patient_id],
        )
      }
    }

    // Log access
    await db.run("INSERT INTO access_logs (user_id, action, table_name) VALUES (?, ?, ?)", [
      decoded.userId,
      "SELECT",
      "medical_records",
    ])

    return NextResponse.json({ records })
  } catch (error) {
    console.error("Records error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any

    // Only doctors can create medical records
    if (decoded.userType !== "doctor") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { patientId, recordType, title, description, diagnosisCode, isSensitive } = await request.json()

    const db = await openDb()

    // Encrypt sensitive data
    const encryptedDescription = isSensitive ? encryptSensitiveData(description) : description

    const result = await db.run(
      `
      INSERT INTO medical_records (patient_id, doctor_id, record_type, title, description, diagnosis_code, is_sensitive, record_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, DATE('now'))
    `,
      [patientId, decoded.userId, recordType, title, encryptedDescription, diagnosisCode, isSensitive ? 1 : 0],
    )

    // Log access
    await db.run("INSERT INTO access_logs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)", [
      decoded.userId,
      "INSERT",
      "medical_records",
      result.lastID,
    ])

    return NextResponse.json({ success: true, recordId: result.lastID })
  } catch (error) {
    console.error("Create record error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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

    const db = await openDb()

    // Get dashboard statistics based on user type
    let stats = { patients: 0, records: 0, prescriptions: 0, appointments: 0 }

    if (decoded.userType === "doctor" || decoded.userType === "admin") {
      // Full access to all statistics
      const patientsCount = await db.get("SELECT COUNT(*) as count FROM patients")
      const recordsCount = await db.get("SELECT COUNT(*) as count FROM medical_records")
      const prescriptionsCount = await db.get("SELECT COUNT(*) as count FROM prescriptions")
      const appointmentsCount = await db.get("SELECT COUNT(*) as count FROM appointments")

      stats = {
        patients: patientsCount.count,
        records: recordsCount.count,
        prescriptions: prescriptionsCount.count,
        appointments: appointmentsCount.count,
      }
    } else if (decoded.userType === "pharmacist") {
      // Only prescription-related statistics
      const prescriptionsCount = await db.get('SELECT COUNT(*) as count FROM prescriptions WHERE status = "pending"')
      stats.prescriptions = prescriptionsCount.count
    } else if (decoded.userType === "nurse") {
      // Non-sensitive records and appointments
      const recordsCount = await db.get("SELECT COUNT(*) as count FROM medical_records WHERE is_sensitive = 0")
      const appointmentsCount = await db.get("SELECT COUNT(*) as count FROM appointments")
      stats.records = recordsCount.count
      stats.appointments = appointmentsCount.count
    }

    // Get recent activity
    const recentActivity = await db.all(
      "SELECT * FROM access_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT 10",
      [decoded.userId],
    )

    return NextResponse.json({
      userType: decoded.userType,
      stats,
      recentActivity,
    })
  } catch (error) {
    console.error("Dashboard error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

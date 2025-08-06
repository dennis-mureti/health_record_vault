import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { openDb, decryptSensitiveData } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any

    const { searchParams } = new URL(request.url)
    const dataType = searchParams.get("type")
    const patientId = searchParams.get("patientId")

    const db = await openDb()
    let data: any = {}

    switch (decoded.userType) {
      case "doctor":
        // Doctors have full access - use doctor_view
        data = await getDataForDoctor(db, dataType, patientId)
        break

      case "pharmacist":
        // Pharmacists only see prescriptions - use pharmacist_view
        data = await getDataForPharmacist(db, dataType, patientId)
        break

      case "nurse":
        // Nurses see non-sensitive data - use nurse_view
        data = await getDataForNurse(db, dataType, patientId)
        break

      case "patient":
        // Patients only see their own data
        data = await getDataForPatient(db, decoded.userId, dataType)
        break

      default:
        return NextResponse.json({ error: "Invalid user type" }, { status: 403 })
    }

    // Decrypt sensitive data if user has access
    if (data.medical_records && ["doctor"].includes(decoded.userType)) {
      data.medical_records = data.medical_records.map((record: any) => {
        if (record.is_sensitive) {
          record.description = decryptSensitiveData(record.description)
        }
        return record
      })
    }

    // Log the access
    await db.run("INSERT INTO access_logs (user_id, action, table_name, ip_address) VALUES (?, ?, ?, ?)", [
      decoded.userId,
      "SELECT",
      dataType || "multiple",
      request.ip || "unknown",
    ])

    return NextResponse.json({ data, userType: decoded.userType })
  } catch (error) {
    console.error("Retrieve error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function getDataForDoctor(db: any, dataType: string | null, patientId: string | null) {
  const whereClause = patientId ? `WHERE patient_id = ${patientId}` : ""

  if (dataType === "patients") {
    return { patients: await db.all(`SELECT * FROM patients ${whereClause}`) }
  } else if (dataType === "medical_records") {
    return { medical_records: await db.all(`SELECT * FROM medical_records ${whereClause} ORDER BY record_date DESC`) }
  } else if (dataType === "prescriptions") {
    return { prescriptions: await db.all(`SELECT * FROM prescriptions ${whereClause} ORDER BY prescribed_date DESC`) }
  } else {
    // Return all data using doctor_view
    return {
      patients: await db.all(
        `SELECT DISTINCT patient_id, first_name, last_name, date_of_birth, gender, phone, email FROM doctor_view ${whereClause}`,
      ),
      medical_records: await db.all(`SELECT * FROM medical_records ${whereClause} ORDER BY record_date DESC`),
      prescriptions: await db.all(`SELECT * FROM prescriptions ${whereClause} ORDER BY prescribed_date DESC`),
      appointments: await db.all(`SELECT * FROM appointments ${whereClause} ORDER BY appointment_date DESC`),
    }
  }
}

async function getDataForPharmacist(db: any, dataType: string | null, patientId: string | null) {
  const whereClause = patientId ? `AND patient_id = ${patientId}` : ""

  // Pharmacists only see pending prescriptions
  return {
    prescriptions: await db.all(`SELECT * FROM pharmacist_view WHERE 1=1 ${whereClause}`),
  }
}

async function getDataForNurse(db: any, dataType: string | null, patientId: string | null) {
  const whereClause = patientId ? `WHERE patient_id = ${patientId}` : ""

  // Nurses see non-sensitive data using nurse_view
  return {
    patients: await db.all(
      `SELECT DISTINCT patient_id, first_name, last_name, date_of_birth, gender, phone, emergency_contact_name, emergency_contact_phone FROM nurse_view ${whereClause}`,
    ),
    medical_records: await db.all(
      `SELECT record_id, record_type, title, record_date FROM nurse_view WHERE record_id IS NOT NULL ${patientId ? `AND patient_id = ${patientId}` : ""}`,
    ),
    appointments: await db.all(
      `SELECT appointment_id, appointment_date, appointment_status FROM nurse_view WHERE appointment_id IS NOT NULL ${patientId ? `AND patient_id = ${patientId}` : ""}`,
    ),
  }
}

async function getDataForPatient(db: any, userId: number, dataType: string | null) {
  // Get patient's own data only
  const patient = await db.get("SELECT patient_id FROM patients WHERE user_id = ?", [userId])

  if (!patient) {
    return { error: "Patient record not found" }
  }

  return {
    personal_info: await db.get("SELECT * FROM patients WHERE patient_id = ?", [patient.patient_id]),
    medical_records: await db.all(
      "SELECT record_id, record_type, title, record_date, description FROM medical_records WHERE patient_id = ? AND is_sensitive = 0",
      [patient.patient_id],
    ),
    prescriptions: await db.all(
      "SELECT prescription_id, medication_name, dosage, frequency, status, prescribed_date FROM prescriptions WHERE patient_id = ?",
      [patient.patient_id],
    ),
    appointments: await db.all(
      "SELECT appointment_id, appointment_date, status FROM appointments WHERE patient_id = ?",
      [patient.patient_id],
    ),
  }
}

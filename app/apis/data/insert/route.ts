import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { openDb, encryptSensitiveData, classifyDataSensitivity } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any

    const { dataType, data } = await request.json()
    const db = await openDb()

    let result: any = {}

    switch (dataType) {
      case "patient":
        // Public information - no encryption needed
        if (decoded.userType !== "doctor" && decoded.userType !== "admin") {
          return NextResponse.json({ error: "Insufficient privileges" }, { status: 403 })
        }

        result = await db.run(
          `
          INSERT INTO patients (first_name, last_name, date_of_birth, gender, phone, email, address, emergency_contact_name, emergency_contact_phone)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            data.firstName,
            data.lastName,
            data.dateOfBirth,
            data.gender,
            data.phone,
            data.email,
            data.address,
            data.emergencyContactName,
            data.emergencyContactPhone,
          ],
        )
        break

      case "medical_record":
        // Confidential/Sensitive information - encrypt if needed
        if (decoded.userType !== "doctor") {
          return NextResponse.json({ error: "Only doctors can create medical records" }, { status: 403 })
        }

        const sensitivity = classifyDataSensitivity(data.recordType, data.description)
        const isSensitive = sensitivity === "sensitive"
        const encryptedDescription = isSensitive ? encryptSensitiveData(data.description) : data.description

        result = await db.run(
          `
          INSERT INTO medical_records (patient_id, doctor_id, record_type, title, description, diagnosis_code, is_sensitive, record_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, DATE('now'))
        `,
          [
            data.patientId,
            decoded.userId,
            data.recordType,
            data.title,
            encryptedDescription,
            data.diagnosisCode,
            isSensitive ? 1 : 0,
          ],
        )
        break

      case "prescription":
        // Confidential information
        if (decoded.userType !== "doctor") {
          return NextResponse.json({ error: "Only doctors can create prescriptions" }, { status: 403 })
        }

        result = await db.run(
          `
          INSERT INTO prescriptions (patient_id, doctor_id, medication_name, dosage, frequency, duration, instructions, prescribed_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, DATE('now'))
        `,
          [
            data.patientId,
            decoded.userId,
            data.medicationName,
            data.dosage,
            data.frequency,
            data.duration,
            data.instructions,
          ],
        )
        break

      case "appointment":
        // Public information
        if (!["doctor", "nurse", "admin"].includes(decoded.userType)) {
          return NextResponse.json({ error: "Insufficient privileges" }, { status: 403 })
        }

        result = await db.run(
          `
          INSERT INTO appointments (patient_id, doctor_id, appointment_date, duration, notes)
          VALUES (?, ?, ?, ?, ?)
        `,
          [
            data.patientId,
            data.doctorId || decoded.userId,
            data.appointmentDate,
            data.duration || 30,
            data.notes || "",
          ],
        )
        break

      default:
        return NextResponse.json({ error: "Invalid data type" }, { status: 400 })
    }

    // Log the insertion
    await db.run(
      "INSERT INTO access_logs (user_id, action, table_name, record_id, ip_address) VALUES (?, ?, ?, ?, ?)",
      [decoded.userId, "INSERT", dataType, result.lastID, request.ip || "unknown"],
    )

    return NextResponse.json({
      success: true,
      id: result.lastID,
      message: `${dataType} created successfully`,
    })
  } catch (error) {
    console.error("Insert error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

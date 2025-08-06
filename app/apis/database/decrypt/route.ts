import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { openDb, decryptSensitiveData } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any

    // Only admins and doctors can decrypt data
    if (!["admin", "doctor"].includes(decoded.userType)) {
      return NextResponse.json({ error: "Insufficient privileges" }, { status: 403 })
    }

    const { encryptedData, recordId } = await request.json()

    try {
      const decryptedData = decryptSensitiveData(encryptedData)

      const db = await openDb()

      // Log decryption access
      await db.run(
        "INSERT INTO access_logs (user_id, action, table_name, record_id, ip_address) VALUES (?, ?, ?, ?, ?)",
        [decoded.userId, "DECRYPT_DATA", "medical_records", recordId, request.ip || "unknown"],
      )

      return NextResponse.json({
        decryptedData,
        success: true,
      })
    } catch (decryptError) {
      return NextResponse.json(
        {
          error: "Failed to decrypt data",
          details: decryptError instanceof Error ? decryptError.message : "Unknown error",
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("Decrypt error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

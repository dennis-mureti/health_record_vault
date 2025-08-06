import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import crypto from "crypto"
import { openDb } from "@/lib/database"

// Generate TOTP secret
function generateTOTPSecret(): string {
  return crypto.randomBytes(20).toString("base32")
}

// Generate QR code URL for authenticator apps
function generateQRCodeURL(username: string, secret: string): string {
  const issuer = "Health Records Vault"
  return `otpauth://totp/${issuer}:${username}?secret=${secret}&issuer=${issuer}`
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any

    const db = await openDb()

    // Generate new 2FA secret
    const secret = generateTOTPSecret()
    const qrCodeURL = generateQRCodeURL(decoded.username, secret)

    // Update user with 2FA secret
    await db.run("UPDATE users SET two_fa_secret = ? WHERE user_id = ?", [secret, decoded.userId])

    // Log the setup
    await db.run("INSERT INTO access_logs (user_id, action, table_name) VALUES (?, ?, ?)", [
      decoded.userId,
      "2FA_SETUP",
      "users",
    ])

    return NextResponse.json({
      secret,
      qrCodeURL,
      manualEntryKey: secret,
    })
  } catch (error) {
    console.error("2FA setup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

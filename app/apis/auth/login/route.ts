import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { openDb } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { username, password, userType, twoFactorCode } = await request.json()

    const db = await openDb()

    // Find user
    const user = await db.get("SELECT * FROM users WHERE username = ? AND user_type = ?", [username, userType])

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Check if 2FA is required
    if (user.two_fa_secret && !twoFactorCode) {
      return NextResponse.json({ requires2FA: true }, { status: 200 })
    }

    // Verify 2FA if provided
    if (user.two_fa_secret && twoFactorCode) {
      // In a real implementation, you would verify the TOTP code here
      // For demo purposes, we'll accept '123456' as valid
      if (twoFactorCode !== "123456") {
        return NextResponse.json({ error: "Invalid 2FA code" }, { status: 401 })
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.user_id,
        username: user.username,
        userType: user.user_type,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" },
    )

    // Log access
    await db.run("INSERT INTO access_logs (user_id, action, table_name, ip_address) VALUES (?, ?, ?, ?)", [
      user.user_id,
      "LOGIN",
      "users",
      request.ip || "unknown",
    ])

    return NextResponse.json({
      token,
      userType: user.user_type,
      username: user.username,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

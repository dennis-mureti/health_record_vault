const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const { body, validationResult } = require("express-validator");
const { openDb } = require("../config/database");
const { logAccess } = require("../middleware/auth");
const User = require("../models/user");
const router = express.Router();

// Register new user
router.post("/register", async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user already exists
    const existingUser = await User.getById(email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    const user = await User.create(req.body);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    const { email, password, twoFactorCode } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
        requires2FA: false,
      });
    }

    // Find user by email
    const user = await User.getByEmail(email);
    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
        requires2FA: false,
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({
        message: "Account is inactive",
        requires2FA: false,
      });
    }

    // Verify password
    const validPassword = await User.comparePassword(email, password);
    if (!validPassword) {
      return res.status(401).json({
        message: "Invalid credentials",
        requires2FA: false,
      });
    }

    // Check if 2FA is enabled for this user
    if (user.two_fa_secret) {
      if (!twoFactorCode) {
        return res.status(401).json({
          message: "2FA required",
          requires2FA: true,
        });
      }

      // Verify 2FA code
      const verified = speakeasy.totp.verify({
        secret: user.two_fa_secret,
        encoding: "base32",
        token: twoFactorCode,
      });

      if (!verified) {
        return res.status(401).json({
          message: "Invalid 2FA code",
          requires2FA: true,
        });
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.user_id, email: user.email, userType: user.user_type },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      token,
      user: {
        id: user.user_id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.user_type,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Login endpoint with complete 2FA implementation
router.post(
  "/login-2fa",
  [
    body("username").trim().isLength({ min: 3 }).escape(),
    body("password").isLength({ min: 6 }),
    body("userType").isIn([
      "doctor",
      "pharmacist",
      "nurse",
      "patient",
      "admin",
    ]),
    body("twoFactorCode").optional().isLength({ min: 6, max: 6 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const { username, password, userType, twoFactorCode } = req.body;
      const db = await openDb();

      // Find user with matching username and user type
      const user = await db.get(
        "SELECT * FROM users WHERE username = ? AND user_type = ? AND is_active = 1",
        [username, userType]
      );

      if (!user) {
        await db.run(
          "INSERT INTO access_logs (user_id, action, table_name, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)",
          [null, "FAILED_LOGIN", "users", req.ip, req.get("User-Agent")]
        );
        return res
          .status(401)
          .json({ error: "Invalid credentials or user type" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(
        password,
        user.password_hash
      );
      if (!isValidPassword) {
        await db.run(
          "INSERT INTO access_logs (user_id, action, table_name, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)",
          [user.user_id, "FAILED_LOGIN", "users", req.ip, req.get("User-Agent")]
        );
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check if 2FA is required
      if (user.two_fa_secret && !twoFactorCode) {
        return res.status(200).json({
          requires2FA: true,
          message: "Two-factor authentication required",
          userId: user.user_id, // Needed for 2FA verification
        });
      }

      // Verify 2FA if provided
      if (user.two_fa_secret && twoFactorCode) {
        const verified = speakeasy.totp.verify({
          secret: user.two_fa_secret,
          encoding: "base32",
          token: twoFactorCode,
          window: 2, // Allow 2 time steps before/after current time
        });

        if (!verified) {
          await db.run(
            "INSERT INTO access_logs (user_id, action, table_name, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)",
            [user.user_id, "FAILED_2FA", "users", req.ip, req.get("User-Agent")]
          );
          return res.status(401).json({ error: "Invalid 2FA code" });
        }

        // Log successful 2FA verification
        await db.run(
          "INSERT INTO access_logs (user_id, action, table_name, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)",
          [user.user_id, "2FA_SUCCESS", "users", req.ip, req.get("User-Agent")]
        );
      }

      // Generate JWT token with role information
      // const tokenPayload = {
      //   userId: user.user_id,
      //   username: user.username,
      //   userType: user.user_type,
      //   permissions: getRolePermissions(user.user_type),
      //   has2FA: !!user.two_fa_secret,
      // };

      // const token = jwt.sign(
      //   tokenPayload,
      //   process.env.JWT_SECRET || "your-secret-key",
      //   { expiresIn: "24h" }
      // );

      // After successful authentication
      const tokenPayload = {
        userId: user.user_id,
        username: user.username,
        userType: user.user_type,
        permissions: getRolePermissions(user.user_type),
        has2FA: !!user.two_fa_secret,
      };

      const token = jwt.sign(
        tokenPayload,
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "24h" }
      );

      res.status(200).json({
        token,
        user: {
          id: user.user_id,
          username: user.username,
          userType: user.user_type, // <-- This is what matters!
          email: user.email,
          permissions: tokenPayload.permissions,
          has2FA: tokenPayload.has2FA,
        },
        message: "Login successful",
      });

      // Log successful login
      await db.run(
        "INSERT INTO access_logs (user_id, action, table_name, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)",
        [user.user_id, "LOGIN_SUCCESS", "users", req.ip, req.get("User-Agent")]
      );

      // Update last login timestamp
      await db.run(
        "UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE user_id = ?",
        [user.user_id]
      );

      res.json({
        token,
        user: {
          id: user.user_id,
          username: user.username,
          userType: user.user_type,
          email: user.email,
          permissions: tokenPayload.permissions,
          has2FA: tokenPayload.has2FA,
        },
        message: "Login successful",
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Complete 2FA setup endpoint
router.post("/setup-2fa", async (req, res) => {
  try {
    const { username, userType } = req.body;
    const db = await openDb();

    const user = await db.get(
      "SELECT user_id, username, email FROM users WHERE username = ? AND user_type = ?",
      [username, userType]
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate 2FA secret
    const secret = speakeasy.generateSecret({
      name: `${user.username} (${userType})`,
      issuer: process.env.TWO_FA_ISSUER || "Health Records Vault",
      length: 32,
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Store the secret temporarily (not activated until verified)
    await db.run("UPDATE users SET two_fa_secret = ? WHERE user_id = ?", [
      secret.base32,
      user.user_id,
    ]);

    // Log 2FA setup
    await db.run(
      "INSERT INTO access_logs (user_id, action, table_name, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)",
      [
        user.user_id,
        "2FA_SETUP_INITIATED",
        "users",
        req.ip,
        req.get("User-Agent"),
      ]
    );

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32,
      backupCodes: generateBackupCodes(), // Generate backup codes
      message:
        "2FA setup initiated. Please verify with your authenticator app.",
    });
  } catch (error) {
    console.error("2FA setup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Verify 2FA setup
router.post("/verify-2fa", async (req, res) => {
  try {
    const { username, userType, token } = req.body;
    const db = await openDb();

    const user = await db.get(
      "SELECT user_id, two_fa_secret FROM users WHERE username = ? AND user_type = ?",
      [username, userType]
    );

    if (!user || !user.two_fa_secret) {
      return res.status(404).json({ error: "2FA setup not found" });
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: user.two_fa_secret,
      encoding: "base32",
      token: token,
      window: 2,
    });

    if (!verified) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    // Mark 2FA as verified and active
    await db.run(
      "UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE user_id = ?",
      [user.user_id]
    );

    // Log successful 2FA verification
    await db.run(
      "INSERT INTO access_logs (user_id, action, table_name, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)",
      [user.user_id, "2FA_VERIFIED", "users", req.ip, req.get("User-Agent")]
    );

    res.json({
      success: true,
      message: "2FA setup completed successfully",
    });
  } catch (error) {
    console.error("2FA verification error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Disable 2FA
router.post("/disable-2fa", async (req, res) => {
  try {
    const { username, userType, password } = req.body;
    const db = await openDb();

    const user = await db.get(
      "SELECT * FROM users WHERE username = ? AND user_type = ?",
      [username, userType]
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify password before disabling 2FA
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Remove 2FA secret
    await db.run("UPDATE users SET two_fa_secret = NULL WHERE user_id = ?", [
      user.user_id,
    ]);

    // Log 2FA disable
    await db.run(
      "INSERT INTO access_logs (user_id, action, table_name, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)",
      [user.user_id, "2FA_DISABLED", "users", req.ip, req.get("User-Agent")]
    );

    res.json({
      success: true,
      message: "2FA disabled successfully",
    });
  } catch (error) {
    console.error("2FA disable error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Generate backup codes for 2FA
function generateBackupCodes() {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
  }
  return codes;
}

// Get role permissions
function getRolePermissions(userType) {
  const permissions = {
    doctor: [
      "patients:read",
      "patients:write",
      "records:read",
      "records:write",
      "records:sensitive",
      "prescriptions:read",
      "prescriptions:write",
      "appointments:read",
      "appointments:write",
      "database:view",
      "audit:read",
    ],
    pharmacist: ["prescriptions:read", "prescriptions:update"],
    nurse: [
      "patients:read",
      "patients:update",
      "records:read",
      "appointments:read",
      "appointments:write",
    ],
    patient: ["records:own", "prescriptions:own", "appointments:own"],
    admin: [
      "patients:read",
      "patients:write",
      "records:read",
      "records:write",
      "records:sensitive",
      "prescriptions:read",
      "prescriptions:write",
      "appointments:read",
      "appointments:write",
      "users:manage",
      "database:view",
      "audit:read",
    ],
  };

  return permissions[userType] || [];
}

module.exports = router;

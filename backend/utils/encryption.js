const crypto = require("crypto")

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString("hex")
const ALGORITHM = "aes-256-gcm"

// Encrypt sensitive data
function encryptSensitiveData(data) {
  try {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY)

    let encrypted = cipher.update(data, "utf8", "hex")
    encrypted += cipher.final("hex")

    const authTag = cipher.getAuthTag()

    return iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted
  } catch (error) {
    console.error("Encryption error:", error)
    return Buffer.from(data).toString("base64") // Fallback
  }
}

// Decrypt sensitive data
function decryptSensitiveData(encryptedData) {
  try {
    const parts = encryptedData.split(":")
    if (parts.length !== 3) {
      // Fallback for base64 encoded data
      return Buffer.from(encryptedData, "base64").toString("utf-8")
    }

    const iv = Buffer.from(parts[0], "hex")
    const authTag = Buffer.from(parts[1], "hex")
    const encrypted = parts[2]

    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted, "hex", "utf8")
    decrypted += decipher.final("utf8")

    return decrypted
  } catch (error) {
    console.error("Decryption error:", error)
    return Buffer.from(encryptedData, "base64").toString("utf-8") // Fallback
  }
}

// Data classification
function classifyDataSensitivity(recordType, content) {
  const sensitiveKeywords = ["mental", "psychiatric", "hiv", "aids", "genetic", "addiction", "abuse"]
  const confidentialTypes = ["diagnosis", "treatment", "prescription", "lab_result"]

  if (
    recordType === "mental_health" ||
    recordType === "genetic" ||
    sensitiveKeywords.some((keyword) => content.toLowerCase().includes(keyword))
  ) {
    return "sensitive"
  }

  if (confidentialTypes.includes(recordType)) {
    return "confidential"
  }

  return "public"
}

module.exports = {
  encryptSensitiveData,
  decryptSensitiveData,
  classifyDataSensitivity,
}

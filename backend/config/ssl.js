const fs = require("fs")
const path = require("path")
const https = require("https")
const { execSync } = require("child_process")

// SSL Certificate Configuration
class SSLConfig {
  constructor() {
    this.certDir = path.join(__dirname, "../ssl")
    this.keyPath = path.join(this.certDir, "private.key")
    this.certPath = path.join(this.certDir, "certificate.crt")
    this.csrPath = path.join(this.certDir, "certificate.csr")
  }

  // Ensure SSL directory exists
  ensureSSLDirectory() {
    if (!fs.existsSync(this.certDir)) {
      fs.mkdirSync(this.certDir, { recursive: true })
      console.log("📁 Created SSL directory")
    }
  }

  // Generate self-signed certificate for development
  generateSelfSignedCertificate() {
    try {
      this.ensureSSLDirectory()

      console.log("🔐 Generating self-signed SSL certificate...")

      // Generate private key
      execSync(`openssl genrsa -out ${this.keyPath} 2048`, { stdio: "inherit" })

      // Generate certificate signing request
      execSync(
        `openssl req -new -key ${this.keyPath} -out ${this.csrPath} -subj "/C=US/ST=State/L=City/O=Health Records Vault/OU=IT Department/CN=localhost"`,
        { stdio: "inherit" },
      )

      // Generate self-signed certificate
      execSync(`openssl x509 -req -days 365 -in ${this.csrPath} -signkey ${this.keyPath} -out ${this.certPath}`, {
        stdio: "inherit",
      })

      console.log("✅ Self-signed SSL certificate generated successfully")
      console.log(`📄 Certificate: ${this.certPath}`)
      console.log(`🔑 Private Key: ${this.keyPath}`)

      return true
    } catch (error) {
      console.error("❌ Failed to generate SSL certificate:", error.message)
      console.log("💡 Make sure OpenSSL is installed on your system")
      return false
    }
  }

  // Check if SSL certificates exist
  certificatesExist() {
    return fs.existsSync(this.keyPath) && fs.existsSync(this.certPath)
  }

  // Get SSL credentials
  getSSLCredentials() {
    try {
      if (!this.certificatesExist()) {
        console.log("🔍 SSL certificates not found, generating new ones...")
        if (!this.generateSelfSignedCertificate()) {
          return null
        }
      }

      const privateKey = fs.readFileSync(this.keyPath, "utf8")
      const certificate = fs.readFileSync(this.certPath, "utf8")

      return {
        key: privateKey,
        cert: certificate,
      }
    } catch (error) {
      console.error("❌ Failed to read SSL certificates:", error.message)
      return null
    }
  }

  // Create HTTPS server
  createHTTPSServer(app) {
    const credentials = this.getSSLCredentials()

    if (!credentials) {
      console.log("⚠️  SSL certificates not available, falling back to HTTP")
      return null
    }

    try {
      const httpsServer = https.createServer(credentials, app)
      console.log("🔒 HTTPS server created with SSL certificates")
      return httpsServer
    } catch (error) {
      console.error("❌ Failed to create HTTPS server:", error.message)
      return null
    }
  }

  // Get certificate information
  getCertificateInfo() {
    try {
      if (!this.certificatesExist()) {
        return null
      }

      const certInfo = execSync(`openssl x509 -in ${this.certPath} -text -noout`, { encoding: "utf8" })
      const expiryDate = execSync(`openssl x509 -in ${this.certPath} -enddate -noout`, { encoding: "utf8" })

      return {
        path: this.certPath,
        expiry: expiryDate.replace("notAfter=", "").trim(),
        details: certInfo,
      }
    } catch (error) {
      console.error("❌ Failed to get certificate info:", error.message)
      return null
    }
  }
}

module.exports = SSLConfig

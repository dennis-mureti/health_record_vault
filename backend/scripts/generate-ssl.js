const SSLConfig = require("../config/ssl")

// Script to generate SSL certificates
async function generateSSLCertificates() {
  console.log("🔐 Health Records Vault - SSL Certificate Generator")
  console.log("=".repeat(50))

  const sslConfig = new SSLConfig()

  // Check if certificates already exist
  if (sslConfig.certificatesExist()) {
    console.log("📄 SSL certificates already exist")

    const certInfo = sslConfig.getCertificateInfo()
    if (certInfo) {
      console.log(`📅 Certificate expires: ${certInfo.expiry}`)
    }

    console.log("\n🔄 To regenerate certificates, delete the ssl/ directory first")
    return
  }

  // Generate new certificates
  console.log("🔨 Generating new SSL certificates...")
  const success = sslConfig.generateSelfSignedCertificate()

  if (success) {
    console.log("\n✅ SSL certificates generated successfully!")
    console.log("\n📋 Next steps:")
    console.log("1. Start the server with: npm run dev")
    console.log("2. Access HTTPS at: https://localhost:5443")
    console.log("3. Accept the self-signed certificate warning in your browser")
    console.log("\n⚠️  For production, replace with certificates from a trusted CA")
  } else {
    console.log("\n❌ Failed to generate SSL certificates")
    console.log("💡 Make sure OpenSSL is installed on your system")
    process.exit(1)
  }
}

// Run the script
generateSSLCertificates().catch(console.error)

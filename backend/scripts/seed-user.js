const bcrypt = require("bcryptjs");
const { openDb } = require("../config/database");

async function seedUsers() {
  const db = await openDb();
  const users = [
    {
      username: "admin",
      password: "password123",
      user_type: "admin",
      email: "admin@example.com",
    },
    {
      username: "drjohn",
      password: "doctorpass",
      user_type: "doctor",
      email: "drjohn@example.com",
    },
    {
      username: "nursejane",
      password: "nursepass",
      user_type: "nurse",
      email: "nursejane@example.com",
    },
    {
      username: "pharmbob",
      password: "pharmacistpass",
      user_type: "pharmacist",
      email: "pharmbob@example.com",
    },
    {
      username: "patientmary",
      password: "patientpass",
      user_type: "patient",
      email: "patientmary@example.com",
    },
  ];

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 12);
    await db.run(
      `INSERT OR IGNORE INTO users (username, password_hash, user_type, email, two_fa_secret, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user.username, hashedPassword, user.user_type, user.email, null, 1]
    );
    console.log(
      `Seeded user: ${user.email} (${user.user_type}) with password: ${user.password}`
    );
  }
  process.exit(0);
}

seedUsers().catch((err) => {
  console.error("Failed to seed users:", err);
  process.exit(1);
});

const { openDb } = require("../config/database");
const path = require("path");

// Sample patient data
const patients = [
  {
    first_name: "John",
    last_name: "Doe",
    date_of_birth: "1985-05-15",
    gender: "M",
    phone: "+1234567890",
    email: "john.doe@example.com",
    address: "123 Main St, Anytown, USA",
    emergency_contact_name: "Jane Doe",
    emergency_contact_phone: "+1234567891",
  },
  {
    first_name: "Jane",
    last_name: "Smith",
    date_of_birth: "1990-09-22",
    gender: "F",
    phone: "+1987654321",
    email: "jane.smith@example.com",
    address: "456 Oak Ave, Somewhere, USA",
    emergency_contact_name: "John Smith",
    emergency_contact_phone: "+1987654322",
  },
  {
    first_name: "Robert",
    last_name: "Johnson",
    date_of_birth: "1978-03-10",
    gender: "M",
    phone: "+1555123456",
    email: "robert.j@example.com",
    address: "789 Pine Rd, Nowhere, USA",
    emergency_contact_name: "Sarah Johnson",
    emergency_contact_phone: "+1555123457",
  },
  {
    first_name: "Emily",
    last_name: "Williams",
    date_of_birth: "1992-07-14",
    gender: "F",
    phone: "+1555987654",
    email: "emily.w@example.com",
    address: "321 Maple Dr, Anytown, USA",
    emergency_contact_name: "Michael Williams",
    emergency_contact_phone: "+1555987655",
  },
  {
    first_name: "David",
    last_name: "Brown",
    date_of_birth: "1982-11-30",
    gender: "M",
    phone: "+1555333444",
    email: "david.b@example.com",
    address: "654 Cedar Ln, Somewhere, USA",
    emergency_contact_name: "Lisa Brown",
    emergency_contact_phone: "+1555333445",
  },
  {
    first_name: "Sarah",
    last_name: "Miller",
    date_of_birth: "1995-04-18",
    gender: "F",
    phone: "+1555666777",
    email: "sarah.m@example.com",
    address: "987 Birch Blvd, Nowhere, USA",
    emergency_contact_name: "James Miller",
    emergency_contact_phone: "+1555666778",
  },
  {
    first_name: "Michael",
    last_name: "Wilson",
    date_of_birth: "1975-12-05",
    gender: "M",
    phone: "+1555888999",
    email: "michael.w@example.com",
    address: "159 Elm St, Anytown, USA",
    emergency_contact_name: "Jennifer Wilson",
    emergency_contact_phone: "+1555889000",
  },
  {
    first_name: "Jessica",
    last_name: "Taylor",
    date_of_birth: "1988-08-22",
    gender: "F",
    phone: "+1555222333",
    email: "jessica.t@example.com",
    address: "753 Willow Way, Somewhere, USA",
    emergency_contact_name: "Christopher Taylor",
    emergency_contact_phone: "+1555222334",
  },
];

async function seedPatients() {
  try {
    const db = await openDb();

    console.log("Starting to seed patients...");

    // Insert each patient
    for (const patient of patients) {
      const {
        first_name,
        last_name,
        date_of_birth,
        gender,
        phone,
        email,
        address,
        emergency_contact_name,
        emergency_contact_phone,
      } = patient;

      await db.run(
        `INSERT INTO patients 
         (user_id, first_name, last_name, date_of_birth, gender, phone, email, address, emergency_contact_name, emergency_contact_phone)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          null, // user_id set to NULL for now
          first_name,
          last_name,
          date_of_birth,
          gender,
          phone,
          email,
          address,
          emergency_contact_name,
          emergency_contact_phone,
        ]
      );

      console.log(`Added patient: ${first_name} ${last_name}`);
    }

    console.log("Successfully seeded patients!");

    // Verify the data was inserted
    const allPatients = await db.all("SELECT * FROM patients");
    console.log(`Total patients in database: ${allPatients.length}`);

    process.exit(0);
  } catch (error) {
    console.error("Error seeding patients:", error);
    process.exit(1);
  }
}

// Run the seed function
seedPatients();

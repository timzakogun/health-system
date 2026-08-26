const bcrypt = require("bcryptjs");
const { prisma } = require("../lib/prisma");

const createAdmin = async () => {
  try {
    const {
      ADMIN_EMAIL,
      ADMIN_PASSWORD,
      ADMIN_FIRST_NAME,
      ADMIN_LAST_NAME,
      ADMIN_PHONE
    } = process.env;

    // Validate environment variables
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw new Error(
        "ADMIN_EMAIL and ADMIN_PASSWORD must be defined in .env"
      );
    }

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: {
        email: ADMIN_EMAIL
      }
    });

    if (existingAdmin) {
      if (existingAdmin.role === "ADMIN") {
        console.log("Admin already exists.");
      } else {
        console.log(
          `A user with ${ADMIN_EMAIL} already exists with role ${existingAdmin.role}.`
        );
      }

      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      ADMIN_PASSWORD,
      10
    );

    // Create admin
    const admin = await prisma.user.create({
      data: {
        firstName: ADMIN_FIRST_NAME || "System",
        lastName: ADMIN_LAST_NAME || "Administrator",
        email: ADMIN_EMAIL,
        password: hashedPassword,
        phone: ADMIN_PHONE || null,
        role: "ADMIN"
      }
    });

    console.log("=================================");
    console.log("ADMIN CREATED SUCCESSFULLY");
    console.log("=================================");
    console.log(`ID:    ${admin.id}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Role:  ${admin.role}`);
    console.log("=================================");

  } catch (error) {
    console.error("Failed to create admin:");
    console.error(error.message);

  } finally {
    await prisma.$disconnect();
  }
};

createAdmin();
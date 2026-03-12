require("dotenv/config");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Create or find the organization
  let org = await prisma.organization.findFirst({
    where: { name: "Admin Team" },
  });
  if (!org) {
    org = await prisma.organization.create({
      data: { name: "Admin Team" },
    });
  }

  const user = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { orgId: org.id },
    create: {
      name: "Admin User",
      email: "admin@example.com",
      password: hashedPassword,
      orgId: org.id,
      posts: {
        create: [
          {
            title: "Getting Started",
            content:
              "Welcome to the starter app. This is your first post — feel free to edit or delete it.",
            published: true,
            orgId: org.id,
          },
          {
            title: "Draft Post",
            content:
              "This post is still a draft. Mark it as published when you are ready.",
            published: false,
            orgId: org.id,
          },
        ],
      },
    },
  });

  console.log(`Seeded user: ${user.name} (${user.email}) in org: ${org.name}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

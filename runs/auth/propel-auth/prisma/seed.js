require("dotenv/config");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const org = await prisma.organization.upsert({
    where: { propelAuthId: "seed-org-placeholder" },
    update: {},
    create: {
      propelAuthId: "seed-org-placeholder",
      name: "Default Team",
    },
  });

  const user = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      propelAuthId: "seed-admin-placeholder",
      name: "Admin User",
      email: "admin@example.com",
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

  console.log(`Seeded org: ${org.name}`);
  console.log(`Seeded user: ${user.name} (${user.email})`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

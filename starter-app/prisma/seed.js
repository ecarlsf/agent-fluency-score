require("dotenv/config");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@example.com",
      posts: {
        create: [
          {
            title: "Getting Started",
            content:
              "Welcome to the starter app. This is your first post — feel free to edit or delete it.",
            published: true,
          },
          {
            title: "Draft Post",
            content:
              "This post is still a draft. Mark it as published when you are ready.",
            published: false,
          },
        ],
      },
    },
  });

  console.log(`Seeded user: ${user.name} (${user.email})`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

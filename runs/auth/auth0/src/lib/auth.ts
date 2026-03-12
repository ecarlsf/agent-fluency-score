import { redirect } from "next/navigation";
import { auth0 } from "./auth0";
import { prisma } from "./prisma";

export async function getRequiredUser() {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  const sub = session.user.sub as string;
  const email = session.user.email as string;
  const name = session.user.name as string | undefined;

  let user = await prisma.user.findUnique({
    where: { auth0SubjectId: sub },
    include: { organization: true },
  });

  if (!user) {
    // Try to link an existing user by email
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Link existing user to Auth0, ensure they have an org
      if (!existingUser.organizationId) {
        const org = await prisma.organization.create({
          data: { name: `${name || email}'s Team` },
        });
        user = await prisma.user.update({
          where: { id: existingUser.id },
          data: { auth0SubjectId: sub, organizationId: org.id },
          include: { organization: true },
        });
      } else {
        user = await prisma.user.update({
          where: { id: existingUser.id },
          data: { auth0SubjectId: sub },
          include: { organization: true },
        });
      }
    } else {
      // Create new user with a new organization
      const org = await prisma.organization.create({
        data: { name: `${name || email}'s Team` },
      });
      user = await prisma.user.create({
        data: {
          auth0SubjectId: sub,
          name: name || email,
          email,
          organizationId: org.id,
        },
        include: { organization: true },
      });
    }
  } else if (!user.organizationId) {
    // Existing auth0-linked user without an org — backfill
    const org = await prisma.organization.create({
      data: { name: `${user.name}'s Team` },
    });
    user = await prisma.user.update({
      where: { id: user.id },
      data: { organizationId: org.id },
      include: { organization: true },
    });
  }

  return user;
}

import { getUser } from "@propelauth/nextjs/server/app-router";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";

export async function getAuthUser() {
  const propelUser = await getUser();
  if (!propelUser) {
    redirect("/login");
  }

  // Resolve the user's first org from PropelAuth (if any)
  const orgs = propelUser.getOrgs();
  let orgId: number | null = null;

  if (orgs.length > 0) {
    const propelOrg = orgs[0];
    const org = await prisma.organization.upsert({
      where: { propelAuthId: propelOrg.orgId },
      update: { name: propelOrg.orgName },
      create: {
        propelAuthId: propelOrg.orgId,
        name: propelOrg.orgName,
      },
    });
    orgId = org.id;
  }

  const user = await prisma.user.upsert({
    where: { propelAuthId: propelUser.userId },
    update: {
      email: propelUser.email,
      name: propelUser.firstName
        ? `${propelUser.firstName}${propelUser.lastName ? ` ${propelUser.lastName}` : ""}`
        : propelUser.email,
      orgId,
    },
    create: {
      propelAuthId: propelUser.userId,
      email: propelUser.email,
      name: propelUser.firstName
        ? `${propelUser.firstName}${propelUser.lastName ? ` ${propelUser.lastName}` : ""}`
        : propelUser.email,
      orgId,
    },
  });

  return { ...user, orgId };
}

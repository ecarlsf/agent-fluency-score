import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export async function getOrCreateDbUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const existing = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { organization: true },
  });
  if (existing) return existing;

  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("Not authenticated");

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    "User";

  return prisma.user.create({
    data: {
      clerkId: userId,
      name,
      email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
      organization: {
        create: {
          name: `${name}'s Team`,
        },
      },
    },
    include: { organization: true },
  });
}

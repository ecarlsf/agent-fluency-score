"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/auth";

export async function updateUser(formData: FormData) {
  const user = await getOrCreateDbUser();
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;

  await prisma.user.update({
    where: { id: user.id },
    data: { name, email },
  });

  revalidatePath("/settings");
}

export async function updateOrganization(formData: FormData) {
  const user = await getOrCreateDbUser();
  const name = formData.get("name") as string;

  await prisma.organization.update({
    where: { id: user.organizationId },
    data: { name },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

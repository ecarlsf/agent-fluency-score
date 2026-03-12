"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function updateUser(formData: FormData) {
  const user = await getAuthUser();
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;

  await prisma.user.update({
    where: { id: user.id },
    data: { name, email },
  });

  revalidatePath("/settings");
}

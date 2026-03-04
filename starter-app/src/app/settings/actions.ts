"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const DEFAULT_USER_ID = 1;

export async function updateUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;

  await prisma.user.update({
    where: { id: DEFAULT_USER_ID },
    data: { name, email },
  });

  revalidatePath("/settings");
}

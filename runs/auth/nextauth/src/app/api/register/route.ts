import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const email = body.email;
  const password = body.password;
  const name = body.name || email.split("@")[0];

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const org = await prisma.organization.create({
    data: { name: `${name}'s Team` },
  });

  await prisma.user.create({
    data: { name, email, password: hashedPassword, orgId: org.id },
  });

  return NextResponse.json({ message: "Account created" }, { status: 201 });
}

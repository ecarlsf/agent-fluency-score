import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateUser, updateOrganization } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: Number(session.user.id) },
    include: { org: { include: { users: { select: { id: true, name: true, email: true } } } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Update your profile and organization</p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your name and email address</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={user.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={user.email}
                required
              />
            </div>
            <Button type="submit">Save Changes</Button>
          </form>
        </CardContent>
      </Card>

      {user.org && (
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Organization</CardTitle>
            <CardDescription>Manage your team settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={updateOrganization} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  name="orgName"
                  defaultValue={user.org.name}
                  required
                />
              </div>
              <Button type="submit">Update Organization</Button>
            </form>
            {user.org.users.length > 0 && (
              <div className="space-y-2">
                <Label>Members</Label>
                <ul className="space-y-1 text-sm">
                  {user.org.users.map((member) => (
                    <li key={member.id} className="text-muted-foreground">
                      {member.name} ({member.email})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

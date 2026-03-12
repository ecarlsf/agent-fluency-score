import { getOrCreateDbUser } from "@/lib/auth";
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
  const user = await getOrCreateDbUser();
  const members = await prisma.user.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile and organization
        </p>
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

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Organization</CardTitle>
          <CardDescription>Your team settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={updateOrganization} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Team Name</Label>
              <Input
                id="orgName"
                name="name"
                defaultValue={user.organization.name}
                required
              />
            </div>
            <Button type="submit">Update Team Name</Button>
          </form>
          <div className="space-y-2">
            <Label>Members</Label>
            <ul className="space-y-1 text-sm">
              {members.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <span>{member.name}</span>
                  <span className="text-muted-foreground">{member.email}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

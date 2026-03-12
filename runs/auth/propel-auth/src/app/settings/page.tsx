import { updateUser } from "./actions";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
  const user = await getAuthUser();
  const org = user.orgId
    ? await prisma.organization.findUnique({ where: { id: user.orgId } })
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Update your profile information</p>
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

      {org && (
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Organization</CardTitle>
            <CardDescription>Your current team</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{org.name}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

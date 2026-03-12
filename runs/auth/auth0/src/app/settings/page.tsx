import { getRequiredUser } from "@/lib/auth";
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
  const user = await getRequiredUser();

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
                type="email"
                defaultValue={user.email}
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Email is managed by Auth0 and cannot be changed here.
              </p>
            </div>
            <Button type="submit">Save Changes</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Organization</CardTitle>
          <CardDescription>
            Your team name — all members see the same data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateOrganization} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Team Name</Label>
              <Input
                id="orgName"
                name="orgName"
                defaultValue={user.organization?.name ?? ""}
                required
              />
            </div>
            <Button type="submit">Update Organization</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

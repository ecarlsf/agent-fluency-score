import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      orgId?: number | null;
      orgName?: string | null;
      name?: string | null;
      email?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    orgId?: number | null;
    orgName?: string | null;
  }
}

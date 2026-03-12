import { CategoryDefinition } from "../types.js";

const auth: CategoryDefinition = {
  name: "auth",
  tools: ["clerk", "propel-auth", "auth0", "nextauth", "supabase-auth", "firebase-auth"],
  tasks: [
    {
      id: 1,
      tier: "Basic Setup",
      description: "Install and configure basic email/password authentication",
      prompt: "Add email/password authentication using {{tool}} to this Next.js app",
    },
    {
      id: 2,
      tier: "Core Feature",
      description: "Add OAuth provider alongside existing auth",
      prompt: "Add Google OAuth as a sign-in option alongside email/password",
    },
    {
      id: 3,
      tier: "Integration",
      description: "Protect routes and handle unauthorized access",
      prompt:
        "Protect the /dashboard and /settings routes so only authenticated users can access them. Redirect unauthenticated users to the sign-in page.",
    },
    {
      id: 4,
      tier: "Production",
      description: "Session management and sign-out functionality",
      prompt:
        "Add a sign-out button to the header that works across all pages. Handle session expiry gracefully.",
    },
    {
      id: 5,
      tier: "Advanced",
      description: "Multi-tenant organization support",
      prompt:
        "Add organization support so users can belong to a team and only see data for their organization.",
    },
  ],
};

export default auth;

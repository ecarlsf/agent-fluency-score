import { getRouteHandlers } from "@propelauth/nextjs/server/app-router";

const routeHandlers = getRouteHandlers({
  postLoginRedirectPathFn: () => "/dashboard",
});

export const GET = routeHandlers.getRouteHandler;
export const POST = routeHandlers.postRouteHandler;

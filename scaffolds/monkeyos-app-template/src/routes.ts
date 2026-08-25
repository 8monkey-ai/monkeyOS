import { index, layout, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  route("healthz", "routes/health.ts"),
  route("login", "routes/login.tsx"),
  layout("routes/protected.tsx", [
    layout("routes/app-shell.tsx", [
      index("routes/dashboard.tsx"),
      layout("routes/admin.tsx", [route("access", "routes/access.tsx")]),
    ]),
  ]),
  route("*", "routes/catchall.ts"),
] satisfies RouteConfig;

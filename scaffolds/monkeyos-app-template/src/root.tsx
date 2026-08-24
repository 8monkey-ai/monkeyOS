import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import type { Route } from "./+types/root";
import { TooltipProvider } from "./components/ui/tooltip";
import { loadPublicRuntimeConfig } from "./config";
import { AuthProvider } from "./contexts/auth";
import { RuntimeProvider } from "./contexts/runtime";
import "./styles.css";

export const meta: Route.MetaFunction = () => [
  { title: "monkeyOS starter" },
  { name: "theme-color", content: "#102a2e" },
];

export function loader() {
  return loadPublicRuntimeConfig();
}

export function headers() {
  return {
    "referrer-policy": "strict-origin-when-cross-origin",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "permissions-policy": "camera=(), microphone=(), geolocation=()",
  };
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root({ loaderData }: Route.ComponentProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 20_000, refetchOnWindowFocus: false } },
      }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <RuntimeProvider config={loaderData}>
        <AuthProvider>
          <TooltipProvider>
            <Outlet />
          </TooltipProvider>
        </AuthProvider>
      </RuntimeProvider>
    </QueryClientProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const detail = isRouteErrorResponse(error)
    ? error.status === 404
      ? "The requested page was not found."
      : error.statusText
    : error instanceof Error
      ? error.message
      : "An unexpected error occurred.";
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-slate-950">Application unavailable</h1>
        <p className="mt-2 text-slate-600">{detail}</p>
      </div>
    </main>
  );
}

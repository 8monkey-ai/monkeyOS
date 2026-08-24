import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../contexts/auth";
import { useMembership } from "../hooks/use-membership";
import { useRuntime } from "../contexts/runtime";
import { Button } from "./ui/button";

export function ProtectedRoute() {
  const auth = useAuth();
  const membership = useMembership();
  const { supabase } = useRuntime();
  const location = useLocation();
  if (auth.loading || (auth.user && membership.isPending))
    return (
      <RouteMessage
        title="Checking application access"
        detail="Authorization is enforced by the application database."
      />
    );
  if (!auth.user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!membership.data)
    return (
      <RouteMessage
        title="No application access"
        detail="Your identity is valid, but this application has no local membership for you."
        action={
          <Button variant="secondary" onClick={() => void supabase.auth.signOut()}>
            Log out
          </Button>
        }
      />
    );
  return <Outlet />;
}

export function AdminRoute() {
  const membership = useMembership();
  return membership.data?.role === "admin" ? <Outlet /> : <Navigate to="/" replace />;
}

function RouteMessage({
  title,
  detail,
  action,
}: {
  title: string;
  detail: string;
  action?: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 grid size-12 place-items-center rounded-2xl bg-teal-100 text-xl">
          m
        </div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-slate-600">{detail}</p>
        {action && <div className="mt-5">{action}</div>}
      </div>
    </main>
  );
}

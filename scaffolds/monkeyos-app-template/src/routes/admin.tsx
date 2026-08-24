import { Navigate, Outlet } from "react-router";
import { useMembership } from "../hooks/use-membership";

export default function AdminRoute() {
  const membership = useMembership();
  return membership.data?.role === "admin" ? <Outlet /> : <Navigate to="/" replace />;
}

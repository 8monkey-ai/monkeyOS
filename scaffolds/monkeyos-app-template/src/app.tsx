import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router";
import { AppShell } from "./components/app-shell";
import { AdminRoute, ProtectedRoute } from "./components/protected-route";
import { LoginPage } from "./pages/login";

const DashboardPage = lazy(() =>
  import("./pages/dashboard").then((module) => ({ default: module.DashboardPage })),
);
const WorkItemsPage = lazy(() =>
  import("./pages/work-items").then((module) => ({ default: module.WorkItemsPage })),
);
const AuditPage = lazy(() =>
  import("./pages/audit").then((module) => ({ default: module.AuditPage })),
);
const AccessPage = lazy(() =>
  import("./pages/access").then((module) => ({ default: module.AccessPage })),
);

export function App() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-slate-50 text-slate-500">
          Loading view…
        </main>
      }
    >
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="work-items" element={<WorkItemsPage />} />
            <Route path="audit" element={<AuditPage />} />
            <Route element={<AdminRoute />}>
              <Route path="access" element={<AccessPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

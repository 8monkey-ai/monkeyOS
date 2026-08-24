import { Outlet, useLocation } from "react-router";
import { useRuntime } from "@/contexts/runtime";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

const pageLabels: Record<string, string> = {
  "/": "Overview",
  "/audit": "Audit trail",
  "/access": "Access",
};

export default function AppShell() {
  const { config } = useRuntime();
  const { pathname } = useLocation();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger aria-label="Open navigation" className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>{pageLabels[pathname] ?? "Application"}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-10">
          <Outlet />
        </div>
        <footer className="mx-auto flex w-full max-w-7xl flex-wrap justify-between gap-2 px-4 pb-8 text-xs text-muted-foreground sm:px-6 lg:px-10">
          <span>monkeyOS application starter</span>
          <span>
            Version {config.version} · SHA {config.gitSha.slice(0, 12)}
          </span>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}

import { ClipboardList, Gauge, History, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { NavLink, useLocation } from "react-router";
import { useAuth } from "@/contexts/auth";
import { useRuntime } from "@/contexts/runtime";
import { useMembership } from "@/hooks/use-membership";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

const links = [
  { to: "/", label: "Overview", icon: Gauge, end: true },
  { to: "/work-items", label: "Work items", icon: ClipboardList, end: false },
  { to: "/audit", label: "Audit trail", icon: History, end: false },
];

export function AppSidebar() {
  const { supabase } = useRuntime();
  const { user } = useAuth();
  const membership = useMembership();
  const { pathname } = useLocation();
  const { setOpenMobile } = useSidebar();
  const allLinks =
    membership.data?.role === "admin"
      ? [...links, { to: "/access", label: "Access", icon: ShieldCheck, end: false }]
      : links;

  return (
    <Sidebar variant="inset" collapsible="icon" aria-label="Primary navigation">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="monkeyOS" render={<NavLink to="/" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <span className="font-bold">m</span>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">monkeyOS</span>
                <span className="truncate text-xs">Application starter</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {allLinks.map(({ to, label, icon: Icon, end }) => {
                const isActive = end ? pathname === to : pathname.startsWith(to);
                return (
                  <SidebarMenuItem key={to}>
                    <SidebarMenuButton
                      tooltip={label}
                      isActive={isActive}
                      render={<NavLink to={to} end={end} onClick={() => setOpenMobile(false)} />}
                    >
                      <Icon />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip={user?.email ?? "Signed-in user"}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
                <UserRound />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user?.email}</span>
                <span className="truncate text-xs capitalize">
                  {membership.data?.role ?? "member"}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Log out" onClick={() => void supabase.auth.signOut()}>
              <LogOut />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

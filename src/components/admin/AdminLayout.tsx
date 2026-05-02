import { NavLink, useLocation, Outlet, Link } from "react-router-dom";
import {
  LayoutDashboard, Newspaper, BookOpen, PlayCircle, Calendar,
  FolderOpen, MessageSquare, Mail, Settings, Users2, LogOut, ExternalLink,
  Radio, FileText, Scale,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
  SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

const items = [
  { url: "/admin", icon: LayoutDashboard, label: "لوحة التحكم", end: true },
  { url: "/admin/news", icon: Newspaper, label: "الأخبار والبيانات" },
  { url: "/admin/library", icon: BookOpen, label: "المكتبة" },
  { url: "/admin/videos", icon: PlayCircle, label: "المرئيات" },
  { url: "/admin/live", icon: Radio, label: "استوديو البث المباشر" },
  { url: "/admin/events", icon: Calendar, label: "الفعاليات" },
  { url: "/admin/pages", icon: FileText, label: "إدارة الصفحات" },
  { url: "/admin/media", icon: FolderOpen, label: "إدارة الملفات" },
  { url: "/admin/messages", icon: MessageSquare, label: "رسائل التواصل" },
  { url: "/admin/newsletter", icon: Mail, label: "النشرة البريدية" },
  { url: "/admin/settings", icon: Settings, label: "إعدادات الموقع" },
];

function AdminSidebar() {
  const location = useLocation();
  const { isSuperAdmin, signOut, user } = useAuth();

  return (
    <Sidebar side="right" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/admin" className="flex items-center gap-2 px-2 py-2">
          <Logo size={32} />
          <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="text-sm font-bold truncate">لوحة التحكم</div>
            <div className="text-[10px] text-muted-foreground truncate">اتحاد علماء الأزهر</div>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>الأقسام</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = item.end
                  ? location.pathname === item.url
                  : location.pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                      <NavLink to={item.url} end={item.end}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              {isSuperAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname.startsWith("/admin/admins")} tooltip="إدارة المدراء">
                    <NavLink to="/admin/admins">
                      <Users2 className="h-4 w-4" />
                      <span>إدارة المدراء</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="px-2 py-2 group-data-[collapsible=icon]:hidden">
          <div className="text-xs text-muted-foreground truncate" dir="ltr">{user?.email}</div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="عرض الموقع">
              <a href="/" target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" />
                <span>عرض الموقع</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => signOut()} tooltip="تسجيل الخروج">
              <LogOut className="h-4 w-4" />
              <span>تسجيل الخروج</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AdminLayout() {
  useEffect(() => {
    document.documentElement.dir = "rtl";
    document.documentElement.lang = "ar";
  }, []);

  return (
    <SidebarProvider>
      <div dir="rtl" className="min-h-screen flex w-full bg-muted/30">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b bg-background px-4 sticky top-0 z-30">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="font-semibold text-sm">منطقة الإدارة</span>
            </div>
            <Button asChild variant="ghost" size="sm">
              <a href="/" target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" />
                الموقع العام
              </a>
            </Button>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

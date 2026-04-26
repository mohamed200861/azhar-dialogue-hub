import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/admin-utils";
import { toast } from "sonner";

const ROLES = ["super_admin", "admin", "editor", "media_manager"] as const;
const ROLE_LABEL: Record<string, string> = {
  super_admin: "مدير عام", admin: "مدير", editor: "محرر", media_manager: "مدير وسائط",
};

export default function AdminUsers() {
  const [users, setUsers] = useState<any[] | null>(null);

  const load = async () => {
    setUsers(null);
    const { data: au } = await supabase.from("admin_users").select("*").order("created_at", { ascending: false });
    const ids = (au ?? []).map((u: any) => u.user_id);
    const { data: roles } = await supabase.from("user_roles").select("user_id,role").in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const byUser: Record<string, string[]> = {};
    (roles ?? []).forEach((r: any) => {
      byUser[r.user_id] = [...(byUser[r.user_id] ?? []), r.role];
    });
    setUsers((au ?? []).map((u: any) => ({ ...u, roles: byUser[u.user_id] ?? [] })));
  };
  useEffect(() => { load(); }, []);

  const setRole = async (userId: string, role: string, currentRoles: string[]) => {
    // replace roles: remove all, insert new
    await supabase.from("user_roles").delete().eq("user_id", userId);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: role as any });
    if (error) return toast.error(error.message);
    toast.success("تم تحديث الدور");
    load();
  };

  const toggleActive = async (u: any) => {
    const { error } = await supabase.from("admin_users").update({ is_active: !u.is_active }).eq("id", u.id);
    if (error) return toast.error(error.message);
    toast.success(u.is_active ? "تم إيقاف الحساب" : "تم تفعيل الحساب");
    load();
  };

  const removeRoles = async (userId: string) => {
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId);
    if (error) return toast.error(error.message);
    toast.success("تم إزالة جميع الأدوار");
    load();
  };

  return (
    <div>
      <PageHeader title="إدارة المدراء" description="إضافة وتعيين أدوار للمدراء. لا تظهر هذه البيانات في الموقع العام." />
      <Card className="p-4 mb-4 text-sm text-muted-foreground">
        لإضافة مدير جديد: يقوم المدير بإنشاء حسابه عبر صفحة <code dir="ltr">/admin/login</code> ثم اطلب من المدير العام تعيين دور له هنا.
      </Card>
      {users === null ? <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
        : users.length === 0 ? <Card className="p-12 text-center text-muted-foreground">لا يوجد مدراء بعد.</Card>
        : <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-right"><tr>
                <th className="p-3">الاسم</th><th className="p-3">البريد</th><th className="p-3">الدور</th>
                <th className="p-3">الحالة</th><th className="p-3">التاريخ</th><th className="p-3 w-32">إجراءات</th>
              </tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="p-3 font-medium">{u.display_name ?? "—"}</td>
                    <td className="p-3 text-muted-foreground" dir="ltr">{u.email}</td>
                    <td className="p-3">
                      <Select value={u.roles[0] ?? ""} onValueChange={(v) => setRole(u.user_id, v, u.roles)}>
                        <SelectTrigger className="w-[160px]"><SelectValue placeholder="بدون دور" /></SelectTrigger>
                        <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>)}</SelectContent>
                      </Select>
                    </td>
                    <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${u.is_active ? "bg-primary/10 text-primary" : "bg-muted"}`}>{u.is_active ? "مفعل" : "موقوف"}</span></td>
                    <td className="p-3 text-muted-foreground">{formatDate(u.created_at)}</td>
                    <td className="p-3"><div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => toggleActive(u)}>{u.is_active ? "إيقاف" : "تفعيل"}</Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => removeRoles(u.user_id)}><Trash2 className="h-4 w-4" /></Button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
      }
    </div>
  );
}

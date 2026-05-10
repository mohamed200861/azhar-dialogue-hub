import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Trash2, Plus, X } from "lucide-react";
import { formatDate } from "@/lib/admin-utils";
import { toast } from "sonner";

const ROLES = ["super_admin", "admin", "editor", "media_manager"] as const;
const ROLE_LABEL: Record<string, string> = {
  super_admin: "مدير عام",
  admin: "مدير",
  editor: "محرر",
  media_manager: "مدير وسائط",
};

export default function AdminUsers() {
  const [users, setUsers] = useState<any[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<string>("editor");

  const load = async () => {
    setUsers(null);
    const { data: au } = await supabase.from("admin_users").select("*").order("created_at", { ascending: false });
    const ids = (au ?? []).map((u: any) => u.user_id);
    const { data: roles } = await supabase
      .from("user_roles").select("user_id,role")
      .in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const byUser: Record<string, string[]> = {};
    (roles ?? []).forEach((r: any) => {
      byUser[r.user_id] = [...(byUser[r.user_id] ?? []), r.role];
    });
    setUsers((au ?? []).map((u: any) => ({ ...u, roles: byUser[u.user_id] ?? [] })));
  };
  useEffect(() => { load(); }, []);

  const setRole = async (userId: string, role: string) => {
    await supabase.from("user_roles").delete().eq("user_id", userId);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: role as any });
    if (error) return toast.error(error.message);
    toast.success("تم تحديث الدور");
    load();
  };

  const countSuperAdmins = async () => {
    const { data } = await supabase.from("user_roles").select("user_id").eq("role", "super_admin");
    return (data ?? []).length;
  };

  const toggleActive = async (u: any) => {
    const willDeactivate = u.is_active;
    if (willDeactivate && u.roles?.includes("super_admin")) {
      const n = await countSuperAdmins();
      if (n <= 1) return toast.error("لا يمكن إيقاف آخر مدير عام في النظام.");
    }
    const { error } = await supabase.from("admin_users").update({ is_active: !u.is_active }).eq("id", u.id);
    if (error) return toast.error(error.message);
    if (willDeactivate) {
      await supabase.from("user_roles").delete().eq("user_id", u.user_id);
    }
    toast.success(willDeactivate ? "تم إيقاف الحساب وإزالة صلاحياته" : "تم تفعيل الحساب (أعد تعيين الدور)");
    load();
  };

  const removeRoles = async (userId: string, u: any) => {
    const { data: sess } = await supabase.auth.getSession();
    if (sess.session?.user?.id === userId) {
      return toast.error("لا يمكنك إزالة دورك بنفسك.");
    }
    if (u.roles?.includes("super_admin")) {
      const n = await countSuperAdmins();
      if (n <= 1) return toast.error("لا يمكن إزالة آخر مدير عام في النظام.");
    }
    const word = prompt(`لتأكيد إزالة جميع أدوار "${u.email}" اكتب: ELIMINA`);
    if (word !== "ELIMINA") return;
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId);
    if (error) return toast.error(error.message);
    toast.success("تم إزالة جميع الأدوار");
    load();
  };

  const deleteAdminRecord = async (u: any) => {
    const { data: sess } = await supabase.auth.getSession();
    if (sess.session?.user?.id === u.user_id) {
      return toast.error("لا يمكنك حذف حسابك الخاص.");
    }
    if (u.roles?.includes("super_admin")) {
      const n = await countSuperAdmins();
      if (n <= 1) return toast.error("لا يمكن حذف آخر مدير عام في النظام.");
    }
    const word = prompt(`لتأكيد حذف سجل "${u.email}" اكتب: ELIMINA`);
    if (word !== "ELIMINA") return;
    const { error } = await supabase.from("admin_users").delete().eq("id", u.id);
    if (error) return toast.error(error.message);
    toast.success("تم حذف السجل");
    load();
  };

  const createAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating) return;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newEmail.trim())) {
      toast.error("بريد إلكتروني غير صحيح");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("كلمة المرور يجب أن لا تقل عن 8 أحرف");
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-admin-user", {
        body: {
          email: newEmail.trim().toLowerCase(),
          password: newPassword,
          role: newRole,
        },
      });
      if (error) {
        // Try to extract server error message
        let serverMsg = error.message;
        try {
          const ctx: any = (error as any).context;
          if (ctx?.json) {
            const j = await ctx.json();
            if (j?.error) serverMsg = j.error;
          }
        } catch (_e) { /* noop */ }
        throw new Error(serverMsg);
      }
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("Admin creato correttamente");
      setNewEmail(""); setNewPassword(""); setNewRole("editor"); setShowForm(false);
      load();
    } catch (err: any) {
      toast.error(err?.message || "تعذر إنشاء المدير");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="إدارة المدراء"
        description="إنشاء وإدارة حسابات المدراء وأدوارهم. لا تظهر هذه البيانات في الموقع العام."
        actions={
          <Button onClick={() => setShowForm((s) => !s)}>
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "إغلاق" : "إضافة مدير"}
          </Button>
        }
      />

      {showForm && (
        <Card className="p-5 mb-6">
          <form onSubmit={createAdmin} className="grid md:grid-cols-4 gap-3 items-end">
            <div className="md:col-span-1">
              <Label>البريد الإلكتروني</Label>
              <Input type="email" dir="ltr" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
            </div>
            <div className="md:col-span-1">
              <Label>كلمة المرور</Label>
              <Input type="password" dir="ltr" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </div>
            <div className="md:col-span-1">
              <Label>الدور</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              إنشاء
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-3">
            ملاحظة: قد يحتاج المدير الجديد إلى تأكيد البريد الإلكتروني قبل تسجيل الدخول، حسب إعدادات المصادقة.
          </p>
        </Card>
      )}

      {users === null ? (
        <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
      ) : users.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">لا يوجد مدراء بعد.</Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-muted/50 text-right">
              <tr>
                <th className="p-3">البريد</th>
                <th className="p-3">الدور</th>
                <th className="p-3">الحالة</th>
                <th className="p-3">التاريخ</th>
                <th className="p-3 w-44">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="p-3 text-muted-foreground" dir="ltr">{u.email}</td>
                  <td className="p-3">
                    <Select value={u.roles[0] ?? ""} onValueChange={(v) => setRole(u.user_id, v)}>
                      <SelectTrigger className="w-[160px]"><SelectValue placeholder="بدون دور" /></SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_active ? "bg-primary/10 text-primary" : "bg-muted"}`}>
                      {u.is_active ? "مفعل" : "موقوف"}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">{formatDate(u.created_at)}</td>
                  <td className="p-3">
                    <div className="flex gap-1 flex-wrap">
                      <Button size="sm" variant="outline" onClick={() => toggleActive(u)}>{u.is_active ? "إيقاف" : "تفعيل"}</Button>
                      <Button size="sm" variant="ghost" onClick={() => removeRoles(u.user_id, u)}>إزالة الدور</Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteAdminRecord(u)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

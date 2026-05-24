import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Save, Search } from "lucide-react";
import { toast } from "sonner";
import { DraftStatus } from "@/components/admin/DraftStatus";
import { useFormDraft } from "@/hooks/useFormDraft";

type Mod = { key: string; label: string; sort_order: number };
type AdminUser = { id: string; user_id: string; email: string; display_name: string | null };
type GrantRow = { module_key: string; can_read: boolean; can_write: boolean; can_delete: boolean };

function UserGrantsEditor({
  user,
  modules,
  onSaved,
}: {
  user: AdminUser;
  modules: Mod[];
  onSaved: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [grants, setGrants] = useState<Record<string, GrantRow>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("admin_module_grants")
        .select("module_key, can_read, can_write, can_delete")
        .eq("user_id", user.user_id);
      const map: Record<string, GrantRow> = {};
      (data ?? []).forEach((g: any) => {
        map[g.module_key] = g;
      });
      setGrants(map);
      setLoaded(true);
    })();
  }, [user.user_id]);

  const draft = useFormDraft({
    key: `roles:${user.user_id}`,
    ready: loaded,
    value: grants,
    setValue: setGrants,
  });

  const toggle = (key: string, level: "can_read" | "can_write" | "can_delete") => {
    setGrants((g) => {
      const cur = g[key] ?? { module_key: key, can_read: false, can_write: false, can_delete: false };
      const next = { ...cur, [level]: !cur[level] };
      // write/delete imply read
      if ((next.can_write || next.can_delete) && !next.can_read) next.can_read = true;
      return { ...g, [key]: next };
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      await supabase.from("admin_module_grants").delete().eq("user_id", user.user_id);
      const rows = Object.values(grants)
        .filter((g) => g.can_read || g.can_write || g.can_delete)
        .map((g) => ({ ...g, user_id: user.user_id }));
      if (rows.length) {
        const { error } = await supabase.from("admin_module_grants").insert(rows);
        if (error) throw error;
      }
      toast.success("تم حفظ الصلاحيات");
      draft.markSaved(grants);
      onSaved();
    } catch (e: any) {
      toast.error(e.message ?? "تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return (
      <div className="p-6 text-center">
        <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 bg-muted/20">
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <div className="text-sm text-muted-foreground">
          حدّد الأقسام التي يمكن لهذا المدير الوصول إليها وأنواع العمليات المسموحة. الأقسام التي لا تُختار لن تظهر له في القائمة الجانبية.
        </div>
        <div className="flex items-center gap-2">
          <DraftStatus state={draft.state} />
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            حفظ الصلاحيات
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead className="bg-background">
            <tr className="text-right">
              <th className="p-2">القسم</th>
              <th className="p-2 w-20 text-center">قراءة</th>
              <th className="p-2 w-20 text-center">تعديل</th>
              <th className="p-2 w-20 text-center">حذف</th>
            </tr>
          </thead>
          <tbody>
            {modules.map((m) => {
              const g = grants[m.key];
              return (
                <tr key={m.key} className="border-t">
                  <td className="p-2">{m.label}</td>
                  <td className="p-2 text-center">
                    <Checkbox checked={!!g?.can_read} onCheckedChange={() => toggle(m.key, "can_read")} />
                  </td>
                  <td className="p-2 text-center">
                    <Checkbox checked={!!g?.can_write} onCheckedChange={() => toggle(m.key, "can_write")} />
                  </td>
                  <td className="p-2 text-center">
                    <Checkbox checked={!!g?.can_delete} onCheckedChange={() => toggle(m.key, "can_delete")} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function RolesPermissions() {
  const [modules, setModules] = useState<Mod[]>([]);
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const load = async () => {
    const { data: mods } = await supabase
      .from("admin_modules")
      .select("key,label,sort_order")
      .order("sort_order");
    setModules((mods ?? []) as Mod[]);
    const { data: au } = await supabase
      .from("admin_users")
      .select("id,user_id,email,display_name")
      .order("created_at", { ascending: false });
    setUsers((au ?? []) as AdminUser[]);
  };

  useEffect(() => {
    document.title = "الأدوار والصلاحيات — اتحاد علماء الأزهر";
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!users) return null;
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.email.toLowerCase().includes(q) || (u.display_name ?? "").toLowerCase().includes(q),
    );
  }, [users, search]);

  return (
    <div>
      <PageHeader
        title="الأدوار والصلاحيات"
        description="امنح كل مدير صلاحية الوصول إلى أقسام محددة فقط. المدير العام والمدير يحتفظان بالوصول الكامل دائمًا."
      />

      <Card className="p-3 mb-4">
        <div className="relative">
          <Search className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ابحث بالبريد أو الاسم"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
      </Card>

      {filtered === null ? (
        <div className="p-12 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">لا يوجد مدراء.</Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((u) => (
            <Card key={u.id} className="overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenId(openId === u.id ? null : u.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/40 text-right"
              >
                <div>
                  <div className="font-medium">{u.display_name || u.email}</div>
                  <div className="text-xs text-muted-foreground" dir="ltr">{u.email}</div>
                </div>
                <span className="text-xs text-primary">
                  {openId === u.id ? "إغلاق" : "تعديل الصلاحيات"}
                </span>
              </button>
              {openId === u.id && (
                <UserGrantsEditor user={u} modules={modules} onSaved={load} />
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

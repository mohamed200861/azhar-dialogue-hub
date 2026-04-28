import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { clearVisibilityCache, type VisibilityRow } from "@/hooks/useDynamicPages";

export default function VisibilityPage() {
  const [rows, setRows] = useState<VisibilityRow[] | null>(null);
  const [dirty, setDirty] = useState<Record<string, Partial<VisibilityRow>>>({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("site_visibility").select("*").order("type").order("display_order");
    setRows((data as VisibilityRow[]) ?? []);
  };

  useEffect(() => { load(); }, []);

  const update = (key: string, patch: Partial<VisibilityRow>) => {
    setRows((r) => (r ?? []).map((x) => (x.key === key ? { ...x, ...patch } : x)));
    setDirty((d) => ({ ...d, [key]: { ...(d[key] ?? {}), ...patch } }));
  };

  const saveAll = async () => {
    setSaving(true);
    const updates = Object.entries(dirty).map(([key, patch]) =>
      supabase.from("site_visibility").update(patch).eq("key", key)
    );
    const results = await Promise.all(updates);
    const err = results.find((r) => r.error)?.error;
    setSaving(false);
    if (err) return toast.error(err.message);
    setDirty({});
    clearVisibilityCache();
    toast.success("تم حفظ التغييرات");
  };

  if (rows === null) return <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;

  const pages = rows.filter((r) => r.type === "page");
  const sections = rows.filter((r) => r.type === "section");

  const Table = ({ title, items, withNav }: { title: string; items: VisibilityRow[]; withNav: boolean }) => (
    <Card className="overflow-hidden mb-6">
      <div className="p-4 border-b bg-muted/40 font-semibold">{title}</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-right">
            <tr>
              <th className="p-3 font-semibold">العنصر</th>
              <th className="p-3 font-semibold w-24">الترتيب</th>
              <th className="p-3 font-semibold w-24">مرئي</th>
              {withNav && <>
                <th className="p-3 font-semibold w-32">في القائمة</th>
                <th className="p-3 font-semibold w-32">في الفوتر</th>
              </>}
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.key} className="border-t hover:bg-muted/20">
                <td className="p-3">{r.label}</td>
                <td className="p-3"><Input type="number" className="w-20" value={r.display_order} onChange={(e) => update(r.key, { display_order: Number(e.target.value) || 0 })} /></td>
                <td className="p-3"><Switch checked={r.is_visible} onCheckedChange={(v) => update(r.key, { is_visible: v })} /></td>
                {withNav && <>
                  <td className="p-3"><Switch checked={r.show_in_header} onCheckedChange={(v) => update(r.key, { show_in_header: v })} /></td>
                  <td className="p-3"><Switch checked={r.show_in_footer} onCheckedChange={(v) => update(r.key, { show_in_footer: v })} /></td>
                </>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );

  return (
    <div>
      <PageHeader
        title="إظهار وإخفاء الصفحات"
        description="تحكم بظهور الصفحات في القائمة والفوتر، وأقسام الصفحة الرئيسية."
        actions={<Button onClick={saveAll} disabled={saving || !Object.keys(dirty).length}><Save className="h-4 w-4" /> حفظ التغييرات</Button>}
      />
      <Table title="الصفحات العامة" items={pages} withNav />
      <Table title="أقسام الصفحة الرئيسية" items={sections} withNav={false} />
    </div>
  );
}

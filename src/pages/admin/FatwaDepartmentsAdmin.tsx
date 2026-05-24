import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useFormDraft } from "@/hooks/useFormDraft";
import { DraftStatus } from "@/components/admin/DraftStatus";

type Dept = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  display_order: number;
};

const empty: Omit<Dept, "id"> = {
  title: "",
  slug: "",
  description: "",
  icon: "",
  is_active: true,
  display_order: 0,
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "");
}

function DeptEditor({
  initial,
  onClose,
  onSaved,
}: {
  initial: Dept | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<any>(initial ?? empty);
  const [saving, setSaving] = useState(false);
  const draft = useFormDraft({
    key: `fatwa-dept:${initial?.id ?? "new"}`,
    ready: true,
    value: form,
    setValue: setForm,
  });

  const save = async () => {
    if (!form.title?.trim()) return toast.error("العنوان مطلوب");
    const slug = form.slug?.trim() || slugify(form.title);
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        slug,
        description: form.description?.trim() || null,
        icon: form.icon?.trim() || null,
        is_active: !!form.is_active,
        display_order: Number(form.display_order) || 0,
      };
      const { error } = initial
        ? await supabase.from("fatwa_departments").update(payload).eq("id", initial.id)
        : await supabase.from("fatwa_departments").insert(payload);
      if (error) throw error;
      toast.success("تم الحفظ");
      draft.markSaved(form);
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold">{initial ? "تعديل قسم" : "قسم جديد"}</h3>
        <div className="flex items-center gap-2">
          <DraftStatus state={draft.state} />
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>العنوان *</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={200} />
        </div>
        <div>
          <Label>المعرّف (slug)</Label>
          <Input dir="ltr" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto" maxLength={120} />
        </div>
        <div className="md:col-span-2">
          <Label>الوصف</Label>
          <Textarea rows={3} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={1000} />
        </div>
        <div>
          <Label>أيقونة (lucide)</Label>
          <Input dir="ltr" value={form.icon ?? ""} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="Scale" />
        </div>
        <div>
          <Label>ترتيب العرض</Label>
          <Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} />
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={!!form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} id="is_active" />
          <Label htmlFor="is_active">مفعّل</Label>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          حفظ
        </Button>
      </div>
    </Card>
  );
}

export default function FatwaDepartmentsAdmin() {
  const [list, setList] = useState<Dept[] | null>(null);
  const [editing, setEditing] = useState<Dept | null>(null);
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setList(null);
    const { data } = await supabase.from("fatwa_departments").select("*").order("display_order");
    setList((data ?? []) as Dept[]);
  };
  useEffect(() => { document.title = "أقسام الفتوى — اتحاد علماء الأزهر"; load(); }, []);

  const remove = async (d: Dept) => {
    if (!confirm(`حذف القسم "${d.title}"؟`)) return;
    const { error } = await supabase.from("fatwa_departments").delete().eq("id", d.id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف");
    load();
  };

  return (
    <div>
      <PageHeader
        title="أقسام الفتوى والتحكيم"
        description="نظّم طلبات الفتوى في أقسام واضحة تظهر للزوار في صفحة الفتوى والتحكيم الشرعي."
        actions={
          <Button onClick={() => { setEditing(null); setAdding(true); }}>
            <Plus className="h-4 w-4" /> قسم جديد
          </Button>
        }
      />

      {(adding || editing) && (
        <DeptEditor
          initial={editing}
          onClose={() => { setAdding(false); setEditing(null); }}
          onSaved={load}
        />
      )}

      {list === null ? (
        <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
      ) : list.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">لا توجد أقسام بعد.</Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-muted/50 text-right">
              <tr>
                <th className="p-3">العنوان</th>
                <th className="p-3">المعرّف</th>
                <th className="p-3">الترتيب</th>
                <th className="p-3">الحالة</th>
                <th className="p-3 w-32">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {list.map((d) => (
                <tr key={d.id} className="border-t">
                  <td className="p-3 font-medium">{d.title}</td>
                  <td className="p-3 text-muted-foreground" dir="ltr">{d.slug}</td>
                  <td className="p-3">{d.display_order}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${d.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {d.is_active ? "مفعّل" : "موقوف"}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => { setAdding(false); setEditing(d); }}>تعديل</Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => remove(d)}>
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

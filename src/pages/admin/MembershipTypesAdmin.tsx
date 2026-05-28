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

type T = {
  id: string; slug: string; title_ar: string; title_en: string | null;
  description_ar: string | null; price: number; currency: string;
  is_active: boolean; sort_order: number;
};

const empty: any = { slug: "", title_ar: "", title_en: "", description_ar: "", price: 0, currency: "USD", is_active: true, sort_order: 0 };

function slugify(s: string) {
  return s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
}

function Editor({ initial, onClose, onSaved }: { initial: T | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<any>(initial ?? empty);
  const [saving, setSaving] = useState(false);
  const draft = useFormDraft({ key: `mtype:${initial?.id ?? "new"}`, ready: true, value: form, setValue: setForm });

  const save = async () => {
    if (!form.title_ar?.trim()) return toast.error("العنوان مطلوب");
    const slug = form.slug?.trim() || slugify(form.title_en || form.title_ar);
    setSaving(true);
    try {
      const payload = {
        slug, title_ar: form.title_ar.trim(), title_en: form.title_en?.trim() || null,
        description_ar: form.description_ar?.trim() || null, price: Number(form.price) || 0,
        currency: form.currency || "USD", is_active: !!form.is_active, sort_order: Number(form.sort_order) || 0,
      };
      const { error } = initial
        ? await supabase.from("membership_types").update(payload).eq("id", initial.id)
        : await supabase.from("membership_types").insert(payload);
      if (error) throw error;
      toast.success("تم الحفظ"); draft.markSaved(form); onSaved(); onClose();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  return (
    <Card className="p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold">{initial ? "تعديل نوع عضوية" : "نوع جديد"}</h3>
        <div className="flex items-center gap-2"><DraftStatus state={draft.state} /><Button size="sm" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button></div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div><Label>العنوان بالعربية *</Label><Input value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} maxLength={200} /></div>
        <div><Label>العنوان بالإنجليزية</Label><Input dir="ltr" value={form.title_en ?? ""} onChange={(e) => setForm({ ...form, title_en: e.target.value })} maxLength={200} /></div>
        <div><Label>المعرّف (slug)</Label><Input dir="ltr" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto" /></div>
        <div><Label>السعر</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
        <div><Label>العملة</Label><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} maxLength={6} /></div>
        <div><Label>ترتيب العرض</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></div>
        <div className="md:col-span-2"><Label>الوصف</Label><Textarea rows={3} value={form.description_ar ?? ""} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} maxLength={2000} /></div>
        <div className="flex items-center gap-3"><Switch checked={!!form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} id="ia" /><Label htmlFor="ia">مفعّل</Label></div>
      </div>
      <div className="mt-4 flex justify-end"><Button onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} حفظ</Button></div>
    </Card>
  );
}

export default function MembershipTypesAdmin() {
  const [list, setList] = useState<T[] | null>(null);
  const [editing, setEditing] = useState<T | null>(null);
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setList(null);
    const { data } = await supabase.from("membership_types").select("*").order("sort_order");
    setList((data ?? []) as T[]);
  };
  useEffect(() => { document.title = "أنواع العضوية"; load(); }, []);

  const remove = async (t: T) => {
    if (!confirm(`حذف "${t.title_ar}"؟`)) return;
    const { error } = await supabase.from("membership_types").delete().eq("id", t.id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف"); load();
  };

  return (
    <div>
      <PageHeader title="أنواع العضوية" description="إدارة الأنواع المتاحة (فردية، علمية، مؤسسية، …)." actions={<Button onClick={() => { setEditing(null); setAdding(true); }}><Plus className="h-4 w-4" /> نوع جديد</Button>} />
      {(adding || editing) && <Editor initial={editing} onClose={() => { setAdding(false); setEditing(null); }} onSaved={load} />}
      {list === null ? <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
        : list.length === 0 ? <Card className="p-12 text-center text-muted-foreground">لا توجد أنواع.</Card>
        : <Card className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
            <thead className="bg-muted/50 text-right"><tr><th className="p-3">العنوان</th><th className="p-3">السعر</th><th className="p-3">الترتيب</th><th className="p-3">الحالة</th><th className="p-3 w-32">إجراءات</th></tr></thead>
            <tbody>{list.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="p-3 font-medium">{t.title_ar}</td>
                <td className="p-3">{t.price} {t.currency}</td>
                <td className="p-3">{t.sort_order}</td>
                <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${t.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{t.is_active ? "مفعّل" : "موقوف"}</span></td>
                <td className="p-3"><div className="flex gap-1"><Button size="sm" variant="outline" onClick={() => { setAdding(false); setEditing(t); }}>تعديل</Button><Button size="icon" variant="ghost" className="text-destructive" onClick={() => remove(t)}><Trash2 className="h-4 w-4" /></Button></div></td>
              </tr>
            ))}</tbody>
          </table></Card>}
    </div>
  );
}

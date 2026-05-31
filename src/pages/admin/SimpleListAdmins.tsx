// Generic admin CRUD for simple tables: quran_categories, quran_teachers, khutbah_categories, khutbah_speakers.
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
import { FileUploadField } from "@/components/admin/FileUploadField";
import { slugify, sanitizeSlug } from "@/lib/admin-utils";

type Field = { key: string; label: string; type?: "text" | "textarea" | "image" | "number" };
type Cfg = { title: string; table: string; nameField: string; extraFields: Field[]; draftPrefix: string };

export function SimpleListEditor({ cfg }: { cfg: Cfg }) {
  const [list, setList] = useState<any[] | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setList(null);
    const { data } = await (supabase as any).from(cfg.table).select("*").order("sort_order").order("created_at", { ascending: false });
    setList(data ?? []);
  };
  useEffect(() => { document.title = cfg.title; load(); }, [cfg.table]);

  const remove = async (row: any) => {
    if (!confirm(`حذف "${row[cfg.nameField]}"؟`)) return;
    const { error } = await (supabase as any).from(cfg.table).delete().eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف"); load();
  };

  return (
    <div>
      <PageHeader title={cfg.title} actions={<Button onClick={() => { setEditing(null); setAdding(true); }}><Plus className="h-4 w-4" /> جديد</Button>} />
      {(adding || editing) && (
        <Inline cfg={cfg} initial={editing} onClose={() => { setAdding(false); setEditing(null); }} onSaved={load} />
      )}
      {list === null ? <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
        : list.length === 0 ? <Card className="p-12 text-center text-muted-foreground">لا توجد عناصر.</Card>
        : <Card className="overflow-x-auto"><table className="w-full text-sm">
            <thead className="bg-muted/50 text-right"><tr><th className="p-3">العنوان</th><th className="p-3">الترتيب</th><th className="p-3">الحالة</th><th className="p-3 w-32">إجراءات</th></tr></thead>
            <tbody>{list.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3 font-medium">{r[cfg.nameField]}</td>
                <td className="p-3">{r.sort_order ?? 0}</td>
                <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${r.is_active ? "bg-primary/10 text-primary" : "bg-muted"}`}>{r.is_active ? "مفعّل" : "موقوف"}</span></td>
                <td className="p-3"><div className="flex gap-1"><Button size="sm" variant="outline" onClick={() => { setAdding(false); setEditing(r); }}>تعديل</Button><Button size="icon" variant="ghost" className="text-destructive" onClick={() => remove(r)}><Trash2 className="h-4 w-4" /></Button></div></td>
              </tr>
            ))}</tbody>
          </table></Card>}
    </div>
  );
}

function Inline({ cfg, initial, onClose, onSaved }: { cfg: Cfg; initial: any | null; onClose: () => void; onSaved: () => void }) {
  const defaults: any = { [cfg.nameField]: "", slug: "", is_active: true, sort_order: 0 };
  cfg.extraFields.forEach((f) => { defaults[f.key] = f.type === "number" ? 0 : ""; });
  const [form, setForm] = useState<any>(initial ?? defaults);
  const [saving, setSaving] = useState(false);
  const draft = useFormDraft({ key: `${cfg.draftPrefix}:${initial?.id ?? "new"}`, ready: true, value: form, setValue: setForm });

  const save = async () => {
    if (!form[cfg.nameField]?.toString().trim()) return toast.error("العنوان مطلوب");
    setSaving(true);
    const payload: any = { ...form };
    if ("slug" in payload) payload.slug = payload.slug?.trim() || slugify(form[cfg.nameField]);
    if ("sort_order" in payload) payload.sort_order = Number(payload.sort_order) || 0;
    const { error } = initial
      ? await (supabase as any).from(cfg.table).update(payload).eq("id", initial.id)
      : await (supabase as any).from(cfg.table).insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("تم الحفظ"); draft.markSaved(form); onSaved(); onClose();
  };

  return (
    <Card className="p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold">{initial ? "تعديل" : "جديد"}</h3>
        <div className="flex items-center gap-2"><DraftStatus state={draft.state} /><Button size="sm" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button></div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div><Label>{cfg.nameField === "name" ? "الاسم" : "العنوان"} *</Label><Input value={form[cfg.nameField] ?? ""} onChange={(e) => setForm({ ...form, [cfg.nameField]: e.target.value })} maxLength={200} /></div>
        {"slug" in defaults && <div><Label>المعرّف (slug)</Label><Input dir="ltr" value={form.slug ?? ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto" /></div>}
        {cfg.extraFields.map((f) => (
          <div key={f.key} className={f.type === "textarea" ? "md:col-span-2" : ""}>
            <Label>{f.label}</Label>
            {f.type === "textarea"
              ? <Textarea rows={3} value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} maxLength={4000} />
              : <Input type={f.type === "number" ? "number" : "text"} dir={f.type === "image" ? "ltr" : undefined} value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />}
          </div>
        ))}
        <div><Label>ترتيب العرض</Label><Input type="number" value={form.sort_order ?? 0} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></div>
        <div className="flex items-center gap-3"><Switch checked={!!form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} id="ia" /><Label htmlFor="ia">مفعّل</Label></div>
      </div>
      <div className="mt-4 flex justify-end"><Button onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} حفظ</Button></div>
    </Card>
  );
}

// Concrete pages
export function QuranCategoriesAdmin() { return <SimpleListEditor cfg={{ title: "تصنيفات القرآن", table: "quran_categories", nameField: "title", draftPrefix: "qcat", extraFields: [{ key: "description", label: "الوصف", type: "textarea" }] }} />; }
export function QuranTeachersAdmin() { return <SimpleListEditor cfg={{ title: "معلمو القرآن", table: "quran_teachers", nameField: "name", draftPrefix: "qteacher", extraFields: [{ key: "bio", label: "نبذة", type: "textarea" }, { key: "photo_url", label: "رابط الصورة", type: "image" }] }} />; }
export function KhutbahCategoriesAdmin() { return <SimpleListEditor cfg={{ title: "تصنيفات الخطب", table: "khutbah_categories", nameField: "title", draftPrefix: "kcat", extraFields: [{ key: "description", label: "الوصف", type: "textarea" }] }} />; }
export function KhutbahSpeakersAdmin() { return <SimpleListEditor cfg={{ title: "الخطباء", table: "khutbah_speakers", nameField: "name", draftPrefix: "kspeaker", extraFields: [{ key: "biography", label: "السيرة", type: "textarea" }, { key: "photo_url", label: "رابط الصورة", type: "image" }] }} />; }

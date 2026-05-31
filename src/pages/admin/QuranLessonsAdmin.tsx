import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useFormDraft } from "@/hooks/useFormDraft";
import { DraftStatus } from "@/components/admin/DraftStatus";
import { FileUploadField } from "@/components/admin/FileUploadField";
import { slugify, sanitizeSlug } from "@/lib/admin-utils";

type L = any;
const empty: any = { slug: "", title: "", description: "", thumbnail: "", video_url: "", audio_url: "", pdf_url: "", text_content: "", category_id: "", teacher_id: "", duration: "", publish_status: "draft", is_featured: false, sort_order: 0 };

function Editor({ initial, cats, teachers, onClose, onSaved }: { initial: L | null; cats: any[]; teachers: any[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<any>(initial ?? empty);
  const [saving, setSaving] = useState(false);
  const draft = useFormDraft({ key: `qlesson:${initial?.id ?? "new"}`, ready: true, value: form, setValue: setForm });

  const save = async () => {
    if (!form.title?.trim()) return toast.error("العنوان مطلوب");
    setSaving(true);
    const payload: any = {
      ...form,
      slug: sanitizeSlug(form.slug) || slugify(form.title),
      category_id: form.category_id || null, teacher_id: form.teacher_id || null,
      sort_order: Number(form.sort_order) || 0,
      published_at: form.publish_status === "published" ? (initial?.published_at ?? new Date().toISOString()) : null,
    };
    const { error } = initial
      ? await supabase.from("quran_lessons").update(payload).eq("id", initial.id)
      : await supabase.from("quran_lessons").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("تم الحفظ"); draft.markSaved(form); onSaved(); onClose();
  };

  return (
    <Card className="p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold">{initial ? "تعديل درس" : "درس جديد"}</h3>
        <div className="flex items-center gap-2"><DraftStatus state={draft.state} /><Button size="sm" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button></div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2"><Label>العنوان *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div><Label>المعرّف (slug)</Label><Input dir="ltr" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto" /></div>
        <div><Label>المدة</Label><Input value={form.duration ?? ""} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="مثلاً 35 دقيقة" /></div>
        <div><Label>التصنيف</Label>
          <Select value={form.category_id || ""} onValueChange={(v) => setForm({ ...form, category_id: v })}>
            <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
            <SelectContent>{cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>المعلم</Label>
          <Select value={form.teacher_id || ""} onValueChange={(v) => setForm({ ...form, teacher_id: v })}>
            <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
            <SelectContent>{teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2"><Label>الوصف</Label><Textarea rows={3} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div><Label>صورة مصغرة (URL)</Label><Input dir="ltr" value={form.thumbnail ?? ""} onChange={(e) => setForm({ ...form, thumbnail: e.target.value })} /></div>
        <div><Label>رابط الفيديو</Label><Input dir="ltr" value={form.video_url ?? ""} onChange={(e) => setForm({ ...form, video_url: e.target.value })} /></div>
        <div><Label>رابط الصوت</Label><Input dir="ltr" value={form.audio_url ?? ""} onChange={(e) => setForm({ ...form, audio_url: e.target.value })} /></div>
        <div><Label>رابط PDF</Label><Input dir="ltr" value={form.pdf_url ?? ""} onChange={(e) => setForm({ ...form, pdf_url: e.target.value })} /></div>
        <div className="md:col-span-2"><Label>نص الدرس (HTML)</Label><Textarea rows={5} value={form.text_content ?? ""} onChange={(e) => setForm({ ...form, text_content: e.target.value })} /></div>
        <div><Label>حالة النشر</Label>
          <Select value={form.publish_status} onValueChange={(v) => setForm({ ...form, publish_status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="draft">مسودة</SelectItem><SelectItem value="published">منشور</SelectItem><SelectItem value="archived">مؤرشف</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label>ترتيب</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></div>
        <div className="flex items-center gap-3"><Switch checked={!!form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} id="ft" /><Label htmlFor="ft">مميّز</Label></div>
      </div>
      <div className="mt-4 flex justify-end"><Button onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} حفظ</Button></div>
    </Card>
  );
}

export default function QuranLessonsAdmin() {
  const [list, setList] = useState<L[] | null>(null);
  const [cats, setCats] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [editing, setEditing] = useState<L | null>(null);
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setList(null);
    const [l, c, t] = await Promise.all([
      supabase.from("quran_lessons").select("*").order("sort_order").order("created_at", { ascending: false }),
      supabase.from("quran_categories").select("id,title").order("sort_order"),
      supabase.from("quran_teachers").select("id,name").order("sort_order"),
    ]);
    setList(l.data ?? []); setCats(c.data ?? []); setTeachers(t.data ?? []);
  };
  useEffect(() => { document.title = "دروس القرآن"; load(); }, []);

  const remove = async (r: L) => {
    if (!confirm(`حذف "${r.title}"؟`)) return;
    const { error } = await supabase.from("quran_lessons").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف"); load();
  };

  return (
    <div>
      <PageHeader title="دروس القرآن الكريم" actions={<Button onClick={() => { setEditing(null); setAdding(true); }}><Plus className="h-4 w-4" /> درس جديد</Button>} />
      {(adding || editing) && <Editor initial={editing} cats={cats} teachers={teachers} onClose={() => { setAdding(false); setEditing(null); }} onSaved={load} />}
      {list === null ? <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
        : list.length === 0 ? <Card className="p-12 text-center text-muted-foreground">لا توجد دروس.</Card>
        : <Card className="overflow-x-auto"><table className="w-full text-sm">
            <thead className="bg-muted/50 text-right"><tr><th className="p-3">العنوان</th><th className="p-3">الحالة</th><th className="p-3">مميّز</th><th className="p-3 w-32">إجراءات</th></tr></thead>
            <tbody>{list.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3 font-medium">{r.title}</td>
                <td className="p-3"><span className="text-xs px-2 py-0.5 rounded-full bg-muted">{r.publish_status}</span></td>
                <td className="p-3">{r.is_featured ? "★" : "—"}</td>
                <td className="p-3"><div className="flex gap-1"><Button size="sm" variant="outline" onClick={() => { setAdding(false); setEditing(r); }}>تعديل</Button><Button size="icon" variant="ghost" className="text-destructive" onClick={() => remove(r)}><Trash2 className="h-4 w-4" /></Button></div></td>
              </tr>
            ))}</tbody>
          </table></Card>}
    </div>
  );
}

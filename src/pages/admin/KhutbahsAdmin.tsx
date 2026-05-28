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

function slugify(s: string) { return s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, ""); }

const empty: any = { slug: "", title: "", description: "", speaker_id: "", speaker_name: "", mosque: "", location: "", category_id: "", khutbah_date: "", audio_url: "", video_url: "", transcript: "", featured_image: "", publish_status: "draft", is_featured: false };

function Editor({ initial, cats, speakers, onClose, onSaved }: { initial: any | null; cats: any[]; speakers: any[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<any>(initial ?? empty);
  const [saving, setSaving] = useState(false);
  const draft = useFormDraft({ key: `khutbah:${initial?.id ?? "new"}`, ready: true, value: form, setValue: setForm });

  const save = async () => {
    if (!form.title?.trim()) return toast.error("العنوان مطلوب");
    setSaving(true);
    const payload: any = {
      ...form,
      slug: form.slug?.trim() || slugify(form.title),
      category_id: form.category_id || null, speaker_id: form.speaker_id || null,
      khutbah_date: form.khutbah_date || null,
      published_at: form.publish_status === "published" ? (initial?.published_at ?? new Date().toISOString()) : null,
    };
    const { error } = initial
      ? await supabase.from("khutbahs").update(payload).eq("id", initial.id)
      : await supabase.from("khutbahs").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("تم الحفظ"); draft.markSaved(form); onSaved(); onClose();
  };

  return (
    <Card className="p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold">{initial ? "تعديل خطبة" : "خطبة جديدة"}</h3>
        <div className="flex items-center gap-2"><DraftStatus state={draft.state} /><Button size="sm" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button></div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2"><Label>العنوان *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div><Label>المعرّف (slug)</Label><Input dir="ltr" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto" /></div>
        <div><Label>التاريخ</Label><Input type="date" value={form.khutbah_date ?? ""} onChange={(e) => setForm({ ...form, khutbah_date: e.target.value })} /></div>
        <div><Label>التصنيف</Label>
          <Select value={form.category_id || ""} onValueChange={(v) => setForm({ ...form, category_id: v })}>
            <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
            <SelectContent>{cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>الخطيب</Label>
          <Select value={form.speaker_id || ""} onValueChange={(v) => { const sp = speakers.find((x) => x.id === v); setForm({ ...form, speaker_id: v, speaker_name: sp?.name ?? form.speaker_name }); }}>
            <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
            <SelectContent>{speakers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>اسم الخطيب (نصي)</Label><Input value={form.speaker_name ?? ""} onChange={(e) => setForm({ ...form, speaker_name: e.target.value })} /></div>
        <div><Label>المسجد</Label><Input value={form.mosque ?? ""} onChange={(e) => setForm({ ...form, mosque: e.target.value })} /></div>
        <div><Label>المكان</Label><Input value={form.location ?? ""} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
        <div><Label>الصورة (URL)</Label><Input dir="ltr" value={form.featured_image ?? ""} onChange={(e) => setForm({ ...form, featured_image: e.target.value })} /></div>
        <div><Label>رابط الفيديو</Label><Input dir="ltr" value={form.video_url ?? ""} onChange={(e) => setForm({ ...form, video_url: e.target.value })} /></div>
        <div><Label>رابط الصوت</Label><Input dir="ltr" value={form.audio_url ?? ""} onChange={(e) => setForm({ ...form, audio_url: e.target.value })} /></div>
        <div className="md:col-span-2"><Label>الوصف</Label><Textarea rows={3} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="md:col-span-2"><Label>نص الخطبة</Label><Textarea rows={8} value={form.transcript ?? ""} onChange={(e) => setForm({ ...form, transcript: e.target.value })} /></div>
        <div><Label>حالة النشر</Label>
          <Select value={form.publish_status} onValueChange={(v) => setForm({ ...form, publish_status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="draft">مسودة</SelectItem><SelectItem value="published">منشور</SelectItem><SelectItem value="archived">مؤرشف</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3"><Switch checked={!!form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} id="ft2" /><Label htmlFor="ft2">مميّزة</Label></div>
      </div>
      <div className="mt-4 flex justify-end"><Button onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} حفظ</Button></div>
    </Card>
  );
}

export default function KhutbahsAdmin() {
  const [list, setList] = useState<any[] | null>(null);
  const [cats, setCats] = useState<any[]>([]);
  const [speakers, setSpeakers] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setList(null);
    const [k, c, s] = await Promise.all([
      supabase.from("khutbahs").select("*").order("khutbah_date", { ascending: false, nullsFirst: false }),
      supabase.from("khutbah_categories").select("id,title").order("sort_order"),
      supabase.from("khutbah_speakers").select("id,name").order("sort_order"),
    ]);
    setList(k.data ?? []); setCats(c.data ?? []); setSpeakers(s.data ?? []);
  };
  useEffect(() => { document.title = "الخطب"; load(); }, []);

  const remove = async (r: any) => {
    if (!confirm(`حذف "${r.title}"؟`)) return;
    const { error } = await supabase.from("khutbahs").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف"); load();
  };

  return (
    <div>
      <PageHeader title="الخطب والخطباء" actions={<Button onClick={() => { setEditing(null); setAdding(true); }}><Plus className="h-4 w-4" /> خطبة جديدة</Button>} />
      {(adding || editing) && <Editor initial={editing} cats={cats} speakers={speakers} onClose={() => { setAdding(false); setEditing(null); }} onSaved={load} />}
      {list === null ? <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
        : list.length === 0 ? <Card className="p-12 text-center text-muted-foreground">لا توجد خطب.</Card>
        : <Card className="overflow-x-auto"><table className="w-full text-sm">
            <thead className="bg-muted/50 text-right"><tr><th className="p-3">العنوان</th><th className="p-3">الخطيب</th><th className="p-3">التاريخ</th><th className="p-3">الحالة</th><th className="p-3 w-32">إجراءات</th></tr></thead>
            <tbody>{list.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3 font-medium">{r.title}</td>
                <td className="p-3">{r.speaker_name ?? "—"}</td>
                <td className="p-3">{r.khutbah_date ?? "—"}</td>
                <td className="p-3"><span className="text-xs px-2 py-0.5 rounded-full bg-muted">{r.publish_status}</span></td>
                <td className="p-3"><div className="flex gap-1"><Button size="sm" variant="outline" onClick={() => { setAdding(false); setEditing(r); }}>تعديل</Button><Button size="icon" variant="ghost" className="text-destructive" onClick={() => remove(r)}><Trash2 className="h-4 w-4" /></Button></div></td>
              </tr>
            ))}</tbody>
          </table></Card>}
    </div>
  );
}

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

type M = { id: string; provider_key: string; title: string; description: string | null; instructions: string | null; is_enabled: boolean; sort_order: number };
const empty: any = { provider_key: "manual", title: "", description: "", instructions: "", is_enabled: true, sort_order: 0 };

function Editor({ initial, onClose, onSaved }: { initial: M | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<any>(initial ?? empty);
  const [saving, setSaving] = useState(false);
  const draft = useFormDraft({ key: `mmethod:${initial?.id ?? "new"}`, ready: true, value: form, setValue: setForm });
  const save = async () => {
    if (!form.title?.trim()) return toast.error("العنوان مطلوب");
    setSaving(true);
    const payload = { provider_key: form.provider_key, title: form.title.trim(), description: form.description || null, instructions: form.instructions || null, is_enabled: !!form.is_enabled, sort_order: Number(form.sort_order) || 0 };
    const { error } = initial
      ? await supabase.from("membership_payment_methods").update(payload).eq("id", initial.id)
      : await supabase.from("membership_payment_methods").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("تم الحفظ"); draft.markSaved(form); onSaved(); onClose();
  };
  return (
    <Card className="p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold">{initial ? "تعديل وسيلة دفع" : "وسيلة دفع جديدة"}</h3>
        <div className="flex items-center gap-2"><DraftStatus state={draft.state} /><Button size="sm" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button></div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div><Label>المزوّد</Label><Input dir="ltr" value={form.provider_key} onChange={(e) => setForm({ ...form, provider_key: e.target.value })} placeholder="manual / bank / stripe / paypal" /></div>
        <div><Label>العنوان</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={200} /></div>
        <div className="md:col-span-2"><Label>الوصف</Label><Textarea rows={2} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="md:col-span-2"><Label>تعليمات الدفع</Label><Textarea rows={4} value={form.instructions ?? ""} onChange={(e) => setForm({ ...form, instructions: e.target.value })} /></div>
        <div><Label>الترتيب</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></div>
        <div className="flex items-center gap-3"><Switch checked={!!form.is_enabled} onCheckedChange={(v) => setForm({ ...form, is_enabled: v })} id="en" /><Label htmlFor="en">مفعّل</Label></div>
      </div>
      <div className="mt-4 flex justify-end"><Button onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} حفظ</Button></div>
    </Card>
  );
}

export default function MembershipMethodsAdmin() {
  const [list, setList] = useState<M[] | null>(null);
  const [editing, setEditing] = useState<M | null>(null);
  const [adding, setAdding] = useState(false);
  const load = async () => { setList(null); const { data } = await supabase.from("membership_payment_methods").select("*").order("sort_order"); setList((data ?? []) as M[]); };
  useEffect(() => { document.title = "وسائل دفع العضوية"; load(); }, []);
  const remove = async (m: M) => { if (!confirm(`حذف "${m.title}"؟`)) return; const { error } = await supabase.from("membership_payment_methods").delete().eq("id", m.id); if (error) return toast.error(error.message); toast.success("تم الحذف"); load(); };
  return (
    <div>
      <PageHeader title="وسائل دفع العضوية" description="إدارة طرق الدفع المتاحة." actions={<Button onClick={() => { setEditing(null); setAdding(true); }}><Plus className="h-4 w-4" /> وسيلة جديدة</Button>} />
      {(adding || editing) && <Editor initial={editing} onClose={() => { setAdding(false); setEditing(null); }} onSaved={load} />}
      {list === null ? <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
        : list.length === 0 ? <Card className="p-12 text-center text-muted-foreground">لا توجد وسائل دفع.</Card>
        : <Card className="overflow-x-auto"><table className="w-full text-sm">
            <thead className="bg-muted/50 text-right"><tr><th className="p-3">العنوان</th><th className="p-3">المزوّد</th><th className="p-3">الحالة</th><th className="p-3 w-32">إجراءات</th></tr></thead>
            <tbody>{list.map((m) => (
              <tr key={m.id} className="border-t">
                <td className="p-3 font-medium">{m.title}</td>
                <td className="p-3" dir="ltr">{m.provider_key}</td>
                <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${m.is_enabled ? "bg-primary/10 text-primary" : "bg-muted"}`}>{m.is_enabled ? "مفعّل" : "موقوف"}</span></td>
                <td className="p-3"><div className="flex gap-1"><Button size="sm" variant="outline" onClick={() => { setAdding(false); setEditing(m); }}>تعديل</Button><Button size="icon" variant="ghost" className="text-destructive" onClick={() => remove(m)}><Trash2 className="h-4 w-4" /></Button></div></td>
              </tr>
            ))}</tbody>
          </table></Card>}
    </div>
  );
}

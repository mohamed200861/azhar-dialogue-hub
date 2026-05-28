import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useFormDraft } from "@/hooks/useFormDraft";
import { DraftStatus } from "@/components/admin/DraftStatus";

const STATUSES = ["new","under_review","approved","rejected","payment_pending","completed"] as const;

export default function MembershipApplicationsAdmin() {
  const [list, setList] = useState<any[] | null>(null);
  const [sel, setSel] = useState<any | null>(null);
  const [form, setForm] = useState<any>({ status: "new", admin_notes: "" });
  const [saving, setSaving] = useState(false);

  const draft = useFormDraft({ key: `mapp:${sel?.id ?? "new"}`, ready: !!sel, value: form, setValue: setForm });

  const load = async () => {
    setList(null);
    const { data } = await supabase.from("membership_applications").select("*").order("created_at", { ascending: false });
    setList(data ?? []);
  };
  useEffect(() => { document.title = "طلبات العضوية"; load(); }, []);

  useEffect(() => { if (sel) setForm({ status: sel.status, admin_notes: sel.admin_notes ?? "" }); }, [sel?.id]);

  const save = async () => {
    if (!sel) return;
    setSaving(true);
    const { error } = await supabase.from("membership_applications").update({
      status: form.status, admin_notes: form.admin_notes || null,
    }).eq("id", sel.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("تم الحفظ"); draft.markSaved(form); load();
  };

  const remove = async (a: any) => {
    if (!confirm("حذف الطلب؟")) return;
    const { error } = await supabase.from("membership_applications").delete().eq("id", a.id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف"); setSel(null); load();
  };

  return (
    <div>
      <PageHeader title="طلبات العضوية" description="مراجعة طلبات الانضمام واتخاذ الإجراءات." />
      <div className="grid lg:grid-cols-[1fr,1.4fr] gap-4">
        <Card className="overflow-hidden">
          {list === null ? <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
            : list.length === 0 ? <div className="p-8 text-center text-muted-foreground text-sm">لا توجد طلبات.</div>
            : <div className="divide-y max-h-[70vh] overflow-y-auto">
                {list.map((a) => (
                  <button key={a.id} onClick={() => setSel(a)} className={`w-full text-right p-3 hover:bg-muted ${sel?.id === a.id ? "bg-muted" : ""}`}>
                    <div className="font-bold text-sm">{a.full_name_ar}</div>
                    <div className="text-xs text-muted-foreground" dir="ltr">{a.email}</div>
                    <div className="text-xs text-muted-foreground mt-1">{new Date(a.created_at).toLocaleDateString("ar-EG")} — <span className="text-primary">{a.status}</span></div>
                  </button>
                ))}
              </div>}
        </Card>

        {sel ? (
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">{sel.full_name_ar}</h3>
              <div className="flex items-center gap-2"><DraftStatus state={draft.state} /><Button size="icon" variant="ghost" className="text-destructive" onClick={() => remove(sel)}><Trash2 className="h-4 w-4" /></Button></div>
            </div>
            <div className="grid md:grid-cols-2 gap-3 text-sm mb-4">
              <div><strong>البريد:</strong> <span dir="ltr">{sel.email}</span></div>
              <div><strong>الهاتف:</strong> <span dir="ltr">{sel.phone ?? sel.mobile ?? "—"}</span></div>
              <div><strong>الدولة:</strong> {sel.residence_country ?? "—"}</div>
              <div><strong>الجنسية:</strong> {sel.citizenship ?? "—"}</div>
              <div><strong>التخصص:</strong> {sel.academic_specialization ?? "—"}</div>
              <div><strong>الوظيفة:</strong> {sel.job_title ?? "—"}</div>
              {sel.cv_url && <div><strong>السيرة الذاتية:</strong> <a href={`https://jqyioadvwldtiszmpmlt.supabase.co/storage/v1/object/authenticated/membership-attachments/${sel.cv_url}`} target="_blank" rel="noreferrer" className="text-primary">عرض</a></div>}
              {sel.personal_photo_url && <div><strong>الصورة:</strong> <a href={`https://jqyioadvwldtiszmpmlt.supabase.co/storage/v1/object/authenticated/membership-attachments/${sel.personal_photo_url}`} target="_blank" rel="noreferrer" className="text-primary">عرض</a></div>}
            </div>
            {sel.scientific_contributions && <div className="mb-3 p-3 bg-muted/40 rounded text-sm"><strong>الإسهامات:</strong><br />{sel.scientific_contributions}</div>}
            <div className="space-y-3 border-t pt-4">
              <div><Label>الحالة</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>ملاحظات الإدارة</Label><Textarea rows={4} value={form.admin_notes} onChange={(e) => setForm({ ...form, admin_notes: e.target.value })} maxLength={4000} /></div>
              <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} حفظ</Button>
            </div>
          </Card>
        ) : <Card className="p-12 text-center text-muted-foreground">اختر طلبًا لعرضه.</Card>}
      </div>
    </div>
  );
}

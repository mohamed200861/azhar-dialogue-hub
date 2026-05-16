import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, Plus, Trash2, Pencil, Save, X, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useFormDraft } from "@/hooks/useFormDraft";
import { DraftStatus } from "@/components/admin/DraftStatus";

const CATEGORIES = [
  { value: "general", label: "عام" },
  { value: "forms", label: "نماذج" },
  { value: "regulations", label: "لوائح" },
  { value: "guides", label: "أدلة" },
  { value: "announcements", label: "إعلانات" },
];
const STATUSES = [
  { value: "draft", label: "مسودة" },
  { value: "published", label: "منشور" },
  { value: "archived", label: "مؤرشف" },
];
const ALLOWED = ["application/pdf","image/png","image/jpeg","image/jpg","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const MAX_SIZE = 20 * 1024 * 1024;

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
}

export default function FatwaFilesAdmin() {
  const { isSuperAdmin } = useAuth();
  const [items, setItems] = useState<any[] | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const empty = { title: "", description: "", category: "general", publish_status: "published", display_order: 0, file_url: "", file_name: "", file_type: "", file_size: 0 };
  const [draft, setDraft] = useState<any>(empty);

  const load = async () => {
    const { data } = await supabase
      .from("fatwa_public_files")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const handleUpload = async (file: File) => {
    if (file.size > MAX_SIZE) { toast.error("الحد الأقصى 20 ميغابايت"); return; }
    if (!ALLOWED.includes(file.type)) { toast.error("نوع الملف غير مدعوم"); return; }
    setUploading(true);
    try {
      const path = `${crypto.randomUUID()}/${safeName(file.name)}`;
      const up = await supabase.storage.from("fatwa-public-files").upload(path, file, { contentType: file.type, upsert: false });
      if (up.error) throw up.error;
      const { data: pub } = supabase.storage.from("fatwa-public-files").getPublicUrl(up.data.path);
      setDraft((d: any) => ({ ...d, file_url: pub.publicUrl, file_name: file.name, file_type: file.type, file_size: file.size }));
      toast.success("تم رفع الملف");
    } catch (e: any) {
      toast.error(e.message || "فشل الرفع");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async () => {
    if (!draft.title.trim() || !draft.file_url) { toast.error("العنوان والملف مطلوبان"); return; }
    if (editing) {
      const { error } = await supabase.from("fatwa_public_files").update({
        title: draft.title.trim(),
        description: draft.description || null,
        category: draft.category,
        publish_status: draft.publish_status,
        display_order: Number(draft.display_order) || 0,
        file_url: draft.file_url,
        file_name: draft.file_name,
        file_type: draft.file_type,
        file_size: draft.file_size,
      }).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("تم التحديث");
    } else {
      const { error } = await supabase.from("fatwa_public_files").insert({
        title: draft.title.trim(),
        description: draft.description || null,
        category: draft.category,
        publish_status: draft.publish_status,
        display_order: Number(draft.display_order) || 0,
        file_url: draft.file_url,
        file_name: draft.file_name,
        file_type: draft.file_type,
        file_size: draft.file_size,
      });
      if (error) return toast.error(error.message);
      toast.success("تمت الإضافة");
    }
    setEditing(null); setShowNew(false); setDraft(empty); load();
  };

  const remove = async (id: string) => {
    if (!isSuperAdmin) { toast.error("الحذف يتطلب صلاحية مشرف عام"); return; }
    if (!confirm("تأكيد الحذف؟")) return;
    const { error } = await supabase.from("fatwa_public_files").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف");
    load();
  };

  const startEdit = (it: any) => { setEditing(it); setShowNew(false); setDraft({ ...it }); };
  const startNew = () => { setEditing(null); setShowNew(true); setDraft(empty); };
  const cancel = () => { setEditing(null); setShowNew(false); setDraft(empty); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ملفات الفتوى العامة</h1>
          <p className="text-sm text-muted-foreground">ملفات/وثائق عامة تُعرض في صفحة الفتوى والتحكيم الشرعي.</p>
        </div>
        {!showNew && !editing && (
          <Button onClick={startNew}><Plus className="h-4 w-4" /> إضافة ملف</Button>
        )}
      </div>

      {(showNew || editing) && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">{editing ? "تعديل ملف" : "ملف جديد"}</h2>
            <Button variant="ghost" size="sm" onClick={cancel}><X className="h-4 w-4" /></Button>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <Label>العنوان *</Label>
              <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} maxLength={300} />
            </div>
            <div className="md:col-span-2">
              <Label>الوصف</Label>
              <Textarea rows={3} value={draft.description || ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} maxLength={2000} />
            </div>
            <div>
              <Label>الفئة</Label>
              <Select value={draft.category} onValueChange={(v) => setDraft({ ...draft, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>الحالة</Label>
              <Select value={draft.publish_status} onValueChange={(v) => setDraft({ ...draft, publish_status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>ترتيب العرض</Label>
              <Input type="number" value={draft.display_order} onChange={(e) => setDraft({ ...draft, display_order: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>الملف *</Label>
              <div className="flex items-center gap-2 flex-wrap">
                <input ref={fileRef} type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
                <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {draft.file_url ? "استبدال الملف" : "رفع ملف"}
                </Button>
                {draft.file_url && (
                  <a href={draft.file_url} target="_blank" rel="noreferrer" className="text-sm text-primary inline-flex items-center gap-1">
                    <ExternalLink className="h-3.5 w-3.5" /> {draft.file_name || "عرض"}
                  </a>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">PDF / DOC / DOCX / صور — الحد الأقصى 20MB</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={save} disabled={uploading}><Save className="h-4 w-4" /> حفظ</Button>
            <Button variant="outline" onClick={cancel}>إلغاء</Button>
          </div>
        </Card>
      )}

      <Card className="p-0 overflow-hidden">
        {items === null ? (
          <div className="p-10 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">لا توجد ملفات بعد.</div>
        ) : (
          <div className="divide-y">
            {items.map((it) => (
              <div key={it.id} className="p-4 flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold">{it.title}</span>
                    <Badge variant={it.publish_status === "published" ? "default" : "secondary"}>
                      {STATUSES.find((s) => s.value === it.publish_status)?.label}
                    </Badge>
                    <Badge variant="outline">{CATEGORIES.find((c) => c.value === it.category)?.label}</Badge>
                  </div>
                  {it.description && <p className="text-xs text-muted-foreground line-clamp-1">{it.description}</p>}
                </div>
                <div className="flex gap-1">
                  {it.file_url && (
                    <Button asChild variant="ghost" size="sm"><a href={it.file_url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => startEdit(it)}><Pencil className="h-4 w-4" /></Button>
                  {isSuperAdmin && (
                    <Button variant="ghost" size="sm" onClick={() => remove(it.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

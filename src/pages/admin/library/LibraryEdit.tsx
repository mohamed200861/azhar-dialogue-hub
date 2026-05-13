import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUploadField } from "@/components/admin/FileUploadField";
import { Loader2, ArrowRight, Save } from "lucide-react";
import { toast } from "sonner";
import { slugify, sanitizeSlug, isValidUrl } from "@/lib/admin-utils";
import { useAuth } from "@/hooks/useAuth";
import { useFormDraft } from "@/hooks/useFormDraft";
import { DraftStatus } from "@/components/admin/DraftStatus";

const CATEGORIES = ["كتب","ملفات PDF","بحوث علمية","مقالات علمية","مجلات","إصدارات الاتحاد","مواد تدريبية","المرئيات","الصوتيات"];
const PUBLISHERS = ["إدارة الاتحاد","قسم النشر","المكتبة العلمية","فريق التحرير"];
const LANGS = ["العربية","الإنجليزية","الفرنسية","الإيطالية","لغات أخرى"];

export default function LibraryEdit() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({
    title: "", slug: "", description: "", category: CATEGORIES[0], cover_image: null,
    file_url: null, external_url: "", language: "العربية", pages_count: null,
    publisher_source: PUBLISHERS[0], status: "draft", is_featured: false, published_at: null,
  });

  useEffect(() => {
    if (isNew) return;
    (async () => {
      const { data, error } = await supabase.from("library_items").select("*").eq("id", id!).maybeSingle();
      if (error || !data) { toast.error("لم يتم العثور على العنصر"); navigate("/admin/library"); return; }
      setForm(data); setLoading(false);
    })();
  }, [id]);

  const save = async (publish?: boolean) => {
    if (!form.title.trim()) return toast.error("العنوان مطلوب");
    if (!isValidUrl(form.external_url)) return toast.error("يرجى إدخال رابط صحيح يبدأ بـ https://");
    setSaving(true);
    const payload: any = {
      ...form,
      slug: sanitizeSlug(form.slug) || slugify(form.title),
      created_by: form.created_by ?? user?.id ?? null,
      pages_count: form.pages_count ? Number(form.pages_count) : null,
      external_url: form.external_url?.trim() || null,
    };
    if (publish === true) { payload.status = "published"; payload.published_at = payload.published_at ?? new Date().toISOString(); }
    if (publish === false) payload.status = "draft";
    let error;
    if (isNew) {
      const { data, error: e } = await supabase.from("library_items").insert(payload).select("id").single();
      error = e; if (!e && data) navigate(`/admin/library/${data.id}`, { replace: true });
    } else {
      ({ error } = await supabase.from("library_items").update(payload).eq("id", id!));
    }
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("تم الحفظ");
  };

  if (loading) return <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;

  return (
    <div>
      <Button variant="ghost" asChild className="mb-2"><Link to="/admin/library"><ArrowRight className="h-4 w-4" /> العودة</Link></Button>
      <PageHeader
        title={isNew ? "عنصر مكتبة جديد" : "تعديل عنصر المكتبة"}
        actions={<>
          <Button variant="outline" onClick={() => save(false)} disabled={saving}><Save className="h-4 w-4" /> مسودة</Button>
          <Button onClick={() => save(true)} disabled={saving}>نشر</Button>
        </>}
      />
      <div className="grid lg:grid-cols-[1fr,320px] gap-6">
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <div><Label>العنوان *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>الرابط المختصر</Label><Input dir="ltr" className="text-left" value={form.slug ?? ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
            <div><Label>الوصف</Label><RichTextEditor value={form.description ?? ""} onChange={(html) => setForm({ ...form, description: html })} minHeight={240} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>اللغة</Label>
                <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LANGS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>عدد الصفحات</Label>
                <Input type="number" value={form.pages_count ?? ""} onChange={(e) => setForm({ ...form, pages_count: e.target.value })} />
              </div>
            </div>
            <div><Label>رابط خارجي (اختياري)</Label><Input dir="ltr" className="text-left" value={form.external_url ?? ""} onChange={(e) => setForm({ ...form, external_url: e.target.value })} /></div>
          </Card>
        </div>
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <div>
              <Label>التصنيف</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>جهة النشر</Label>
              <Select value={form.publisher_source} onValueChange={(v) => setForm({ ...form, publisher_source: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PUBLISHERS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>الحالة</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">مسودة</SelectItem>
                  <SelectItem value="published">منشور</SelectItem>
                  <SelectItem value="archived">مؤرشف</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between"><Label>مميز</Label><Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} /></div>
          </Card>
          <Card className="p-5"><FileUploadField bucket="covers" label="صورة الغلاف" value={form.cover_image} onChange={(v) => setForm({ ...form, cover_image: v })} /></Card>
          <Card className="p-5"><FileUploadField bucket="documents" preview="file" label="ملف PDF" value={form.file_url} onChange={(v) => setForm({ ...form, file_url: v })} /></Card>
        </div>
      </div>
    </div>
  );
}

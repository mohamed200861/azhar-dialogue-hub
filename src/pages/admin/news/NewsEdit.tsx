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
import { Loader2, ArrowRight, Save, Eye } from "lucide-react";
import { toast } from "sonner";
import { slugify, sanitizeSlug } from "@/lib/admin-utils";
import { useAuth } from "@/hooks/useAuth";
import { useFormDraft } from "@/hooks/useFormDraft";
import { DraftStatus } from "@/components/admin/DraftStatus";

const CATEGORIES = ["بيانات رسمية","أخبار الاتحاد","مقالات","قضايا معاصرة","تهاني وتعازي","لقاءات وحوارات","أنشطة الاتحاد"];
const PUBLISHERS = ["إدارة الاتحاد","فريق التحرير","إدارة الموقع"];

export default function NewsEdit() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    cover_image: null,
    pdf_attachment: null,
    category: CATEGORIES[1],
    publisher_source: PUBLISHERS[0],
    status: "draft",
    is_featured: false,
    seo_title: "",
    seo_description: "",
    keywords: "",
    published_at: null,
  });

  useEffect(() => {
    document.title = isNew ? "خبر جديد" : "تعديل خبر";
    if (isNew) return;
    (async () => {
      const { data, error } = await supabase.from("news_posts").select("*").eq("id", id!).maybeSingle();
      if (error || !data) {
        toast.error("لم يتم العثور على الخبر");
        navigate("/admin/news");
        return;
      }
      setForm(data);
      setLoading(false);
    })();
  }, [id]);

  const draft = useFormDraft({
    key: `news:${id ?? "new"}`,
    ready: !loading,
    value: form,
    setValue: setForm,
    isEmpty: (v: any) => !v?.title?.trim() && !v?.excerpt?.trim() && !v?.content?.trim(),
  });

  const save = async (publish?: boolean) => {
    if (!form.title.trim()) return toast.error("العنوان مطلوب");
    setSaving(true);
    const payload: any = {
      ...form,
      slug: sanitizeSlug(form.slug) || slugify(form.title),
      created_by: form.created_by ?? user?.id ?? null,
    };
    if (publish === true) {
      payload.status = "published";
      payload.published_at = payload.published_at ?? new Date().toISOString();
    } else if (publish === false) {
      payload.status = "draft";
    }
    let error;
    if (isNew) {
      const { data, error: e } = await supabase.from("news_posts").insert(payload).select("id").single();
      error = e;
      if (!e && data) {
        navigate(`/admin/news/${data.id}`, { replace: true });
      }
    } else {
      ({ error } = await supabase.from("news_posts").update(payload).eq("id", id!));
    }
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("تم الحفظ بنجاح");
    if (!isNew) {
      const { data } = await supabase.from("news_posts").select("*").eq("id", id!).maybeSingle();
      if (data) setForm(data);
    }
    draft.markSaved();
  };

  if (loading) return <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;

  return (
    <div>
      <Button variant="ghost" asChild className="mb-2"><Link to="/admin/news"><ArrowRight className="h-4 w-4" /> العودة للقائمة</Link></Button>
      <PageHeader
        title={isNew ? "خبر جديد" : "تعديل الخبر"}
        actions={
          <>
            <Button variant="outline" onClick={() => save(false)} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              حفظ كمسودة
            </Button>
            <Button onClick={() => save(true)} disabled={saving}>
              <Eye className="h-4 w-4" /> {form.status === "published" ? "تحديث المنشور" : "نشر"}
            </Button>
          </>
        }
      />

      <div className="grid lg:grid-cols-[1fr,320px] gap-6">
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <div>
              <Label>العنوان *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>الرابط المختصر</Label>
              <Input dir="ltr" className="text-left" value={form.slug ?? ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated" />
            </div>
            <div>
              <Label>الملخص</Label>
              <Textarea rows={3} value={form.excerpt ?? ""} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
            </div>
            <div>
              <Label>المحتوى</Label>
              <RichTextEditor value={form.content ?? ""} onChange={(html) => setForm({ ...form, content: html })} minHeight={320} />
              <p className="text-xs text-muted-foreground mt-1">يدعم الفقرات النصية. تفصل الفقرات بسطر فارغ.</p>
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <h3 className="font-semibold">SEO</h3>
            <div><Label>عنوان SEO</Label><Input value={form.seo_title ?? ""} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} /></div>
            <div><Label>وصف SEO</Label><Textarea rows={2} value={form.seo_description ?? ""} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} /></div>
            <div><Label>الكلمات المفتاحية</Label><Input value={form.keywords ?? ""} onChange={(e) => setForm({ ...form, keywords: e.target.value })} /></div>
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
            <div className="flex items-center justify-between">
              <Label>مميز</Label>
              <Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />
            </div>
          </Card>

          <Card className="p-5">
            <FileUploadField bucket="covers" label="صورة الغلاف" value={form.cover_image} onChange={(v) => setForm({ ...form, cover_image: v })} />
          </Card>
          <Card className="p-5">
            <FileUploadField bucket="documents" preview="file" label="ملف PDF (اختياري)" value={form.pdf_attachment} onChange={(v) => setForm({ ...form, pdf_attachment: v })} />
          </Card>
        </div>
      </div>
    </div>
  );
}

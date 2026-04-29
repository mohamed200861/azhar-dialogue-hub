import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUploadField } from "@/components/admin/FileUploadField";
import { Loader2, ArrowRight, Save, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { sanitizeSlug } from "@/lib/admin-utils";

// Section labels per page (Arabic)
const HOME_SECTION_FIELDS: { key: string; label: string; type?: "text" | "textarea" }[] = [
  { key: "hero_badge", label: "شارة الهيرو" },
  { key: "about_section_eyebrow", label: "عنوان فرعي لقسم من نحن" },
  { key: "about_section_title", label: "عنوان قسم من نحن" },
  { key: "work_areas_title", label: "عنوان قسم مجالات العمل" },
  { key: "work_areas_desc", label: "وصف قسم مجالات العمل", type: "textarea" },
  { key: "news_section_title", label: "عنوان قسم الأخبار" },
  { key: "events_section_title", label: "عنوان قسم الفعاليات" },
  { key: "library_section_title", label: "عنوان قسم المكتبة" },
  { key: "library_section_desc", label: "وصف قسم المكتبة", type: "textarea" },
  { key: "videos_section_title", label: "عنوان قسم المرئيات" },
  { key: "videos_section_desc", label: "وصف قسم المرئيات", type: "textarea" },
  { key: "partnerships_cta_title", label: "عنوان دعوة الشراكات" },
  { key: "newsletter_title", label: "عنوان النشرة البريدية" },
  { key: "newsletter_desc", label: "وصف النشرة البريدية", type: "textarea" },
];

export default function PagesEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("site_pages").select("*").eq("id", id!).maybeSingle();
      if (error || !data) { toast.error("لم يتم العثور على الصفحة"); navigate("/admin/pages"); return; }
      setForm({ ...data, sections: data.sections ?? {} });
      setLoading(false);
    })();
  }, [id]);

  const save = async () => {
    if (!form.title.trim()) return toast.error("العنوان مطلوب");
    setSaving(true);
    const payload: any = {
      title: form.title.trim(),
      subtitle: form.subtitle ?? "",
      intro: form.intro ?? "",
      cover_image: form.cover_image ?? null,
      slug: sanitizeSlug(form.slug) || form.page_key,
      content: form.content ?? "",
      seo_title: form.seo_title ?? "",
      seo_description: form.seo_description ?? "",
      status: form.status,
      sections: form.sections ?? {},
    };
    const { error } = await supabase.from("site_pages").update(payload).eq("id", id!);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("تم حفظ الصفحة. سيظهر التحديث على الموقع فورًا.");
  };

  if (loading || !form) return <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;

  const isHome = form.page_key === "home";
  const publicHref =
    form.page_key === "home" ? "/" :
    form.page_key === "about" ? "/about" :
    form.page_key === "vision" ? "/vision" :
    form.page_key === "partnerships" ? "/partnerships" :
    form.page_key === "privacy" ? "/privacy" :
    form.page_key === "terms" ? "/terms" : `/${form.slug}`;

  const setSection = (k: string, v: string) =>
    setForm({ ...form, sections: { ...(form.sections ?? {}), [k]: v } });

  return (
    <div>
      <Button variant="ghost" asChild className="mb-2"><Link to="/admin/pages"><ArrowRight className="h-4 w-4" /> العودة</Link></Button>
      <PageHeader
        title={`تعديل: ${form.title}`}
        description="التغييرات تظهر على الموقع العام فور الحفظ."
        actions={<>
          <Button asChild variant="outline" size="sm"><a href={publicHref} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /> معاينة</a></Button>
          <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} حفظ</Button>
        </>}
      />

      <div className="grid lg:grid-cols-[1fr,320px] gap-6">
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <div><Label>العنوان الرئيسي</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>العنوان الفرعي / الشعار</Label><Input value={form.subtitle ?? ""} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} /></div>
            <div><Label>المقدمة القصيرة</Label><Textarea rows={3} value={form.intro ?? ""} onChange={(e) => setForm({ ...form, intro: e.target.value })} /></div>
            {!isHome && (
              <div>
                <Label>المحتوى الأساسي</Label>
                <Textarea
                  rows={18}
                  value={form.content ?? ""}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="يدعم الفقرات. اترك سطرًا فارغًا بين كل فقرة."
                />
              </div>
            )}
          </Card>

          {isHome && (
            <Card className="p-5 space-y-4">
              <h3 className="font-semibold">عناوين أقسام الصفحة الرئيسية</h3>
              <p className="text-xs text-muted-foreground">هذه النصوص تظهر مباشرة على الصفحة الرئيسية للموقع.</p>
              {HOME_SECTION_FIELDS.map((f) => (
                <div key={f.key}>
                  <Label>{f.label}</Label>
                  {f.type === "textarea" ? (
                    <Textarea rows={3} value={form.sections?.[f.key] ?? ""} onChange={(e) => setSection(f.key, e.target.value)} />
                  ) : (
                    <Input value={form.sections?.[f.key] ?? ""} onChange={(e) => setSection(f.key, e.target.value)} />
                  )}
                </div>
              ))}
            </Card>
          )}

          <Card className="p-5 space-y-4">
            <h3 className="font-semibold">إعدادات SEO</h3>
            <div><Label>عنوان SEO</Label><Input value={form.seo_title ?? ""} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} /></div>
            <div><Label>وصف SEO</Label><Textarea rows={3} value={form.seo_description ?? ""} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} /></div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <div>
              <Label>الحالة</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">منشور</SelectItem>
                  <SelectItem value="draft">مسودة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-muted-foreground">
              الرابط العام: <span dir="ltr" className="text-foreground/80">{publicHref}</span>
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <FileUploadField bucket="covers" label="صورة الغلاف" value={form.cover_image} onChange={(v) => setForm({ ...form, cover_image: v })} />
          </Card>
        </div>
      </div>
    </div>
  );
}

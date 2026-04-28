import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowRight, Save, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { sanitizeSlug } from "@/lib/admin-utils";
import { clearVisibilityCache } from "@/hooks/useDynamicPages";

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
      setForm(data); setLoading(false);
    })();
  }, [id]);

  const save = async () => {
    if (!form.title.trim()) return toast.error("العنوان مطلوب");
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      slug: sanitizeSlug(form.slug) || form.page_key,
      content: form.content ?? "",
      seo_title: form.seo_title ?? "",
      seo_description: form.seo_description ?? "",
      status: form.status,
      show_in_header: !!form.show_in_header,
      show_in_footer: !!form.show_in_footer,
      display_order: Number(form.display_order) || 0,
    };
    const { error } = await supabase.from("site_pages").update(payload).eq("id", id!);
    setSaving(false);
    if (error) return toast.error(error.message);
    clearVisibilityCache();
    toast.success("تم حفظ الصفحة");
  };

  if (loading || !form) return <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;

  const publicHref =
    form.page_key === "about" ? "/about" :
    form.page_key === "vision" ? "/vision" :
    form.page_key === "partnerships" ? "/partnerships" :
    form.page_key === "privacy" ? "/privacy" :
    form.page_key === "terms" ? "/terms" : `/${form.slug}`;

  return (
    <div>
      <Button variant="ghost" asChild className="mb-2"><Link to="/admin/pages"><ArrowRight className="h-4 w-4" /> العودة</Link></Button>
      <PageHeader
        title={`تعديل: ${form.title}`}
        actions={<>
          <Button asChild variant="outline" size="sm"><a href={publicHref} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> معاينة</a></Button>
          <Button onClick={save} disabled={saving}><Save className="h-4 w-4" /> حفظ</Button>
        </>}
      />

      <div className="grid lg:grid-cols-[1fr,320px] gap-6">
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <div><Label>العنوان</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div>
              <Label>الرابط المختصر</Label>
              <Input dir="ltr" className="text-left" value={form.slug ?? ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </div>
            <div>
              <Label>المحتوى</Label>
              <Textarea
                rows={20}
                value={form.content ?? ""}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="اكتب المحتوى هنا. يمكن استخدام أسطر فارغة لفصل الفقرات."
              />
              <p className="text-xs text-muted-foreground mt-1">يدعم الفقرات. اترك سطرًا فارغًا بين كل فقرة.</p>
            </div>
          </Card>

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
                  <SelectItem value="draft">مخفي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between"><Label>إظهار في القائمة</Label><Switch checked={form.show_in_header} onCheckedChange={(v) => setForm({ ...form, show_in_header: v })} /></div>
            <div className="flex items-center justify-between"><Label>إظهار في الفوتر</Label><Switch checked={form.show_in_footer} onCheckedChange={(v) => setForm({ ...form, show_in_footer: v })} /></div>
            <div><Label>ترتيب الظهور</Label><Input type="number" value={form.display_order ?? 0} onChange={(e) => setForm({ ...form, display_order: e.target.value })} /></div>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FileUploadField } from "@/components/admin/FileUploadField";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [s, setS] = useState<any>({
    site_name: "اتحاد علماء الأزهر",
    site_slogan: "منهج أزهري… ورسالة عالمية",
    contact_email: "alazharscholarunion@gmail.com",
    facebook_url: "https://www.facebook.com/share/1ECiSRM9VT/",
    twitter_url: "",
    youtube_url: "",
    instagram_url: "",
    logo_url: null,
    favicon_url: null,
    footer_text: "جميع الحقوق محفوظة — اتحاد علماء الأزهر",
    seo_title: "اتحاد علماء الأزهر",
    seo_description: "اتحاد علماء الأزهر — مؤسسة إسلامية دعوية علمية غير ربحية.",
    show_news_section: true,
    show_events_section: true,
    show_library_section: true,
    show_videos_section: true,
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("site_settings").select("key,value");
      const obj: any = { ...s };
      (data ?? []).forEach((r: any) => {
        obj[r.key] = r.value?.value ?? r.value;
      });
      setS(obj);
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const upserts = Object.entries(s).map(([key, value]) => ({ key, value: { value } as any }));
    const { error } = await supabase.from("site_settings").upsert(upserts as any, { onConflict: "key" });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("تم حفظ الإعدادات");
  };

  if (loading) return <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;

  return (
    <div>
      <PageHeader title="إعدادات الموقع" description="هذه الإعدادات تظهر مباشرة على الموقع العام."
        actions={<Button onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} حفظ</Button>} />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5 space-y-4">
          <h3 className="font-semibold">المعلومات الأساسية</h3>
          <div><Label>اسم الموقع</Label><Input value={s.site_name ?? ""} onChange={(e) => setS({ ...s, site_name: e.target.value })} /></div>
          <div><Label>الشعار النصي</Label><Input value={s.site_slogan ?? ""} onChange={(e) => setS({ ...s, site_slogan: e.target.value })} /></div>
          <div><Label>البريد الإلكتروني</Label><Input dir="ltr" className="text-left" value={s.contact_email ?? ""} onChange={(e) => setS({ ...s, contact_email: e.target.value })} /></div>
          <div><Label>نص الفوتر</Label><Input value={s.footer_text ?? ""} onChange={(e) => setS({ ...s, footer_text: e.target.value })} /></div>
        </Card>

        <Card className="p-5 space-y-4">
          <h3 className="font-semibold">روابط التواصل الاجتماعي</h3>
          <div><Label>فيسبوك</Label><Input dir="ltr" className="text-left" value={s.facebook_url ?? ""} onChange={(e) => setS({ ...s, facebook_url: e.target.value })} /></div>
          <div><Label>X / تويتر</Label><Input dir="ltr" className="text-left" value={s.twitter_url ?? ""} onChange={(e) => setS({ ...s, twitter_url: e.target.value })} /></div>
          <div><Label>يوتيوب</Label><Input dir="ltr" className="text-left" value={s.youtube_url ?? ""} onChange={(e) => setS({ ...s, youtube_url: e.target.value })} /></div>
          <div><Label>إنستغرام</Label><Input dir="ltr" className="text-left" value={s.instagram_url ?? ""} onChange={(e) => setS({ ...s, instagram_url: e.target.value })} /></div>
        </Card>

        <Card className="p-5 space-y-4">
          <h3 className="font-semibold">الشعار و Favicon</h3>
          <FileUploadField bucket="images" label="الشعار" value={s.logo_url} onChange={(v) => setS({ ...s, logo_url: v })} />
          <FileUploadField bucket="images" label="Favicon" value={s.favicon_url} onChange={(v) => setS({ ...s, favicon_url: v })} />
        </Card>

        <Card className="p-5 space-y-4">
          <h3 className="font-semibold">SEO الافتراضي</h3>
          <div><Label>عنوان SEO</Label><Input value={s.seo_title ?? ""} onChange={(e) => setS({ ...s, seo_title: e.target.value })} /></div>
          <div><Label>وصف SEO</Label><Textarea rows={3} value={s.seo_description ?? ""} onChange={(e) => setS({ ...s, seo_description: e.target.value })} /></div>
        </Card>

        <Card className="p-5 space-y-3 lg:col-span-2">
          <h3 className="font-semibold mb-2">إظهار/إخفاء أقسام الصفحة الرئيسية</h3>
          {[
            ["show_news_section", "قسم الأخبار"],
            ["show_events_section", "قسم الفعاليات"],
            ["show_library_section", "قسم المكتبة"],
            ["show_videos_section", "قسم المرئيات"],
          ].map(([k, label]) => (
            <div key={k} className="flex items-center justify-between">
              <Label>{label}</Label>
              <Switch checked={!!s[k]} onCheckedChange={(v) => setS({ ...s, [k]: v })} />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

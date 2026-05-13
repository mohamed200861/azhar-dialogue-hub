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
import { Loader2, ArrowRight, Save, FlaskConical, Radio, PlayCircle, StopCircle, Copy, Calendar } from "lucide-react";
import { toast } from "sonner";
import { slugify, sanitizeSlug, getYouTubeEmbed, isValidUrl } from "@/lib/admin-utils";
import { useAuth } from "@/hooks/useAuth";
import { useFormDraft } from "@/hooks/useFormDraft";
import { DraftStatus } from "@/components/admin/DraftStatus";

const PLATFORMS = ["YouTube", "Facebook", "Zoom", "Google Meet", "Vimeo", "Other"];
const PUBLISHERS = ["إدارة الاتحاد", "القسم الإعلامي", "فريق البث", "إدارة الموقع"];

export default function LiveEdit() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [previewEmbed, setPreviewEmbed] = useState<string | null>(null);
  const [form, setForm] = useState<any>({
    title: "", slug: "", description: "", platform: "YouTube",
    live_url: "", embed_url: "", thumbnail: null,
    scheduled_at: null, expires_at: null, status: "draft", replay_url: "",
    show_on_homepage: true, show_on_videos_page: true,
    hide_from_homepage: false, hide_from_videos: false, auto_archive: true,
    notify_subscribers: false, notify_admin: false,
    publisher_source: PUBLISHERS[1], internal_notes: "",
  });

  useEffect(() => {
    if (isNew) return;
    (async () => {
      const { data, error } = await supabase.from("live_streams").select("*").eq("id", id!).maybeSingle();
      if (error || !data) { toast.error("لم يتم العثور على البث"); navigate("/admin/live"); return; }
      setForm({
        ...data,
        scheduled_at: data.scheduled_at ? new Date(data.scheduled_at).toISOString().slice(0, 16) : null,
        expires_at: (data as any).expires_at ? new Date((data as any).expires_at).toISOString().slice(0, 16) : null,
      });
      setLoading(false);
    })();
  }, [id]);

  const buildPayload = (overrides: Partial<any> = {}) => {
    const embed = form.embed_url?.trim() || (form.live_url ? getYouTubeEmbed(form.live_url) ?? "" : "");
    return {
      title: form.title.trim(),
      slug: sanitizeSlug(form.slug) || slugify(form.title),
      description: form.description ?? null,
      platform: form.platform,
      live_url: form.live_url?.trim() || null,
      embed_url: embed || null,
      thumbnail: form.thumbnail ?? null,
      scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      status: form.status,
      replay_url: form.replay_url?.trim() || null,
      show_on_homepage: !!form.show_on_homepage,
      show_on_videos_page: !!form.show_on_videos_page,
      hide_from_homepage: !!form.hide_from_homepage,
      hide_from_videos: !!form.hide_from_videos,
      auto_archive: !!form.auto_archive,
      notify_subscribers: !!form.notify_subscribers,
      notify_admin: !!form.notify_admin,
      publisher_source: form.publisher_source,
      internal_notes: form.internal_notes ?? null,
      created_by: form.created_by ?? user?.id ?? null,
      ...overrides,
    };
  };

  const save = async (overrides: Partial<any> = {}) => {
    if (!form.title.trim()) return toast.error("العنوان مطلوب");
    if (form.live_url && !isValidUrl(form.live_url)) return toast.error("يرجى إدخال رابط صحيح يبدأ بـ https://");
    if (form.embed_url && !isValidUrl(form.embed_url)) return toast.error("يرجى إدخال رابط تضمين صحيح يبدأ بـ https://");
    if (form.replay_url && !isValidUrl(form.replay_url)) return toast.error("يرجى إدخال رابط تسجيل صحيح يبدأ بـ https://");

    setSaving(true);
    const payload = buildPayload(overrides);
    let error;
    let newId = id;
    if (isNew) {
      const { data, error: e } = await supabase.from("live_streams").insert(payload).select("id").single();
      error = e;
      if (!e && data) { newId = data.id; navigate(`/admin/live/${data.id}`, { replace: true }); }
    } else {
      ({ error } = await supabase.from("live_streams").update(payload).eq("id", id!));
    }
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("تم الحفظ");
    if (overrides.status) setForm((f: any) => ({ ...f, ...overrides }));
    return newId;
  };

  const testLink = () => {
    const candidate = form.embed_url?.trim() || form.live_url?.trim();
    if (!candidate) { toast.error("يرجى إدخال رابط صحيح يبدأ بـ https://"); return; }
    if (!isValidUrl(candidate)) { toast.error("يرجى إدخال رابط صحيح يبدأ بـ https://"); return; }
    const embed = form.embed_url?.trim() || getYouTubeEmbed(form.live_url);
    if (!embed) {
      setPreviewEmbed(null);
      toast.warning("لا يمكن تضمين هذا الرابط داخل الموقع، لكن يمكن فتحه كرابط خارجي.");
      return;
    }
    setPreviewEmbed(embed);
    toast.success("تم إنشاء معاينة البث بنجاح.");
  };

  const copyPublicLink = async () => {
    const slug = form.slug || form.id;
    if (!slug) return toast.error("احفظ البث أولًا");
    const url = `${window.location.origin}/live/${slug}`;
    await navigator.clipboard.writeText(url);
    toast.success("تم نسخ رابط البث");
  };

  if (loading) return <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;

  return (
    <div>
      <Button variant="ghost" asChild className="mb-2"><Link to="/admin/live"><ArrowRight className="h-4 w-4" /> العودة</Link></Button>
      <PageHeader
        title={isNew ? "بث مباشر جديد" : "تعديل البث"}
        actions={<>
          <Button variant="outline" onClick={() => save({ status: "draft" })} disabled={saving}><Save className="h-4 w-4" /> مسودة</Button>
          <Button variant="outline" onClick={() => save({ status: "scheduled" })} disabled={saving}><Calendar className="h-4 w-4" /> جدولة</Button>
          <Button onClick={async () => { const r = await save({ status: "live", started_at: new Date().toISOString() }); if (r) toast.success("تم بدء البث بنجاح، وسيظهر الآن في الصفحة الرئيسية."); }} disabled={saving} className="bg-red-600 hover:bg-red-700"><Radio className="h-4 w-4" /> بدء البث الآن</Button>
          {form.status === "live" && (
            <Button variant="outline" onClick={() => save({ status: "completed", ended_at: new Date().toISOString() })} disabled={saving}><StopCircle className="h-4 w-4" /> إنهاء البث</Button>
          )}
        </>}
      />

      <div className="grid lg:grid-cols-[1fr,320px] gap-6">
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <div><Label>عنوان البث *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>الرابط المختصر</Label><Input dir="ltr" className="text-left" value={form.slug ?? ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="my-live-stream" /></div>
            <div><Label>وصف البث</Label><RichTextEditor value={form.description ?? ""} onChange={(html) => setForm({ ...form, description: html })} minHeight={200} /></div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label>رابط البث</Label><Input dir="ltr" className="text-left" value={form.live_url ?? ""} onChange={(e) => setForm({ ...form, live_url: e.target.value })} placeholder="https://youtube.com/watch?v=…" /></div>
              <div><Label>رابط التضمين (اختياري)</Label><Input dir="ltr" className="text-left" value={form.embed_url ?? ""} onChange={(e) => setForm({ ...form, embed_url: e.target.value })} placeholder="يتم استنتاجه تلقائيًا" /></div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={testLink}><FlaskConical className="h-4 w-4" /> اختبار الرابط</Button>
              <Button type="button" variant="outline" size="sm" onClick={copyPublicLink}><Copy className="h-4 w-4" /> نسخ رابط الصفحة</Button>
            </div>
            {previewEmbed && (
              <div className="aspect-video rounded-lg overflow-hidden border bg-black">
                <iframe src={previewEmbed} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title="معاينة" />
              </div>
            )}
            <div><Label>رابط التسجيل بعد انتهاء البث</Label><Input dir="ltr" className="text-left" value={form.replay_url ?? ""} onChange={(e) => setForm({ ...form, replay_url: e.target.value })} placeholder="https://…" /></div>
            <div><Label>ملاحظات داخلية</Label><Textarea rows={3} value={form.internal_notes ?? ""} onChange={(e) => setForm({ ...form, internal_notes: e.target.value })} /></div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <div>
              <Label>المنصة</Label>
              <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>الحالة</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">مسودة</SelectItem>
                  <SelectItem value="scheduled">مجدول</SelectItem>
                  <SelectItem value="live">مباشر الآن</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>تاريخ ووقت البث</Label><Input type="datetime-local" value={form.scheduled_at ?? ""} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} /></div>
            <div><Label>تاريخ انتهاء الظهور (اختياري)</Label><Input type="datetime-local" value={form.expires_at ?? ""} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} /><p className="text-[11px] text-muted-foreground mt-1">إذا تُرك فارغًا يبقى البث ظاهرًا حتى يغيّر المدير حالته أو يخفيه.</p></div>
            <div>
              <Label>جهة النشر</Label>
              <Select value={form.publisher_source} onValueChange={(v) => setForm({ ...form, publisher_source: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PUBLISHERS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between"><Label>إخفاء من الصفحة الرئيسية</Label><Switch checked={!!form.hide_from_homepage} onCheckedChange={(v) => setForm({ ...form, hide_from_homepage: v })} /></div>
            <div className="flex items-center justify-between"><Label>إخفاء من صفحة المرئيات</Label><Switch checked={!!form.hide_from_videos} onCheckedChange={(v) => setForm({ ...form, hide_from_videos: v })} /></div>
            <div className="flex items-center justify-between"><Label>أرشفة تلقائية بعد الانتهاء</Label><Switch checked={!!form.auto_archive} onCheckedChange={(v) => setForm({ ...form, auto_archive: v })} /></div>
            <div className="flex items-center justify-between"><Label>إشعار المشتركين</Label><Switch checked={form.notify_subscribers} onCheckedChange={(v) => setForm({ ...form, notify_subscribers: v })} /></div>
            <div className="flex items-center justify-between"><Label>إشعار المدير</Label><Switch checked={form.notify_admin} onCheckedChange={(v) => setForm({ ...form, notify_admin: v })} /></div>
          </Card>
          <Card className="p-5"><FileUploadField bucket="thumbnails" label="صورة مصغرة" value={form.thumbnail} onChange={(v) => setForm({ ...form, thumbnail: v })} /></Card>
        </div>
      </div>
    </div>
  );
}

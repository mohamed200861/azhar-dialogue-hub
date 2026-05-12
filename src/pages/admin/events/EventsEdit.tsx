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

const TYPES = ["مؤتمرات","ندوات","دورات","لقاءات","محاضرات","بث مباشر"];
const ORGANIZERS = ["إدارة الاتحاد","قسم التدريب","القسم العلمي","القسم الإعلامي"];

export default function EventsEdit() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const toLocal = (s: string | null) => s ? new Date(s).toISOString().slice(0, 16) : "";
  const [form, setForm] = useState<any>({
    title: "", slug: "", description: "", event_type: TYPES[0], cover_image: null,
    start_datetime: "", end_datetime: "", location: "", online_link: "", registration_link: "",
    live_link: "", replay_link: "", organizer_source: ORGANIZERS[0],
    status: "upcoming", publish_status: "draft", is_featured: false,
  });

  useEffect(() => {
    if (isNew) return;
    (async () => {
      const { data, error } = await supabase.from("events").select("*").eq("id", id!).maybeSingle();
      if (error || !data) { toast.error("لم يتم العثور على الفعالية"); navigate("/admin/events"); return; }
      setForm({ ...data, start_datetime: toLocal(data.start_datetime), end_datetime: toLocal(data.end_datetime) });
      setLoading(false);
    })();
  }, [id]);

  const save = async (publish?: boolean) => {
    if (!form.title.trim()) return toast.error("العنوان مطلوب");
    if (!form.start_datetime) return toast.error("تاريخ البداية مطلوب");
    for (const f of ["registration_link", "online_link", "live_link", "replay_link"]) {
      if (!isValidUrl(form[f])) return toast.error("يرجى إدخال رابط صحيح يبدأ بـ https://");
    }
    setSaving(true);
    const payload: any = {
      ...form,
      slug: sanitizeSlug(form.slug) || slugify(form.title),
      created_by: form.created_by ?? user?.id ?? null,
      start_datetime: new Date(form.start_datetime).toISOString(),
      end_datetime: form.end_datetime ? new Date(form.end_datetime).toISOString() : null,
      registration_link: form.registration_link?.trim() || null,
      online_link: form.online_link?.trim() || null,
      live_link: form.live_link?.trim() || null,
      replay_link: form.replay_link?.trim() || null,
    };
    if (publish === true) payload.publish_status = "published";
    if (publish === false) payload.publish_status = "draft";
    let error;
    if (isNew) {
      const { data, error: e } = await supabase.from("events").insert(payload).select("id").single();
      error = e; if (!e && data) navigate(`/admin/events/${data.id}`, { replace: true });
    } else {
      ({ error } = await supabase.from("events").update(payload).eq("id", id!));
    }
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("تم الحفظ");
  };

  if (loading) return <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;

  return (
    <div>
      <Button variant="ghost" asChild className="mb-2"><Link to="/admin/events"><ArrowRight className="h-4 w-4" /> العودة</Link></Button>
      <PageHeader title={isNew ? "فعالية جديدة" : "تعديل الفعالية"} actions={<>
        <Button variant="outline" onClick={() => save(false)} disabled={saving}><Save className="h-4 w-4" /> مسودة</Button>
        <Button onClick={() => save(true)} disabled={saving}>نشر</Button>
      </>} />
      <div className="grid lg:grid-cols-[1fr,320px] gap-6">
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <div><Label>العنوان *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>الرابط المختصر</Label><Input dir="ltr" className="text-left" value={form.slug ?? ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
            <div><Label>الوصف</Label><RichTextEditor value={form.description ?? ""} onChange={(html) => setForm({ ...form, description: html })} minHeight={240} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>تاريخ البداية *</Label><Input type="datetime-local" value={form.start_datetime} onChange={(e) => setForm({ ...form, start_datetime: e.target.value })} /></div>
              <div><Label>تاريخ النهاية</Label><Input type="datetime-local" value={form.end_datetime} onChange={(e) => setForm({ ...form, end_datetime: e.target.value })} /></div>
            </div>
            <div><Label>المكان</Label><Input value={form.location ?? ""} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div><Label>رابط التسجيل</Label><Input dir="ltr" className="text-left" value={form.registration_link ?? ""} onChange={(e) => setForm({ ...form, registration_link: e.target.value })} /></div>
            <div><Label>رابط الحضور الإلكتروني</Label><Input dir="ltr" className="text-left" value={form.online_link ?? ""} onChange={(e) => setForm({ ...form, online_link: e.target.value })} /></div>
            <div><Label>رابط البث</Label><Input dir="ltr" className="text-left" value={form.live_link ?? ""} onChange={(e) => setForm({ ...form, live_link: e.target.value })} /></div>
            <div><Label>رابط التسجيل بعد الانتهاء</Label><Input dir="ltr" className="text-left" value={form.replay_link ?? ""} onChange={(e) => setForm({ ...form, replay_link: e.target.value })} /></div>
          </Card>
        </div>
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <div>
              <Label>نوع الفعالية</Label>
              <Select value={form.event_type} onValueChange={(v) => setForm({ ...form, event_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>جهة التنظيم</Label>
              <Select value={form.organizer_source} onValueChange={(v) => setForm({ ...form, organizer_source: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ORGANIZERS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>الحالة</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">قادم</SelectItem>
                  <SelectItem value="live">مباشر</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>حالة النشر</Label>
              <Select value={form.publish_status} onValueChange={(v) => setForm({ ...form, publish_status: v })}>
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
        </div>
      </div>
    </div>
  );
}

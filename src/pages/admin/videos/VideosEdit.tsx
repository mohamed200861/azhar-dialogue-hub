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
import { FileUploadField } from "@/components/admin/FileUploadField";
import { Loader2, ArrowRight, Save } from "lucide-react";
import { toast } from "sonner";
import { slugify, getYouTubeEmbed } from "@/lib/admin-utils";
import { useAuth } from "@/hooks/useAuth";

const CATEGORIES = ["بث مباشر","محاضرات","لقاءات","دروس قصيرة","ندوات مسجلة","تسجيلات","برامج توعوية"];
const PUBLISHERS = ["إدارة الاتحاد","القسم الإعلامي","فريق البث","إدارة الموقع"];
const PLATFORMS = ["YouTube","Facebook","Zoom","Other"];

export default function VideosEdit() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({
    title: "", slug: "", description: "", thumbnail: null, video_url: "", embed_url: "",
    platform: "YouTube", type: "video", live_status: null, scheduled_at: null,
    duration_seconds: null, category: CATEGORIES[1], publisher_source: PUBLISHERS[1],
    status: "draft", is_featured: false,
  });

  useEffect(() => {
    if (isNew) return;
    (async () => {
      const { data, error } = await supabase.from("videos").select("*").eq("id", id!).maybeSingle();
      if (error || !data) { toast.error("لم يتم العثور على العنصر"); navigate("/admin/videos"); return; }
      setForm({ ...data, scheduled_at: data.scheduled_at ? new Date(data.scheduled_at).toISOString().slice(0, 16) : null }); setLoading(false);
    })();
  }, [id]);

  const save = async (publish?: boolean) => {
    if (!form.title.trim()) return toast.error("العنوان مطلوب");
    setSaving(true);
    const embed = form.embed_url?.trim() || (form.video_url ? getYouTubeEmbed(form.video_url) ?? "" : "");
    const payload: any = {
      ...form,
      slug: form.slug?.trim() || slugify(form.title),
      created_by: form.created_by ?? user?.id ?? null,
      embed_url: embed || null,
      duration_seconds: form.duration_seconds ? Number(form.duration_seconds) : null,
      scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
      live_status: form.type === "live" ? (form.live_status ?? "scheduled") : null,
    };
    if (publish === true) payload.status = "published";
    if (publish === false) payload.status = "draft";
    let error;
    if (isNew) {
      const { data, error: e } = await supabase.from("videos").insert(payload).select("id").single();
      error = e; if (!e && data) navigate(`/admin/videos/${data.id}`, { replace: true });
    } else {
      ({ error } = await supabase.from("videos").update(payload).eq("id", id!));
    }
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("تم الحفظ");
  };

  if (loading) return <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;

  return (
    <div>
      <Button variant="ghost" asChild className="mb-2"><Link to="/admin/videos"><ArrowRight className="h-4 w-4" /> العودة</Link></Button>
      <PageHeader title={isNew ? "محتوى مرئي جديد" : "تعديل المحتوى"} actions={<>
        <Button variant="outline" onClick={() => save(false)} disabled={saving}><Save className="h-4 w-4" /> مسودة</Button>
        <Button onClick={() => save(true)} disabled={saving}>نشر</Button>
      </>} />
      <div className="grid lg:grid-cols-[1fr,320px] gap-6">
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <div><Label>العنوان *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>الرابط المختصر</Label><Input dir="ltr" className="text-left" value={form.slug ?? ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
            <div><Label>الوصف</Label><Textarea rows={5} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label>رابط الفيديو</Label><Input dir="ltr" className="text-left" value={form.video_url ?? ""} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="https://youtube.com/watch?v=…" /></div>
            <div><Label>رابط التضمين (اختياري)</Label><Input dir="ltr" className="text-left" value={form.embed_url ?? ""} onChange={(e) => setForm({ ...form, embed_url: e.target.value })} placeholder="يتم استنتاجه تلقائيًا من YouTube" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>المنصة</Label>
                <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>المدة (بالثواني)</Label>
                <Input type="number" value={form.duration_seconds ?? ""} onChange={(e) => setForm({ ...form, duration_seconds: e.target.value })} />
              </div>
            </div>
          </Card>
        </div>
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <div>
              <Label>النوع</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">فيديو</SelectItem>
                  <SelectItem value="live">بث مباشر</SelectItem>
                  <SelectItem value="recording">تسجيل</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.type === "live" && <>
              <div>
                <Label>حالة البث</Label>
                <Select value={form.live_status ?? "scheduled"} onValueChange={(v) => setForm({ ...form, live_status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">مجدول</SelectItem>
                    <SelectItem value="live">مباشر الآن</SelectItem>
                    <SelectItem value="completed">مكتمل</SelectItem>
                    <SelectItem value="cancelled">ملغي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>تاريخ ووقت البث</Label><Input type="datetime-local" value={form.scheduled_at ?? ""} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} /></div>
            </>}
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
                <SelectContent>{PUBLISHERS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>حالة النشر</Label>
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
          <Card className="p-5"><FileUploadField bucket="thumbnails" label="صورة مصغرة" value={form.thumbnail} onChange={(v) => setForm({ ...form, thumbnail: v })} /></Card>
        </div>
      </div>
    </div>
  );
}

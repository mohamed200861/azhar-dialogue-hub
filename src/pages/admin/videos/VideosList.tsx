import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Search, Loader2, Star, Edit, Trash2, Radio } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDateTime } from "@/lib/admin-utils";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const TYPE_LABEL: Record<string, string> = { video: "فيديو", live: "بث مباشر", recording: "تسجيل" };
const LIVE_LABEL: Record<string, string> = { scheduled: "مجدول", live: "مباشر الآن", completed: "مكتمل", cancelled: "ملغي" };

export default function VideosList() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("all");

  const load = async () => {
    setRows(null);
    let query = supabase.from("videos").select("id,title,type,live_status,status,is_featured,scheduled_at,updated_at").order("updated_at", { ascending: false });
    if (type !== "all") query = query.eq("type", type as any);
    const { data } = await query;
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, [type]);

  const remove = async (id: string) => {
    const { error } = await supabase.from("videos").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف"); load();
  };
  const filtered = (rows ?? []).filter((r) => !q || r.title.includes(q));

  return (
    <div>
      <PageHeader
        title="المرئيات والبث المباشر"
        description="إدارة المحاضرات والفيديوهات والبث المباشر."
        actions={<Button asChild><Link to="/admin/videos/new"><Plus className="h-4 w-4" /> جديد</Link></Button>}
      />
      <Card className="p-4 mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث…" className="ps-10" />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الأنواع</SelectItem>
            <SelectItem value="video">فيديو</SelectItem>
            <SelectItem value="live">بث مباشر</SelectItem>
            <SelectItem value="recording">تسجيل</SelectItem>
          </SelectContent>
        </Select>
      </Card>
      <Card className="overflow-hidden">
        {rows === null ? <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
          : filtered.length === 0 ? <div className="p-12 text-center text-muted-foreground">لا يوجد محتوى مرئي بعد. <Link to="/admin/videos/new" className="text-primary font-semibold">أضف عنصرًا.</Link></div>
          : <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-right">
                  <tr><th className="p-3">العنوان</th><th className="p-3">النوع</th><th className="p-3">حالة البث</th><th className="p-3">تاريخ البث</th><th className="p-3">الحالة</th><th className="p-3 w-32">إجراءات</th></tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-t hover:bg-muted/30">
                      <td className="p-3 font-medium">
                        <Link to={`/admin/videos/${r.id}`} className="hover:text-primary inline-flex items-center gap-2">
                          {r.is_featured && <Star className="h-3.5 w-3.5 fill-primary text-primary" />}
                          {r.live_status === "live" && <Radio className="h-3.5 w-3.5 text-crimson animate-pulse" />}
                          {r.title}
                        </Link>
                      </td>
                      <td className="p-3 text-muted-foreground">{TYPE_LABEL[r.type]}</td>
                      <td className="p-3 text-muted-foreground">{r.live_status ? LIVE_LABEL[r.live_status] : "—"}</td>
                      <td className="p-3 text-muted-foreground">{r.scheduled_at ? formatDateTime(r.scheduled_at) : "—"}</td>
                      <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${r.status === "published" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{r.status === "published" ? "منشور" : "مسودة"}</span></td>
                      <td className="p-3"><div className="flex gap-1">
                        <Button asChild size="icon" variant="ghost"><Link to={`/admin/videos/${r.id}`}><Edit className="h-4 w-4" /></Link></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent dir="rtl">
                            <AlertDialogHeader><AlertDialogTitle>حذف العنصر</AlertDialogTitle><AlertDialogDescription>سيتم الحذف نهائيًا.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => remove(r.id)} className="bg-destructive">حذف</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </Card>
    </div>
  );
}

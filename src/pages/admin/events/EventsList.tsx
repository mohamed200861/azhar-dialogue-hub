import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Search, Loader2, Star, Edit, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDateTime } from "@/lib/admin-utils";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const STATUS: Record<string, string> = { upcoming: "قادم", live: "مباشر", completed: "مكتمل", cancelled: "ملغي" };

export default function EventsList() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");

  const load = async () => {
    setRows(null);
    let query = supabase.from("events").select("id,title,event_type,status,publish_status,is_featured,start_datetime,location").order("start_datetime", { ascending: false });
    if (status !== "all") query = query.eq("status", status as any);
    const { data } = await query;
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, [status]);

  const remove = async (id: string) => {
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف"); load();
  };
  const filtered = (rows ?? []).filter((r) => !q || r.title.includes(q));

  return (
    <div>
      <PageHeader title="الفعاليات" description="إدارة المؤتمرات والندوات والدورات." actions={<Button asChild><Link to="/admin/events/new"><Plus className="h-4 w-4" /> فعالية جديدة</Link></Button>} />
      <Card className="p-4 mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث…" className="ps-10" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="upcoming">قادم</SelectItem>
            <SelectItem value="live">مباشر</SelectItem>
            <SelectItem value="completed">مكتمل</SelectItem>
            <SelectItem value="cancelled">ملغي</SelectItem>
          </SelectContent>
        </Select>
      </Card>
      <Card className="overflow-hidden">
        {rows === null ? <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
          : filtered.length === 0 ? <div className="p-12 text-center text-muted-foreground">لا توجد فعاليات بعد. <Link to="/admin/events/new" className="text-primary font-semibold">أضف فعالية.</Link></div>
          : <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-right">
                  <tr><th className="p-3">العنوان</th><th className="p-3">النوع</th><th className="p-3">التاريخ</th><th className="p-3">الحالة</th><th className="p-3">النشر</th><th className="p-3 w-32">إجراءات</th></tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-t hover:bg-muted/30">
                      <td className="p-3 font-medium">
                        <Link to={`/admin/events/${r.id}`} className="hover:text-primary inline-flex items-center gap-2">
                          {r.is_featured && <Star className="h-3.5 w-3.5 fill-primary text-primary" />}{r.title}
                        </Link>
                      </td>
                      <td className="p-3 text-muted-foreground">{r.event_type}</td>
                      <td className="p-3 text-muted-foreground">{formatDateTime(r.start_datetime)}</td>
                      <td className="p-3"><span className="text-xs px-2 py-0.5 rounded-full bg-secondary">{STATUS[r.status]}</span></td>
                      <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${r.publish_status === "published" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{r.publish_status === "published" ? "منشور" : "مسودة"}</span></td>
                      <td className="p-3"><div className="flex gap-1">
                        <Button asChild size="icon" variant="ghost"><Link to={`/admin/events/${r.id}`}><Edit className="h-4 w-4" /></Link></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent dir="rtl">
                            <AlertDialogHeader><AlertDialogTitle>حذف الفعالية</AlertDialogTitle><AlertDialogDescription>سيتم الحذف نهائيًا.</AlertDialogDescription></AlertDialogHeader>
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

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2, Edit, Trash2, Radio, Search, RefreshCw } from "lucide-react";
import { formatDateTime } from "@/lib/admin-utils";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const STATUS_LABEL: Record<string, string> = {
  draft: "مسودة",
  scheduled: "مجدول",
  live: "مباشر الآن",
  completed: "مكتمل",
  cancelled: "ملغي",
};

const STATUS_CLASS: Record<string, string> = {
  live: "bg-red-100 text-red-700 animate-pulse",
  scheduled: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  draft: "bg-muted text-muted-foreground",
  cancelled: "bg-gray-100 text-gray-500",
};

export default function LiveList() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [q, setQ] = useState("");

  const load = async () => {
    setRows(null);
    const { data } = await supabase.from("live_streams").select("*").order("scheduled_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false });
    setRows(data ?? []);
  };

  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    const { error } = await supabase.from("live_streams").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم حذف البث");
    load();
  };

  const filtered = (rows ?? []).filter((r) => !q || r.title.includes(q));

  return (
    <div>
      <PageHeader
        title="استوديو البث المباشر"
        description="إدارة البثوث المباشرة عبر يوتيوب وفيسبوك وزوم وغيرها."
        actions={
          <>
            <Button variant="outline" onClick={() => { load(); toast.success("تم تحديث حالة البث في الموقع"); }}>
              <RefreshCw className="h-4 w-4" /> تحديث حالة البث في الموقع
            </Button>
            <Button asChild><Link to="/admin/live/new"><Plus className="h-4 w-4" /> بث جديد</Link></Button>
          </>
        }
      />

      <Card className="p-4 mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالعنوان…" className="ps-10" />
        </div>
      </Card>

      <Card className="overflow-hidden">
        {rows === null ? (
          <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            لا توجد بثوث بعد. <Link to="/admin/live/new" className="text-primary font-semibold">أضف أول بث.</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-right">
                <tr>
                  <th className="p-3 font-semibold">العنوان</th>
                  <th className="p-3 font-semibold">المنصة</th>
                  <th className="p-3 font-semibold">الحالة</th>
                  <th className="p-3 font-semibold">الموعد</th>
                  <th className="p-3 font-semibold w-32">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-muted/30">
                    <td className="p-3 font-medium">
                      <Link to={`/admin/live/${r.id}`} className="hover:text-primary inline-flex items-center gap-2">
                        {r.status === "live" && <Radio className="h-3.5 w-3.5 text-red-600 animate-pulse" />}
                        {r.title}
                      </Link>
                    </td>
                    <td className="p-3 text-muted-foreground">{r.platform}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_CLASS[r.status] ?? ""}`}>
                        {STATUS_LABEL[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">{r.scheduled_at ? formatDateTime(r.scheduled_at) : "—"}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button asChild size="icon" variant="ghost"><Link to={`/admin/live/${r.id}`}><Edit className="h-4 w-4" /></Link></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent dir="rtl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>حذف البث</AlertDialogTitle>
                              <AlertDialogDescription>سيتم حذف البث بشكل نهائي. هل أنت متأكد؟</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction onClick={() => remove(r.id)} className="bg-destructive">حذف</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

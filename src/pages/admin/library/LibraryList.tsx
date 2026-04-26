import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Search, Loader2, Star, Edit, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/admin-utils";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const STATUS_LABEL: Record<string, string> = { draft: "مسودة", published: "منشور", archived: "مؤرشف" };

export default function LibraryList() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");

  const load = async () => {
    setRows(null);
    let query = supabase.from("library_items").select("id,title,category,status,is_featured,downloads_count,updated_at").order("updated_at", { ascending: false });
    if (status !== "all") query = query.eq("status", status as any);
    const { data } = await query;
    setRows(data ?? []);
  };

  useEffect(() => { load(); }, [status]);

  const remove = async (id: string) => {
    const { error } = await supabase.from("library_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف");
    load();
  };

  const filtered = (rows ?? []).filter((r) => !q || r.title.includes(q));

  return (
    <div>
      <PageHeader
        title="المكتبة"
        description="إدارة الكتب والبحوث والإصدارات والملفات."
        actions={<Button asChild><Link to="/admin/library/new"><Plus className="h-4 w-4" /> عنصر جديد</Link></Button>}
      />
      <Card className="p-4 mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث…" className="ps-10" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="draft">مسودة</SelectItem>
            <SelectItem value="published">منشور</SelectItem>
            <SelectItem value="archived">مؤرشف</SelectItem>
          </SelectContent>
        </Select>
      </Card>
      <Card className="overflow-hidden">
        {rows === null ? (
          <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            لا توجد عناصر في المكتبة بعد. <Link to="/admin/library/new" className="text-primary font-semibold">أضف أول عنصر.</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-right">
                <tr>
                  <th className="p-3">العنوان</th><th className="p-3">التصنيف</th>
                  <th className="p-3">الحالة</th><th className="p-3">التحميلات</th>
                  <th className="p-3">آخر تحديث</th><th className="p-3 w-32">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-muted/30">
                    <td className="p-3 font-medium">
                      <Link to={`/admin/library/${r.id}`} className="hover:text-primary inline-flex items-center gap-2">
                        {r.is_featured && <Star className="h-3.5 w-3.5 fill-primary text-primary" />}
                        {r.title}
                      </Link>
                    </td>
                    <td className="p-3 text-muted-foreground">{r.category}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        r.status === "published" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      }`}>{STATUS_LABEL[r.status]}</span>
                    </td>
                    <td className="p-3 text-muted-foreground">{r.downloads_count ?? 0}</td>
                    <td className="p-3 text-muted-foreground">{formatDate(r.updated_at)}</td>
                    <td className="p-3"><div className="flex gap-1">
                      <Button asChild size="icon" variant="ghost"><Link to={`/admin/library/${r.id}`}><Edit className="h-4 w-4" /></Link></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                        <AlertDialogContent dir="rtl">
                          <AlertDialogHeader><AlertDialogTitle>حذف العنصر</AlertDialogTitle><AlertDialogDescription>سيتم حذف العنصر بشكل نهائي.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => remove(r.id)} className="bg-destructive">حذف</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div></td>
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

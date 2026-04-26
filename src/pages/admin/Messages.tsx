import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Mail } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDateTime } from "@/lib/admin-utils";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogDescription,
} from "@/components/ui/alert-dialog";

const STATUS: Record<string, string> = { new: "جديدة", read: "مقروءة", replied: "تم الرد", archived: "مؤرشفة", spam: "غير مرغوبة" };

export default function MessagesList() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const load = async () => {
    setRows(null);
    let q = supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter as any);
    const { data } = await q;
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("contact_messages").update({ status: status as any }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم التحديث");
    load();
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from("contact_messages").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف");
    load();
  };

  return (
    <div>
      <PageHeader title="رسائل التواصل" description="إدارة الرسائل الواردة من نموذج التواصل." actions={
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="new">جديدة</SelectItem>
            <SelectItem value="read">مقروءة</SelectItem>
            <SelectItem value="replied">تم الرد</SelectItem>
            <SelectItem value="archived">مؤرشفة</SelectItem>
            <SelectItem value="spam">غير مرغوبة</SelectItem>
          </SelectContent>
        </Select>
      } />
      {rows === null ? <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
        : rows.length === 0 ? <Card className="p-12 text-center text-muted-foreground">لا توجد رسائل في هذا التصنيف.</Card>
        : <div className="space-y-3">
            {rows.map((m) => (
              <Card key={m.id} className="p-5">
                <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
                  <div>
                    <div className="font-semibold">{m.name} <span className="text-xs text-muted-foreground">— {m.contact_type ?? "—"}</span></div>
                    <a href={`mailto:${m.email}`} className="text-xs text-primary" dir="ltr">{m.email}</a>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{STATUS[m.status]}</span>
                    <span className="text-xs text-muted-foreground">{formatDateTime(m.created_at)}</span>
                  </div>
                </div>
                {m.subject && <div className="text-sm font-medium mb-1">{m.subject}</div>}
                <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-3">{m.message}</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => updateStatus(m.id, "read")}>تحديد كمقروءة</Button>
                  <Button size="sm" variant="outline" onClick={() => updateStatus(m.id, "replied")}>تم الرد</Button>
                  <Button size="sm" variant="outline" onClick={() => updateStatus(m.id, "archived")}>أرشفة</Button>
                  <Button size="sm" variant="outline" asChild><a href={`mailto:${m.email}`}><Mail className="h-3.5 w-3.5" /> رد</a></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button size="sm" variant="outline" className="text-destructive"><Trash2 className="h-3.5 w-3.5" /> حذف</Button></AlertDialogTrigger>
                    <AlertDialogContent dir="rtl">
                      <AlertDialogHeader><AlertDialogTitle>حذف الرسالة</AlertDialogTitle><AlertDialogDescription>سيتم الحذف نهائيًا.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => remove(m.id)} className="bg-destructive">حذف</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </Card>
            ))}
          </div>
      }
    </div>
  );
}

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Download } from "lucide-react";
import { formatDateTime } from "@/lib/admin-utils";
import { toast } from "sonner";

export default function Newsletter() {
  const [rows, setRows] = useState<any[] | null>(null);

  const load = async () => {
    setRows(null);
    const { data } = await supabase.from("newsletter_subscribers").select("*").order("subscribed_at", { ascending: false });
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف");
    load();
  };

  const exportCsv = () => {
    if (!rows?.length) return;
    const csv = ["email,subscribed_at", ...rows.map((r) => `${r.email},${r.subscribed_at}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `subscribers-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader title="النشرة البريدية" description={`عدد المشتركين: ${rows?.length ?? "—"}`}
        actions={<Button variant="outline" onClick={exportCsv} disabled={!rows?.length}><Download className="h-4 w-4" /> تصدير CSV</Button>} />
      {rows === null ? <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
        : rows.length === 0 ? <Card className="p-12 text-center text-muted-foreground">لا يوجد مشتركون بعد.</Card>
        : <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-right"><tr><th className="p-3">البريد الإلكتروني</th><th className="p-3">تاريخ الاشتراك</th><th className="p-3 w-20">إجراءات</th></tr></thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="p-3" dir="ltr">{s.email}</td>
                    <td className="p-3 text-muted-foreground">{formatDateTime(s.subscribed_at)}</td>
                    <td className="p-3"><Button size="icon" variant="ghost" className="text-destructive" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
      }
    </div>
  );
}

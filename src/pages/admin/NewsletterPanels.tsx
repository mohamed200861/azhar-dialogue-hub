import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, RefreshCw, RotateCw, Play, Send } from "lucide-react";
import { formatDateTime } from "@/lib/admin-utils";
import { toast } from "sonner";

const EVENT_STATUS: Record<string, string> = {
  pending: "في الانتظار", processing: "قيد المعالجة",
  processed: "تمت المعالجة", failed: "فشل", skipped: "تم التخطي",
};

export function NotificationEventsPanel() {
  const { isSuperAdmin, isAdmin } = useAuth();
  const [rows, setRows] = useState<any[] | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [retrying, setRetrying] = useState(false);

  const load = async () => {
    setRows(null);
    let q = supabase.from("notification_events" as any).select("*").order("created_at", { ascending: false }).limit(100);
    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    const { data } = await q;
    setRows((data as any[]) ?? []);
    // counters
    const all = (await supabase.from("notification_events" as any).select("status").limit(2000)).data as any[] | null;
    const c: Record<string, number> = {};
    (all ?? []).forEach((r) => { c[r.status] = (c[r.status] ?? 0) + 1; });
    setCounts(c);
  };

  useEffect(() => { load(); }, [statusFilter]);

  const retryFailed = async () => {
    if (!confirm("Reimposta tutti gli eventi falliti come 'pending'?")) return;
    setRetrying(true);
    const { error } = await supabase
      .from("notification_events" as any)
      .update({ status: "pending", error_message: null, processed_at: null })
      .eq("status", "failed");
    setRetrying(false);
    if (error) return toast.error(error.message);
    toast.success("Eventi riaccodati");
    load();
  };

  const [processing, setProcessing] = useState(false);
  const processNow = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-notification-events", { body: {} });
      if (error) throw error;
      const d: any = data ?? {};
      toast.success(`Processati: ${d.processed ?? 0} • Falliti: ${d.failed ?? 0} • Skipped: ${d.skipped ?? 0}`);
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Errore processing");
    } finally {
      setProcessing(false);
    }
  };

  const [testing, setTesting] = useState(false);
  const testSystem = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-newsletter-test", {
        body: { test_email: "info@alazharscholarunion.it", subject: "Test sistema email", html: "<p dir='rtl'>اختبار النظام البريدي.</p>" },
      });
      if (error) throw error;
      toast.success("Email di prova inviata a info@alazharscholarunion.it");
      void data;
    } catch (e: any) {
      toast.error(e?.message ?? "Test fallito (verifica RESEND_API_KEY)");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-3">
      <Card className="p-3 flex flex-wrap gap-2 items-center">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="pending">في الانتظار</SelectItem>
            <SelectItem value="processing">قيد المعالجة</SelectItem>
            <SelectItem value="processed">تمت المعالجة</SelectItem>
            <SelectItem value="failed">فشل</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /> تحديث</Button>
        {(isAdmin || isSuperAdmin) && (
          <>
            <Button variant="outline" size="sm" onClick={processNow} disabled={processing}>
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Processa ora
            </Button>
            <Button variant="outline" size="sm" onClick={testSystem} disabled={testing}>
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Test sistema email
            </Button>
            <Button variant="outline" size="sm" onClick={retryFailed} disabled={retrying || !(counts.failed)}>
              {retrying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
              Riprova falliti ({counts.failed ?? 0})
            </Button>
          </>
        )}
        <div className="ms-auto flex gap-2 text-xs text-muted-foreground">
          <span>في الانتظار: {counts.pending ?? 0}</span>
          <span>•</span>
          <span>تمت: {counts.processed ?? 0}</span>
          <span>•</span>
          <span>فشل: {counts.failed ?? 0}</span>
        </div>
      </Card>

      {rows === null ? (
        <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
      ) : rows.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">لا توجد أحداث.</Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-right">
              <tr>
                <th className="p-3">العنوان</th>
                <th className="p-3">النوع</th>
                <th className="p-3">الحالة</th>
                <th className="p-3">التاريخ</th>
                <th className="p-3">ملاحظة</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">
                    <div className="font-medium line-clamp-1">{r.title}</div>
                    <div className="text-xs text-muted-foreground" dir="ltr">{r.entity_type} • {r.event_kind}</div>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground" dir="ltr">{r.url ?? "—"}</td>
                  <td className="p-3"><Badge variant={r.status === "failed" ? "destructive" : r.status === "processed" ? "default" : "outline"}>{EVENT_STATUS[r.status] ?? r.status}</Badge></td>
                  <td className="p-3 text-muted-foreground text-xs">{formatDateTime(r.created_at)}</td>
                  <td className="p-3 text-xs text-destructive max-w-xs truncate">{r.error_message ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

export function EmailLogsPanel() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const load = async () => {
    setRows(null);
    let q = supabase.from("email_send_log" as any).select("*").order("created_at", { ascending: false }).limit(200);
    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    const { data } = await q;
    setRows((data as any[]) ?? []);
  };
  useEffect(() => { load(); }, [statusFilter]);

  return (
    <div className="space-y-3">
      <Card className="p-3 flex flex-wrap gap-2 items-center">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="success">ناجحة</SelectItem>
            <SelectItem value="error">خطأ</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /> تحديث</Button>
      </Card>

      {rows === null ? (
        <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
      ) : rows.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">لا توجد سجلات.</Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-right">
              <tr>
                <th className="p-3">المستلم</th>
                <th className="p-3">القالب</th>
                <th className="p-3">الحالة</th>
                <th className="p-3">التاريخ</th>
                <th className="p-3">الخطأ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3" dir="ltr">{r.recipient_email}</td>
                  <td className="p-3 text-xs text-muted-foreground" dir="ltr">{r.template_name}</td>
                  <td className="p-3"><Badge variant={r.status === "success" ? "default" : "destructive"}>{r.status === "success" ? "ناجحة" : "خطأ"}</Badge></td>
                  <td className="p-3 text-muted-foreground text-xs">{formatDateTime(r.created_at)}</td>
                  <td className="p-3 text-xs text-destructive max-w-xs truncate" title={r.error_message ?? ""}>{r.error_message ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

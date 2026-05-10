import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Trash2, Download, UserX, Plus, AlertCircle, Send } from "lucide-react";
import { formatDateTime } from "@/lib/admin-utils";
import { toast } from "sonner";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const CAMPAIGN_TYPES: Record<string, string> = {
  news: "أخبار", event: "فعالية", library: "مكتبة", live: "بث مباشر", general: "عام",
};
const CAMPAIGN_STATUS: Record<string, string> = { draft: "مسودة", ready: "جاهزة", sent: "مُرسلة" };

export default function Newsletter() {
  const { isSuperAdmin } = useAuth();
  const { settings } = useSiteSettings();
  const [rows, setRows] = useState<any[] | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [campaigns, setCampaigns] = useState<any[] | null>(null);

  // campaign form
  const [cTitle, setCTitle] = useState("");
  const [cContent, setCContent] = useState("");
  const [cType, setCType] = useState("general");
  const [cStatus, setCStatus] = useState("draft");

  const load = async () => {
    setRows(null);
    let q = supabase.from("newsletter_subscribers").select("*").order("subscribed_at", { ascending: false });
    if (statusFilter !== "all") q = q.eq("status", statusFilter as any);
    const { data } = await q;
    let list = data ?? [];
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      list = list.filter((r: any) => r.email.toLowerCase().includes(s));
    }
    setRows(list);
  };

  const loadCampaigns = async () => {
    const { data } = await supabase.from("newsletter_campaigns").select("*").order("created_at", { ascending: false });
    setCampaigns(data ?? []);
  };

  useEffect(() => { load(); }, [statusFilter, search]);
  useEffect(() => { loadCampaigns(); }, []);

  const remove = async (id: string) => {
    const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف"); load();
  };
  const unsubscribe = async (id: string) => {
    const { error } = await supabase.from("newsletter_subscribers").update({ status: "unsubscribed" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم إلغاء الاشتراك"); load();
  };
  const reactivate = async (id: string) => {
    const { error } = await supabase.from("newsletter_subscribers").update({ status: "active" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تمت إعادة التفعيل"); load();
  };

  const exportCsv = () => {
    if (!rows?.length) return;
    const csv = ["email,status,source,subscribed_at",
      ...rows.map((r) => `${r.email},${r.status ?? "active"},${r.source ?? ""},${r.subscribed_at}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `subscribers-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const createCampaign = async () => {
    if (!cTitle.trim()) return toast.error("العنوان مطلوب");
    const { error } = await supabase.from("newsletter_campaigns").insert({
      title: cTitle.trim(), content: cContent, type: cType as any, status: cStatus as any,
    });
    if (error) return toast.error(error.message);
    toast.success("تم إنشاء الحملة");
    setCTitle(""); setCContent(""); setCType("general"); setCStatus("draft");
    loadCampaigns();
  };
  const removeCampaign = async (id: string) => {
    const { error } = await supabase.from("newsletter_campaigns").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف"); loadCampaigns();
  };


  const [sendingId, setSendingId] = useState<string | null>(null);
  const [serviceConfigured, setServiceConfigured] = useState<boolean | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [testingId, setTestingId] = useState<string | null>(null);

  // Detect if RESEND is configured by pinging the function with a fake id.
  // 503 => not configured. 400/404 => configured but bad input (means service is up).
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("send-newsletter-test", {
          body: { campaign_id: "00000000-0000-0000-0000-000000000000", test_email: "probe@example.com" },
        });
        if (error) {
          let status = 0;
          let msg = "";
          try {
            const ctx: any = (error as any).context;
            status = ctx?.status ?? 0;
            if (ctx?.json) {
              const j = await ctx.json();
              msg = j?.error || j?.message || "";
            }
          } catch (_e) { /* noop */ }
          setServiceConfigured(!(status === 503 || /not configured/i.test(msg)));
        } else {
          setServiceConfigured(true);
          void data;
        }
      } catch {
        setServiceConfigured(null);
      }
    })();
  }, []);

  const sendCampaign = async (c: any) => {
    if (c.status !== "ready") return toast.error("الحملة ليست جاهزة للإرسال.");
    const word = prompt(
      `Stai per inviare "${c.title}" a tutti gli iscritti attivi.\nScrivi INVIA per confermare.`,
    );
    if (word !== "INVIA") return;
    setSendingId(c.id);
    try {
      const { data, error } = await supabase.functions.invoke("send-newsletter-campaign", {
        body: { campaign_id: c.id },
      });
      if (error) {
        let msg = error.message;
        try {
          const ctx: any = (error as any).context;
          if (ctx?.json) {
            const j = await ctx.json();
            if (j?.message) msg = j.message;
            else if (j?.error) msg = j.error;
          }
        } catch (_e) { /* noop */ }
        throw new Error(msg);
      }
      const d: any = data || {};
      toast.success(`Inviati: ${d.sent ?? 0} • Errori: ${d.failed ?? 0}`);
      loadCampaigns();
    } catch (err: any) {
      toast.error(err?.message || "Invio fallito");
    } finally {
      setSendingId(null);
    }
  };

  const sendTest = async (c: any) => {
    if (!testEmail.trim()) return toast.error("Inserisci un'email di test.");
    setTestingId(c.id);
    try {
      const { data, error } = await supabase.functions.invoke("send-newsletter-test", {
        body: { campaign_id: c.id, test_email: testEmail.trim() },
      });
      if (error) {
        let msg = error.message;
        try {
          const ctx: any = (error as any).context;
          if (ctx?.json) {
            const j = await ctx.json();
            if (j?.message) msg = j.message;
            else if (j?.error) msg = j.error;
          }
        } catch (_e) { /* noop */ }
        throw new Error(msg);
      }
      toast.success(`Test inviato a ${(data as any)?.to ?? testEmail}`);
    } catch (err: any) {
      toast.error(err?.message || "Invio test fallito");
    } finally {
      setTestingId(null);
    }
  };

  const activeCount = rows?.filter((r) => (r.status ?? "active") === "active").length ?? 0;
  const unsubCount = rows?.filter((r) => r.status === "unsubscribed").length ?? 0;

  return (
    <div>
      <PageHeader
        title="النشرة البريدية"
        description={`الإجمالي: ${rows?.length ?? "—"} • النشطون: ${activeCount} • الملغون: ${unsubCount}`}
        actions={
          <Button variant="outline" onClick={exportCsv} disabled={!rows?.length}>
            <Download className="h-4 w-4" /> تصدير CSV
          </Button>
        }
      />

      <Tabs defaultValue="subscribers">
        <TabsList>
          <TabsTrigger value="subscribers">المشتركون</TabsTrigger>
          <TabsTrigger value="campaigns">الحملات</TabsTrigger>
        </TabsList>

        <TabsContent value="subscribers" className="mt-4">
          <Card className="p-3 mb-3 flex flex-wrap gap-2 items-center">
            <Input placeholder="ابحث عن بريد إلكتروني..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="unsubscribed">ملغى</SelectItem>
              </SelectContent>
            </Select>
          </Card>

          {rows === null ? (
            <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
          ) : rows.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground">لا يوجد مشتركون.</Card>
          ) : (
            <Card className="overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-right">
                  <tr>
                    <th className="p-3">البريد</th>
                    <th className="p-3">الحالة</th>
                    <th className="p-3">المصدر</th>
                    <th className="p-3">تاريخ الاشتراك</th>
                    <th className="p-3 w-44">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => {
                    const status = s.status ?? "active";
                    return (
                      <tr key={s.id} className="border-t">
                        <td className="p-3" dir="ltr">{s.email}</td>
                        <td className="p-3">
                          <Badge variant={status === "active" ? "default" : "outline"}>
                            {status === "active" ? "نشط" : "ملغى"}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground text-xs">{s.source ?? "—"}</td>
                        <td className="p-3 text-muted-foreground">{formatDateTime(s.subscribed_at)}</td>
                        <td className="p-3 flex gap-1">
                          {status === "active" ? (
                            <Button size="sm" variant="ghost" onClick={() => unsubscribe(s.id)} title="إلغاء الاشتراك">
                              <UserX className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => reactivate(s.id)}>إعادة تفعيل</Button>
                          )}
                          {isSuperAdmin && (
                            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => remove(s.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="campaigns" className="mt-4 space-y-4">
          <Card
            className={
              "p-4 flex items-start gap-2 " +
              (serviceConfigured
                ? "border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20"
                : "border-amber-300 bg-amber-50/50 dark:bg-amber-950/20")
            }
          >
            <AlertCircle
              className={
                "h-5 w-5 mt-0.5 " +
                (serviceConfigured ? "text-emerald-600" : "text-amber-600")
              }
            />
            <div className="text-sm space-y-1">
              <div>
                {serviceConfigured === null ? (
                  <strong>Verifico stato servizio email…</strong>
                ) : serviceConfigured ? (
                  <strong>Servizio email configurato.</strong>
                ) : (
                  <>
                    <strong>Servizio email non ancora configurato.</strong>{" "}
                    Aggiungi <code>RESEND_API_KEY</code> per attivare l'invio reale.
                  </>
                )}
              </div>
              <div className="text-muted-foreground text-xs">
                المرسِل: <span dir="ltr">{(settings as any).newsletter_sender_email || "newsletter@alazharscholarunion.it"}</span>
                {" • "}إشعارات الأخطاء: <span dir="ltr">{(settings as any).admin_notification_email || "info@alazharscholarunion.it"}</span>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <Label htmlFor="test-email">Email di test</Label>
            <Input
              id="test-email"
              dir="ltr"
              type="email"
              placeholder="tu@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="max-w-sm mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Usa il bottone "Test" su una campagna qui sotto per inviare un'anteprima a questa email.
            </p>
          </Card>

          <Card className="p-4">
            <h3 className="font-bold mb-3">إنشاء حملة جديدة</h3>
            <div className="space-y-3">
              <div>
                <Label>العنوان</Label>
                <Input value={cTitle} onChange={(e) => setCTitle(e.target.value)} maxLength={300} />
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label>النوع</Label>
                  <Select value={cType} onValueChange={setCType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(CAMPAIGN_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>الحالة</Label>
                  <Select value={cStatus} onValueChange={setCStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">مسودة</SelectItem>
                      <SelectItem value="ready">جاهزة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>المحتوى</Label>
                <Textarea rows={5} value={cContent} onChange={(e) => setCContent(e.target.value)} />
              </div>
              <Button onClick={createCampaign}><Plus className="h-4 w-4" /> إنشاء</Button>
            </div>
          </Card>

          {campaigns === null ? (
            <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
          ) : campaigns.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">لا توجد حملات بعد.</Card>
          ) : (
            <div className="space-y-2">
              {campaigns.map((c) => (
                <Card key={c.id} className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="font-semibold">{c.title}</div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline">{CAMPAIGN_TYPES[c.type]}</Badge>
                        <Badge>{CAMPAIGN_STATUS[c.status]}</Badge>
                        <span className="text-xs text-muted-foreground">{formatDateTime(c.created_at)}</span>
                      </div>
                      {c.content && <p className="text-sm text-muted-foreground mt-2 line-clamp-2 whitespace-pre-wrap">{c.content}</p>}
                    </div>
                    <div className="flex gap-1">
                      {c.status === "ready" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendCampaign(c)}
                          disabled={sendingId === c.id}
                        >
                          {sendingId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          إرسال
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeCampaign(c.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

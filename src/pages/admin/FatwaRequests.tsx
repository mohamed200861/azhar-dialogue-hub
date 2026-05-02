import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Mail, Phone, Globe, AlertTriangle, Paperclip, Save } from "lucide-react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/admin-utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const STATUS: Record<string, string> = {
  new: "جديد",
  under_review: "قيد المراجعة",
  answered: "تم الرد",
  closed: "مغلق",
  rejected: "مرفوض",
};
const TYPES: Record<string, string> = {
  fatwa: "طلب فتوى",
  arbitration: "طلب تحكيم شرعي",
  family_consult: "استشارة أسرية",
  financial_consult: "استشارة مالية",
  other: "أخرى",
};

export default function FatwaRequestsAdmin() {
  const { isSuperAdmin } = useAuth();
  const [rows, setRows] = useState<any[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);

  const load = async () => {
    setRows(null);
    let q = supabase.from("fatwa_arbitration_requests").select("*").order("created_at", { ascending: false });
    if (statusFilter !== "all") q = q.eq("status", statusFilter as any);
    if (typeFilter !== "all") q = q.eq("request_type", typeFilter as any);
    if (urgentOnly) q = q.eq("is_urgent", true);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, [statusFilter, typeFilter, urgentOnly]);

  const openDetail = async (r: any) => {
    setSelected(r);
    setEditing({ status: r.status, admin_notes: r.admin_notes ?? "", response_text: r.response_text ?? "" });
    setAttachmentUrl(null);
    if (r.attachment_url) {
      const { data } = await supabase.storage.from("fatwa-attachments").createSignedUrl(r.attachment_url, 600);
      setAttachmentUrl(data?.signedUrl ?? null);
    }
  };

  const save = async () => {
    if (!selected) return;
    const { error } = await supabase
      .from("fatwa_arbitration_requests")
      .update({
        status: editing.status,
        admin_notes: editing.admin_notes || null,
        response_text: editing.response_text || null,
      })
      .eq("id", selected.id);
    if (error) return toast.error(error.message);
    toast.success("تم الحفظ");
    setSelected(null);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("fatwa_arbitration_requests").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف");
    load();
  };

  return (
    <div>
      <PageHeader
        title="الفتوى والتحكيم الشرعي"
        description="إدارة طلبات الفتاوى والتحكيم الواردة من الموقع."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant={urgentOnly ? "default" : "outline"} size="sm" onClick={() => setUrgentOnly((v) => !v)}>
              <AlertTriangle className="h-4 w-4" /> العاجل فقط
            </Button>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                {Object.entries(STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأنواع</SelectItem>
                {Object.entries(TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        }
      />

      {rows === null ? (
        <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
      ) : rows.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">لا توجد طلبات.</Card>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{r.full_name}</span>
                    <Badge variant="outline">{TYPES[r.request_type]}</Badge>
                    {r.is_urgent && <Badge className="bg-destructive">عاجل</Badge>}
                    {r.attachment_url && <Badge variant="secondary"><Paperclip className="h-3 w-3" /> مرفق</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-3">
                    <span dir="ltr"><Mail className="inline h-3 w-3" /> {r.email}</span>
                    {r.phone && <span dir="ltr"><Phone className="inline h-3 w-3" /> {r.phone}</span>}
                    {r.country && <span><Globe className="inline h-3 w-3" /> {r.country}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{STATUS[r.status]}</Badge>
                  <span className="text-xs text-muted-foreground">{formatDateTime(r.created_at)}</span>
                </div>
              </div>
              <div className="text-sm font-medium mb-1">{r.subject}</div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3 whitespace-pre-wrap">{r.message}</p>
              <div className="flex flex-wrap gap-2">
                <Dialog open={selected?.id === r.id} onOpenChange={(o) => !o && setSelected(null)}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" onClick={() => openDetail(r)}>عرض التفاصيل</Button>
                  </DialogTrigger>
                  {selected?.id === r.id && editing && (
                    <DialogContent dir="rtl" className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{selected.subject}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 text-sm">
                        <div className="grid grid-cols-2 gap-2 p-3 bg-muted/40 rounded">
                          <div><strong>الاسم:</strong> {selected.full_name}</div>
                          <div dir="ltr"><strong>Email:</strong> {selected.email}</div>
                          {selected.phone && <div dir="ltr"><strong>Phone:</strong> {selected.phone}</div>}
                          {selected.country && <div><strong>الدولة:</strong> {selected.country}</div>}
                          <div><strong>النوع:</strong> {TYPES[selected.request_type]}</div>
                          <div><strong>الحالة:</strong> {STATUS[selected.status]}</div>
                          {selected.is_urgent && <div className="text-destructive font-bold">⚠ طلب عاجل</div>}
                        </div>
                        <div>
                          <Label>وصف الطلب</Label>
                          <div className="p-3 bg-muted/30 rounded whitespace-pre-wrap mt-1">{selected.message}</div>
                        </div>
                        {attachmentUrl && (
                          <div>
                            <Label>المرفق</Label>
                            <div className="mt-1">
                              <a href={attachmentUrl} target="_blank" rel="noreferrer" className="text-primary underline inline-flex items-center gap-1">
                                <Paperclip className="h-4 w-4" /> فتح المرفق (رابط مؤقت)
                              </a>
                            </div>
                          </div>
                        )}
                        <div>
                          <Label>الحالة</Label>
                          <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>ملاحظات داخلية (لا تُرسل للمستخدم)</Label>
                          <Textarea rows={3} value={editing.admin_notes} onChange={(e) => setEditing({ ...editing, admin_notes: e.target.value })} />
                        </div>
                        <div>
                          <Label>الرد الداخلي</Label>
                          <Textarea rows={5} value={editing.response_text} onChange={(e) => setEditing({ ...editing, response_text: e.target.value })} />
                        </div>
                      </div>
                      <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setSelected(null)}>إلغاء</Button>
                        <Button onClick={save}><Save className="h-4 w-4" /> حفظ</Button>
                      </DialogFooter>
                    </DialogContent>
                  )}
                </Dialog>

                <Button size="sm" variant="outline" asChild>
                  <a href={`mailto:${r.email}?subject=${encodeURIComponent("رد: " + r.subject)}`}>
                    <Mail className="h-3.5 w-3.5" /> رد عبر البريد
                  </a>
                </Button>

                {isSuperAdmin && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="text-destructive">
                        <Trash2 className="h-3.5 w-3.5" /> حذف
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent dir="rtl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>حذف الطلب</AlertDialogTitle>
                        <AlertDialogDescription>سيتم الحذف نهائيًا.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={() => remove(r.id)} className="bg-destructive">حذف</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

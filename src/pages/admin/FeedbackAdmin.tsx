import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Check, X, Trash2, ExternalLink, Star } from "lucide-react";
import { toast } from "sonner";

const ENTITY_LABELS: Record<string, string> = {
  news: "خبر", event: "فعالية", video: "مرئي", library: "مكتبة",
  research: "بحوث", academy: "أكاديمية", dialogue: "حوار",
  fatwa: "فتوى", page: "صفحة",
};
const STATUS_LABELS: Record<string, string> = {
  pending: "جديد", approved: "معتمد", rejected: "مرفوض",
};

export default function FeedbackAdmin() {
  const [items, setItems] = useState<any[] | null>(null);
  const [status, setStatus] = useState<string>("pending");
  const [entityType, setEntityType] = useState<string>("all");
  const [working, setWorking] = useState<string | null>(null);

  const load = async () => {
    let q = supabase.from("reader_feedback").select("*").order("created_at", { ascending: false }).limit(200);
    if (status !== "all") q = q.eq("status", status);
    if (entityType !== "all") q = q.eq("entity_type", entityType);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setItems(data ?? []);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status, entityType]);

  const update = async (id: string, newStatus: "approved" | "rejected") => {
    setWorking(id);
    const { error } = await supabase.from("reader_feedback").update({ status: newStatus }).eq("id", id);
    setWorking(null);
    if (error) return toast.error(error.message);
    toast.success("تم التحديث");
    load();
  };
  const remove = async (id: string) => {
    if (!confirm("حذف هذه المراجعة؟")) return;
    setWorking(id);
    const { error } = await supabase.from("reader_feedback").delete().eq("id", id);
    setWorking(null);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف");
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">آراء القراء</h1>
        <p className="text-sm text-muted-foreground">إدارة التقييمات والتعليقات المرسلة من زوار الموقع.</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            <SelectItem value="pending">جديد</SelectItem>
            <SelectItem value="approved">معتمد</SelectItem>
            <SelectItem value="rejected">مرفوض</SelectItem>
          </SelectContent>
        </Select>
        <Select value={entityType} onValueChange={setEntityType}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأنواع</SelectItem>
            {Object.entries(ENTITY_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {items === null ? (
        <Card className="p-10 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></Card>
      ) : items.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">لا توجد مراجعات.</Card>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <Card key={it.id} className="p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold">{it.author_name}</span>
                  {it.author_email && <span className="text-xs text-muted-foreground" dir="ltr">{it.author_email}</span>}
                  <Badge variant={it.status === "approved" ? "default" : it.status === "rejected" ? "destructive" : "secondary"}>
                    {STATUS_LABELS[it.status]}
                  </Badge>
                  <Badge variant="outline">{ENTITY_LABELS[it.entity_type] || it.entity_type}</Badge>
                </div>
                <div className="flex" dir="ltr">
                  {[1,2,3,4,5].map((i) => (
                    <Star key={i} className={`h-4 w-4 ${i <= it.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />
                  ))}
                </div>
              </div>
              {it.comment && <p className="text-sm mb-2 whitespace-pre-wrap">{it.comment}</p>}
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>{new Date(it.created_at).toLocaleString("ar-EG")}</span>
                  {it.page_path && (
                    <a href={it.page_path} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary">
                      <ExternalLink className="h-3 w-3" /> {it.page_path}
                    </a>
                  )}
                </div>
                <div className="flex gap-1">
                  {it.status !== "approved" && (
                    <Button size="sm" variant="outline" disabled={working === it.id} onClick={() => update(it.id, "approved")}>
                      <Check className="h-4 w-4" /> اعتماد
                    </Button>
                  )}
                  {it.status !== "rejected" && (
                    <Button size="sm" variant="outline" disabled={working === it.id} onClick={() => update(it.id, "rejected")}>
                      <X className="h-4 w-4" /> رفض
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" disabled={working === it.id} onClick={() => remove(it.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

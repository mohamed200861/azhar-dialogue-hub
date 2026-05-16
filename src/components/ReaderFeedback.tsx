import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Loader2, CheckCircle2, MessageSquarePlus, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type EntityType =
  | "news" | "event" | "video" | "library" | "research"
  | "academy" | "dialogue" | "fatwa" | "page";

interface Props {
  entityType: EntityType;
  entityId?: string | null;
  pagePath?: string;
}

const HTML_RX = /<[a-z!/]/i;

export function ReaderFeedback({ entityType, entityId, pagePath }: Props) {
  const [avg, setAvg] = useState<number | null>(null);
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const path = pagePath || (typeof window !== "undefined" ? window.location.pathname : "");

  useEffect(() => {
    (async () => {
      let q = supabase
        .from("reader_feedback")
        .select("rating", { count: "exact" })
        .eq("status", "approved")
        .eq("entity_type", entityType);
      if (entityId) q = q.eq("entity_id", entityId);
      else if (path) q = q.eq("page_path", path);
      const { data, count: c } = await q;
      if (data && data.length) {
        const sum = data.reduce((a: number, r: any) => a + (r.rating || 0), 0);
        setAvg(sum / data.length);
        setCount(c ?? data.length);
      } else {
        setAvg(null);
        setCount(0);
      }
    })();
  }, [entityType, entityId, path]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) { toast.error("الرجاء اختيار التقييم بالنجوم"); return; }
    const n = name.trim();
    if (n.length < 1 || n.length > 120) { toast.error("الرجاء إدخال اسم صحيح"); return; }
    if (HTML_RX.test(n) || (comment && HTML_RX.test(comment))) { toast.error("لا يُسمح باستخدام رموز HTML"); return; }
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { toast.error("البريد الإلكتروني غير صحيح"); return; }
    if (comment && comment.length > 2000) { toast.error("التعليق طويل جدًا"); return; }
    setSending(true);
    try {
      const { error } = await supabase.from("reader_feedback").insert({
        entity_type: entityType,
        entity_id: entityId ?? null,
        page_path: path || null,
        author_name: n,
        author_email: email.trim() || null,
        rating,
        comment: comment.trim() || null,
        status: "pending",
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 300) : null,
      });
      if (error) throw error;
      setSent(true);
      setRating(0); setName(""); setEmail(""); setComment("");
    } catch (err: any) {
      console.error(err);
      toast.error("تعذّر إرسال التقييم. حاول لاحقًا.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-10 border-t pt-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h3 className="text-sm font-bold">ما رأيك في هذا المحتوى؟</h3>
          <p className="text-xs text-muted-foreground mt-0.5">يسعدنا معرفة رأيك لتحسين المحتوى والخدمة.</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {count > 0 && avg !== null && (
            <div className="flex items-center gap-1.5">
              <span className="font-semibold">{avg.toFixed(1)}</span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className={`h-3.5 w-3.5 ${i <= Math.round(avg) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />
                ))}
              </div>
              <span className="text-muted-foreground">({count})</span>
            </div>
          )}
          {!sent && (
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen((o) => !o)} className="h-8">
              {open ? <><ChevronUp className="h-3.5 w-3.5" /> إغلاق</> : <><MessageSquarePlus className="h-3.5 w-3.5" /> اترك تقييمك</>}
            </Button>
          )}
        </div>
      </div>

      <Collapsible open={open && !sent}>
        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
          <form onSubmit={submit} className="mt-4 space-y-3 rounded-lg border bg-card/50 p-4">
            <div className="flex items-center gap-0.5" dir="ltr">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`${i} نجوم`}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(i)}
                  className="p-0.5"
                >
                  <Star className={`h-5 w-5 transition-colors ${
                    (hover || rating) >= i ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"
                  }`} />
                </button>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              <div>
                <Label className="text-[11px]">الاسم *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required className="h-8" />
              </div>
              <div>
                <Label className="text-[11px]">البريد الإلكتروني (اختياري)</Label>
                <Input dir="ltr" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={320} className="h-8" />
              </div>
            </div>
            <div>
              <Label className="text-[11px]">تعليق (اختياري)</Label>
              <Textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} maxLength={2000} className="min-h-[64px] resize-none" />
            </div>
            <Button type="submit" disabled={sending || rating === 0} size="sm" className="h-8">
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              إرسال التقييم
            </Button>
          </form>
        </CollapsibleContent>
      </Collapsible>

      {sent && (
        <div className="mt-3 flex items-center gap-2 text-sm text-primary">
          <CheckCircle2 className="h-4 w-4" />
          جزاك الله خيرًا، شكرًا لمشاركتك رأيك معنا.
        </div>
      )}
    </div>
  );
}

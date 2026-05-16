import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

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
    if (rating < 1 || rating > 5) {
      toast.error("الرجاء اختيار التقييم بالنجوم");
      return;
    }
    const n = name.trim();
    if (n.length < 1 || n.length > 120) {
      toast.error("الرجاء إدخال اسم صحيح");
      return;
    }
    if (HTML_RX.test(n) || (comment && HTML_RX.test(comment))) {
      toast.error("لا يُسمح باستخدام رموز HTML");
      return;
    }
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast.error("البريد الإلكتروني غير صحيح");
      return;
    }
    if (comment && comment.length > 2000) {
      toast.error("التعليق طويل جدًا");
      return;
    }
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
    <Card className="p-5 md:p-6 mt-8">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h3 className="text-lg font-bold">ما رأيك في هذا المحتوى؟</h3>
        {count > 0 && avg !== null && (
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">{avg.toFixed(1)}</span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className={`h-4 w-4 ${i <= Math.round(avg) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />
              ))}
            </div>
            <span className="text-muted-foreground">— {count} تقييمًا</span>
          </div>
        )}
      </div>

      {sent ? (
        <div className="flex items-center gap-2 text-sm text-primary">
          <CheckCircle2 className="h-5 w-5" />
          شكرًا لك، تم إرسال تقييمك للمراجعة.
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <div className="flex items-center gap-1" dir="ltr">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                aria-label={`${i} نجوم`}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(i)}
                className="p-1"
              >
                <Star className={`h-7 w-7 transition-colors ${
                  (hover || rating) >= i ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"
                }`} />
              </button>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">الاسم *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required />
            </div>
            <div>
              <Label className="text-xs">البريد الإلكتروني (اختياري)</Label>
              <Input dir="ltr" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={320} />
            </div>
          </div>
          <div>
            <Label className="text-xs">تعليق (اختياري)</Label>
            <Textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} maxLength={2000} />
          </div>
          <Button type="submit" disabled={sending || rating === 0} size="sm">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            إرسال التقييم
          </Button>
        </form>
      )}
    </Card>
  );
}

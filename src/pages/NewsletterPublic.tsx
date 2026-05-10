import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/SiteLayout";
import { PageHero } from "@/components/PageHero";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Mail, Loader2, CheckCircle2, Newspaper, Calendar, BookOpen, PlayCircle, Radio, Scale } from "lucide-react";
import { applySeo } from "@/lib/seo";

const emailSchema = z.string().trim().email("البريد الإلكتروني غير صحيح").max(320);

const TOPICS = [
  { icon: Newspaper, label: "أخبار الاتحاد والبيانات" },
  { icon: Calendar, label: "الفعاليات" },
  { icon: BookOpen, label: "المكتبة" },
  { icon: PlayCircle, label: "المرئيات" },
  { icon: Radio, label: "البث المباشر" },
  { icon: Scale, label: "الفتوى والتحكيم الشرعي" },
];

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setLoading(true);
    try {
      const clean = email.trim().toLowerCase();
      const { data: existing } = await supabase
        .from("newsletter_subscribers")
        .select("id,status")
        .eq("email", clean)
        .maybeSingle();
      if (existing) {
        toast.info("هذا البريد الإلكتروني مشترك بالفعل.");
        setDone(true);
        return;
      }
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email: clean, source: "newsletter_page" });
      if (error) throw error;
      toast.success("تم الاشتراك في نشرة الأخبار بنجاح.");
      setDone(true);
    } catch (err: any) {
      console.error(err);
      toast.error("تعذّر إتمام الاشتراك. يرجى المحاولة لاحقًا.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteLayout>
      <PageHero
        eyebrow="ابقَ على اطلاع دائم"
        title="نشرة الأخبار"
        description="اشترك ليصلك كل جديد من أخبار الاتحاد وفعالياته وإصداراته."
      />

      <section className="container-narrow py-12 md:py-16">
        <Card className="p-6 md:p-10 max-w-2xl mx-auto">
          {done ? (
            <div className="text-center py-6">
              <CheckCircle2 className="h-14 w-14 text-primary mx-auto mb-3" />
              <h3 className="text-xl font-bold mb-2">شكرًا لاشتراكك</h3>
              <p className="text-muted-foreground">سنوافيك بكل جديد عند توفّره.</p>
            </div>
          ) : (
            <form onSubmit={subscribe} className="space-y-4">
              <div className="text-center mb-4">
                <Mail className="h-10 w-10 text-primary mx-auto mb-3" />
                <h2 className="text-2xl font-bold">اشترك الآن</h2>
                <p className="text-sm text-muted-foreground mt-1">أدخل بريدك الإلكتروني لتصلك آخر التحديثات.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="email"
                  dir="ltr"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={320}
                />
                <Button type="submit" disabled={loading} size="lg">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  اشترك الآن
                </Button>
              </div>
            </form>
          )}
        </Card>

        <div className="mt-10">
          <h3 className="text-lg font-bold mb-4 text-center">ماذا ستصلك؟</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 max-w-3xl mx-auto">
            {TOPICS.map((t) => (
              <div key={t.label} className="flex items-center gap-3 p-3 rounded-md border bg-card">
                <t.icon className="h-5 w-5 text-primary" />
                <span className="text-sm">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

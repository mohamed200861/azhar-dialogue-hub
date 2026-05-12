import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Newspaper, Calendar, BookOpen, PlayCircle, GraduationCap, Microscope, MessagesSquare } from "lucide-react";

type Stats = {
  news: number; events: number; videos: number; library: number;
  research: number; academy: number; dialogue: number;
};

const ITEMS: { key: keyof Stats; label: string; icon: React.ElementType }[] = [
  { key: "news",     label: "الأخبار المنشورة",   icon: Newspaper },
  { key: "events",   label: "الفعاليات",            icon: Calendar },
  { key: "videos",   label: "المرئيات",             icon: PlayCircle },
  { key: "library",  label: "عناصر المكتبة",        icon: BookOpen },
  { key: "research", label: "البحوث والدراسات",     icon: Microscope },
  { key: "academy",  label: "البرامج العلمية",      icon: GraduationCap },
  { key: "dialogue", label: "المبادرات الحوارية",   icon: MessagesSquare },
];

export function PublicStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc("get_public_stats");
      if (data) setStats(data as Stats);
    })();
  }, []);

  if (!stats) return null;
  const visible = ITEMS.filter((it) => (stats[it.key] ?? 0) > 0);
  if (visible.length === 0) return null;

  return (
    <section className="section-padding bg-background" aria-labelledby="stats-heading">
      <div className="container-narrow">
        <div className="text-center mb-10">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">أرقامنا</span>
          <h2 id="stats-heading" className="heading-section mt-3">الإحصائيات</h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto leading-relaxed">
            نظرة موجزة على ما نقدمه من محتوى علمي ودعوي عبر منصات الاتحاد.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {visible.map((it) => {
            const Icon = it.icon;
            return (
              <div
                key={it.key}
                className="rounded-2xl border bg-card p-5 text-center hover:shadow-elegant transition-shadow"
              >
                <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="text-3xl font-bold text-foreground tabular-nums">
                  {stats[it.key]}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{it.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

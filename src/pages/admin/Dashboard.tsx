import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Newspaper, BookOpen, PlayCircle, Calendar, MessageSquare, Mail, Radio, Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { formatDateTime } from "@/lib/admin-utils";

interface Counts {
  news: number;
  library: number;
  videos: number;
  events: number;
  messages: number;
  subscribers: number;
}

const cards = [
  { key: "news", label: "عدد الأخبار", icon: Newspaper, to: "/admin/news", color: "text-primary bg-primary/10" },
  { key: "library", label: "عناصر المكتبة", icon: BookOpen, to: "/admin/library", color: "text-primary bg-primary/10" },
  { key: "videos", label: "المرئيات", icon: PlayCircle, to: "/admin/videos", color: "text-crimson bg-crimson/10" },
  { key: "events", label: "الفعاليات", icon: Calendar, to: "/admin/events", color: "text-primary bg-primary/10" },
  { key: "messages", label: "رسائل التواصل", icon: MessageSquare, to: "/admin/messages", color: "text-primary bg-primary/10" },
  { key: "subscribers", label: "المشتركون في النشرة", icon: Mail, to: "/admin/newsletter", color: "text-primary bg-primary/10" },
] as const;

export default function Dashboard() {
  const { } = useAuth();
  const [counts, setCounts] = useState<Counts | null>(null);
  const [latestNews, setLatestNews] = useState<any[]>([]);
  const [upcomingLive, setUpcomingLive] = useState<any[]>([]);

  useEffect(() => {
    document.title = "لوحة التحكم — اتحاد علماء الأزهر";
    (async () => {
      const tables: Array<[keyof Counts, string]> = [
        ["news", "news_posts"],
        ["library", "library_items"],
        ["videos", "videos"],
        ["events", "events"],
        ["messages", "contact_messages"],
        ["subscribers", "newsletter_subscribers"],
      ];
      const result: any = {};
      await Promise.all(
        tables.map(async ([k, t]) => {
          const { count } = await supabase.from(t as any).select("*", { count: "exact", head: true });
          result[k] = count ?? 0;
        })
      );
      setCounts(result);

      const { data: news } = await supabase
        .from("news_posts")
        .select("id,title,status,updated_at,category")
        .order("updated_at", { ascending: false })
        .limit(5);
      setLatestNews(news ?? []);

      const { data: live } = await supabase
        .from("videos")
        .select("id,title,scheduled_at,live_status,type")
        .in("type", ["live"])
        .in("live_status", ["scheduled", "live"])
        .order("scheduled_at", { ascending: true })
        .limit(5);
      setUpcomingLive(live ?? []);
    })();
  }, []);

  return (
    <div>
      <PageHeader title="لوحة التحكم" description="نظرة عامة على محتوى الموقع وأنشطة الاتحاد." />



      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.key} to={c.to}>
              <Card className="hover:shadow-elegant transition-shadow">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${c.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground">{c.label}</div>
                    <div className="text-2xl font-bold mt-0.5">
                      {counts ? counts[c.key] : <Loader2 className="h-5 w-5 animate-spin" />}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Newspaper className="h-4 w-4 text-primary" />
              آخر المحتويات المنشورة والمسودات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {latestNews.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                لا يوجد محتوى بعد. ابدأ بإضافة خبر جديد.
              </p>
            ) : (
              <ul className="divide-y">
                {latestNews.map((n) => (
                  <li key={n.id} className="py-2.5 flex items-center justify-between gap-3">
                    <Link to={`/admin/news/${n.id}`} className="text-sm font-medium hover:text-primary truncate flex-1">
                      {n.title}
                    </Link>
                    <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {n.status === "published" ? "منشور" : n.status === "draft" ? "مسودة" : "أرشيف"}
                    </span>
                    <span className="text-xs text-muted-foreground hidden sm:inline">{formatDateTime(n.updated_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Radio className="h-4 w-4 text-crimson" />
              البث القادم
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingLive.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                لا توجد بثوث مجدولة حاليًا.
              </p>
            ) : (
              <ul className="divide-y">
                {upcomingLive.map((v) => (
                  <li key={v.id} className="py-2.5 flex items-center justify-between gap-3">
                    <Link to={`/admin/videos/${v.id}`} className="text-sm font-medium hover:text-primary truncate flex-1">
                      {v.title}
                    </Link>
                    <span className="text-xs text-muted-foreground">{formatDateTime(v.scheduled_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

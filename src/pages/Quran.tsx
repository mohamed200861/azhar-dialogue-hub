import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/SiteLayout";
import { PageHero } from "@/components/PageHero";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ReaderFeedback } from "@/components/ReaderFeedback";
import { SmartImage } from "@/components/SmartImage";
import { applySeo } from "@/lib/seo";
import { BookMarked, PlayCircle, Search, GraduationCap, Star } from "lucide-react";
import { Link } from "react-router-dom";

type Cat = { id: string; slug: string; title: string };
type Teacher = { id: string; name: string; bio: string | null; photo_url: string | null };
type Lesson = {
  id: string; slug: string; title: string; description: string | null;
  thumbnail: string | null; teacher_id: string | null; category_id: string | null;
  duration: string | null; is_featured: boolean;
};

export default function Quran() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("");

  useEffect(() => {
    applySeo({ title: "هيئة القرآن الكريم — اتحاد علماء الأزهر", description: "دروس ودورات في تلاوة وتجويد وحفظ وتفسير القرآن الكريم." });
    document.title = "هيئة القرآن الكريم — اتحاد علماء الأزهر";
    (async () => {
      const [c, t, l] = await Promise.all([
        supabase.from("quran_categories").select("id,slug,title").eq("is_active", true).order("sort_order"),
        supabase.from("quran_teachers").select("id,name,bio,photo_url").eq("is_active", true).order("sort_order").limit(8),
        supabase.from("quran_lessons").select("id,slug,title,description,thumbnail,teacher_id,category_id,duration,is_featured")
          .eq("publish_status", "published").order("is_featured", { ascending: false }).order("sort_order").limit(60),
      ]);
      setCats((c.data ?? []) as Cat[]);
      setTeachers((t.data ?? []) as Teacher[]);
      setLessons((l.data ?? []) as Lesson[]);
    })();
  }, []);

  const filtered = (lessons ?? []).filter((l) =>
    (!cat || l.category_id === cat) &&
    (!q.trim() || (l.title + " " + (l.description ?? "")).toLowerCase().includes(q.trim().toLowerCase()))
  );
  const featured = filtered.filter((l) => l.is_featured).slice(0, 3);
  const rest = filtered.filter((l) => !l.is_featured);

  return (
    <SiteLayout>
      <PageHero
        eyebrow="هيئة القرآن الكريم"
        title="القرآن الكريم"
        description="دروس وبرامج علمية في علوم القرآن: التلاوة، التجويد، الحفظ، التفسير، بإشراف نخبة من القراء والمعلمين."
      />

      <section className="container-wide py-10">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="h-4 w-4 absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="ابحث في الدروس…" value={q} onChange={(e) => setQ(e.target.value)} className="ps-3 pe-9" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setCat("")} className={`px-3 py-1.5 rounded-full text-xs ${!cat ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/80"}`}>الكل</button>
            {cats.map((c) => (
              <button key={c.id} onClick={() => setCat(c.id)} className={`px-3 py-1.5 rounded-full text-xs ${cat === c.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/80"}`}>{c.title}</button>
            ))}
          </div>
        </div>

        {lessons === null ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0,1,2,3,4,5].map((i) => (
              <div key={i} className="card-elegant overflow-hidden">
                <Skeleton className="aspect-video w-full rounded-none" />
                <div className="p-5 space-y-2"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-1/2" /></div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">لا توجد دروس متاحة حاليًا.</Card>
        ) : (
          <>
            {featured.length > 0 && (
              <>
                <h2 className="heading-section mb-4 flex items-center gap-2"><Star className="h-5 w-5 text-amber-400" /> دروس مميزة</h2>
                <div className="grid md:grid-cols-3 gap-5 mb-10">
                  {featured.map((l) => <LessonCard key={l.id} l={l} />)}
                </div>
              </>
            )}
            <h2 className="heading-section mb-4">جميع الدروس</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {rest.map((l) => <LessonCard key={l.id} l={l} />)}
            </div>
          </>
        )}
      </section>

      {teachers.length > 0 && (
        <section className="bg-gradient-soft py-12">
          <div className="container-wide">
            <h2 className="heading-section text-center mb-6">معلمو القرآن الكريم</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {teachers.map((t) => (
                <Card key={t.id} className="p-5 text-center">
                  <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-3 overflow-hidden">
                    {t.photo_url ? <img src={t.photo_url} alt={t.name} className="w-full h-full object-cover" loading="lazy" /> :
                      <div className="w-full h-full flex items-center justify-center bg-gradient-emerald text-primary-foreground"><GraduationCap className="h-8 w-8" /></div>}
                  </div>
                  <div className="font-bold">{t.name}</div>
                  {t.bio && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{t.bio}</p>}
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section-padding pt-10">
        <div className="container-narrow">
          <ReaderFeedback entityType="page" pagePath="/quran" />
        </div>
      </section>
    </SiteLayout>
  );
}

function LessonCard({ l }: { l: Lesson }) {
  return (
    <Link to={`/quran/${l.slug}`} className="card-elegant overflow-hidden group">
      <div className="aspect-video bg-muted overflow-hidden">
        <SmartImage src={l.thumbnail} alt={l.title} variant="news" fallbackClassName="bg-gradient-emerald" className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
      </div>
      <div className="p-5">
        <h3 className="font-bold text-lg mb-1.5 line-clamp-2">{l.title}</h3>
        {l.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{l.description}</p>}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <BookMarked className="h-3.5 w-3.5" />
          {l.duration && <span>{l.duration}</span>}
          <PlayCircle className="h-3.5 w-3.5 mr-auto ml-0 text-primary" />
        </div>
      </div>
    </Link>
  );
}

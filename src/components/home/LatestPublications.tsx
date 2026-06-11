import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ui } from "@/i18n/content";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchLatestPublications,
  PUBLICATION_TABLES,
  type PublicationItem,
} from "@/lib/latest-publications";
import { PublicationCard } from "./PublicationCard";

const VISIBLE_LIMIT = 12;

export function LatestPublications() {
  const [items, setItems] = useState<PublicationItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    let reloadTimer: ReturnType<typeof setTimeout> | null = null;

    const load = async () => {
      const data = await fetchLatestPublications(VISIBLE_LIMIT);
      if (!cancelled) setItems(data);
    };

    load();

    // Debounced realtime refresh: any publish/update in connected tables
    // triggers a re-fetch so newly published content appears automatically.
    const channel = supabase.channel("home_latest_publications");
    for (const table of PUBLICATION_TABLES) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => {
          if (reloadTimer) clearTimeout(reloadTimer);
          reloadTimer = setTimeout(load, 800);
        },
      );
    }
    channel.subscribe();

    return () => {
      cancelled = true;
      if (reloadTimer) clearTimeout(reloadTimer);
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <section className="section-padding bg-gradient-soft" aria-labelledby="latest-publications-heading">
      <div className="container-wide">
        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            <span className="eyebrow">أحدث المحتوى</span>
            <h2 id="latest-publications-heading" className="heading-section mt-3">
              آخر المنشورات والإصدارات
            </h2>
          </div>
          <Button asChild variant="outline" className="hidden sm:inline-flex">
            <Link to="/news">{ui.viewAll} <ArrowLeft className="h-4 w-4" /></Link>
          </Button>
        </div>

        <div className="min-h-[380px]">
          {items === null ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card-elegant overflow-hidden">
                  <Skeleton className="aspect-[16/10] w-full rounded-none" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="card-elegant p-12 text-center text-muted-foreground">
              لا يوجد محتوى منشور بعد. ترقبوا الجديد قريبًا.
            </div>
          ) : (
            <>
              {/* Mobile: snap horizontal scroll */}
              <div className="md:hidden -mx-4 px-4">
                <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-thin">
                  {items.map((item, i) => (
                    <div
                      key={item.id}
                      className="snap-start shrink-0 w-[82%] xs:w-[70%]"
                    >
                      <PublicationCard item={item} priority={i === 0} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Tablet/Desktop: responsive grid */}
              <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 auto-rows-fr">
                {items.map((item, i) => (
                  <PublicationCard key={item.id} item={item} priority={i < 2} />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="sm:hidden mt-6 text-center">
          <Button asChild variant="outline">
            <Link to="/news">{ui.viewAll} <ArrowLeft className="h-4 w-4" /></Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

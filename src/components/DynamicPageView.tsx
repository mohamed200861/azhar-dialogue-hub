import { useEffect } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { PageHero } from "@/components/PageHero";
import { useDynamicPage } from "@/hooks/useDynamicPages";
import { Loader2 } from "lucide-react";

/**
 * Renders a CMS-managed page. Falls back to a placeholder when content is empty.
 * Hides the page (shows "not available" message) when status != published.
 */
export function DynamicPageView({
  pageKey,
  eyebrow,
  fallbackTitle,
  fallbackDescription,
  fallbackContent,
}: {
  pageKey: string;
  eyebrow: string;
  fallbackTitle: string;
  fallbackDescription?: string;
  fallbackContent?: React.ReactNode;
}) {
  const { page, loaded } = useDynamicPage(pageKey);

  useEffect(() => {
    const title = page?.seo_title || page?.title || fallbackTitle;
    document.title = `${title} — اتحاد علماء الأزهر`;
  }, [page, fallbackTitle]);

  if (!loaded) {
    return (
      <SiteLayout>
        <div className="section-padding text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
      </SiteLayout>
    );
  }

  // Page hidden / draft / archived
  if (page && page.status !== "published") {
    return (
      <SiteLayout>
        <PageHero eyebrow={eyebrow} title={page.title || fallbackTitle} description="" />
        <section className="section-padding">
          <div className="container-narrow card-elegant p-10 text-center text-muted-foreground">
            هذه الصفحة غير متاحة حاليًا.
          </div>
        </section>
      </SiteLayout>
    );
  }

  const title = page?.title || fallbackTitle;
  const description = page?.seo_description || fallbackDescription || "";
  const content = page?.content?.trim() || "";

  return (
    <SiteLayout>
      <PageHero eyebrow={eyebrow} title={title} description={description} />
      <section className="section-padding">
        <div className="container-narrow">
          {content ? (
            <article className="card-elegant p-8 md:p-12 prose-rtl">
              {content.split(/\n{2,}/).map((para, i) => (
                <p key={i} className="text-foreground/85 leading-loose mb-4 last:mb-0 whitespace-pre-line">{para}</p>
              ))}
            </article>
          ) : fallbackContent ? (
            <>{fallbackContent}</>
          ) : (
            <div className="card-elegant p-10 text-center text-muted-foreground">سيتم إضافة هذا المحتوى قريبًا.</div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}

import { useEffect } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { PageHero } from "@/components/PageHero";

export default function TermsPage() {
  useEffect(() => { document.title = "الأحكام والشروط — اتحاد علماء الأزهر"; }, []);
  return (
    <SiteLayout>
      <PageHero eyebrow="معلومات قانونية" title="الأحكام والشروط"
        description="القواعد والشروط المنظِّمة لاستخدام موقع الاتحاد." />
      <section className="section-padding">
        <div className="container-narrow">
          <div className="card-elegant p-10 text-center text-muted-foreground leading-loose">
            سيتم إضافة هذا المحتوى قريبًا.
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

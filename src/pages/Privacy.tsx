import { useEffect } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { PageHero } from "@/components/PageHero";

export default function PrivacyPage() {
  useEffect(() => { document.title = "سياسة الخصوصية — اتحاد علماء الأزهر"; }, []);
  return (
    <SiteLayout>
      <PageHero eyebrow="معلومات قانونية" title="سياسة الخصوصية"
        description="نلتزم بحماية بياناتك الشخصية وفق المعايير المعمول بها." />
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

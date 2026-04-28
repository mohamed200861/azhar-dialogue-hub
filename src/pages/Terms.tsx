import { DynamicPageView } from "@/components/DynamicPageView";

export default function TermsPage() {
  return (
    <DynamicPageView
      pageKey="terms"
      eyebrow="معلومات قانونية"
      fallbackTitle="الأحكام والشروط"
      fallbackDescription="شروط استخدام موقع اتحاد علماء الأزهر."
    />
  );
}

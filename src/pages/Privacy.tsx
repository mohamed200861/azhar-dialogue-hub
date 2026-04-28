import { DynamicPageView } from "@/components/DynamicPageView";

export default function PrivacyPage() {
  return (
    <DynamicPageView
      pageKey="privacy"
      eyebrow="معلومات قانونية"
      fallbackTitle="سياسة الخصوصية"
      fallbackDescription="نلتزم بحماية بياناتك الشخصية وفق المعايير المعمول بها."
    />
  );
}

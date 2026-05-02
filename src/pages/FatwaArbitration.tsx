import { DynamicPageView } from "@/components/DynamicPageView";

export default function FatwaArbitration() {
  return (
    <DynamicPageView
      pageKey="fatwa-arbitration"
      eyebrow="خدمات شرعية"
      fallbackTitle="الفتوى والتحكيم الشرعي"
      fallbackDescription="قسم يقدّم الفتاوى والتحكيم في النزاعات الأسرية والمالية وفق الشريعة الإسلامية بمنهج وسطي، سعيًا للإصلاح وتحقيق العدالة."
    />
  );
}

import { DynamicPageView } from "@/components/DynamicPageView";

export default function About() {
  return (
    <DynamicPageView
      pageKey="about"
      eyebrow="من نحن"
      fallbackTitle="اتحاد علماء الأزهر"
      fallbackDescription="مؤسسة إسلامية دعوية علمية غير ربحية تنشر المنهج الأزهري الوسطي وتخدم قضايا الأمة."
    />
  );
}

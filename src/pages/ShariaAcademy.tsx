import { DynamicPageView } from "@/components/DynamicPageView";

export default function ShariaAcademy() {
  return (
    <DynamicPageView
      pageKey="sharia-academy"
      eyebrow="التعليم الشرعي"
      fallbackTitle="أكاديمية العلوم الشرعية"
      fallbackDescription="برامج علمية متخصصة في العلوم الشرعية وفق منهج أزهري وسطي."
    />
  );
}

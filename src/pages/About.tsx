import { DynamicPageView } from "@/components/DynamicPageView";

export default function About() {
  return (
    <DynamicPageView
      pageKey="about"
      eyebrow="من نحن"
      fallbackTitle="عن اتحاد علماء الأزهر — التعريف والرسالة"
      fallbackDescription="تعرّف على اتحاد علماء الأزهر: نشأته وأهدافه ومنهجه الأزهري الوسطي في خدمة العلم والدعوة والحوار والفتوى."
    />
  );
}

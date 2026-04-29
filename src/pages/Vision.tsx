import { DynamicPageView } from "@/components/DynamicPageView";

export default function Vision() {
  return (
    <DynamicPageView
      pageKey="vision"
      eyebrow="التوجهات"
      fallbackTitle="الرؤية والرسالة"
      fallbackDescription="ركائز عمل الاتحاد ومبادئه التي تحدد مسار خدمته العلمية والدعوية."
    />
  );
}

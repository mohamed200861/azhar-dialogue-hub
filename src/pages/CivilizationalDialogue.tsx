import { DynamicPageView } from "@/components/DynamicPageView";

export default function CivilizationalDialogue() {
  return (
    <DynamicPageView
      pageKey="civilizational-dialogue"
      eyebrow="الحوار الحضاري"
      fallbackTitle="الحوار والتواصل الحضاري"
      fallbackDescription="تعزيز جسور التفاهم بين الشعوب والثقافات بمنهج إسلامي وسطي."
    />
  );
}

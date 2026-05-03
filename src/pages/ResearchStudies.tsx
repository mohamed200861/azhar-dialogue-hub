import { DynamicPageView } from "@/components/DynamicPageView";

export default function ResearchStudies() {
  return (
    <DynamicPageView
      pageKey="research-studies"
      eyebrow="البحث العلمي"
      fallbackTitle="البحوث والدراسات"
      fallbackDescription="بحوث ودراسات شرعية وفكرية متخصصة بمنهج أزهري رصين."
    />
  );
}

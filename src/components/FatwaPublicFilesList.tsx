import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, ExternalLink } from "lucide-react";

const CAT_LABEL: Record<string, string> = {
  general: "عام",
  forms: "نماذج",
  regulations: "لوائح",
  guides: "أدلة",
  announcements: "إعلانات",
};

function formatSize(b?: number | null) {
  if (!b) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export function FatwaPublicFilesList() {
  const [files, setFiles] = useState<any[] | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("fatwa_public_files")
        .select("*")
        .eq("publish_status", "published")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });
      setFiles(data ?? []);
    })();
  }, []);

  if (!files || files.length === 0) return null;

  return (
    <section className="container-narrow py-10">
      <div className="mb-6">
        <span className="eyebrow">ملفات مفيدة</span>
        <h2 className="heading-section mt-2 text-2xl md:text-3xl">ملفات الفتوى والتحكيم الشرعي</h2>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {files.map((f) => (
          <Card key={f.id} className="p-5 flex flex-col">
            <div className="flex items-start gap-3 mb-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold leading-snug line-clamp-2">{f.title}</h3>
                <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{CAT_LABEL[f.category] || f.category}</span>
                  {f.file_size ? <span>{formatSize(f.file_size)}</span> : null}
                </div>
              </div>
            </div>
            {f.description && <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">{f.description}</p>}
            <div className="flex gap-2">
              <Button asChild size="sm" variant="outline">
                <a href={f.file_url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> عرض</a>
              </Button>
              <Button asChild size="sm">
                <a href={f.file_url} download={f.file_name || true}><Download className="h-4 w-4" /> تحميل</a>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

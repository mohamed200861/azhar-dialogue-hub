import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText, AlertCircle } from "lucide-react";

interface Props {
  url: string;
  title?: string;
  className?: string;
}

/**
 * PDF reader: tries to embed via <iframe>, falls back to "open in new tab"
 * if the browser blocks the embed (e.g. some mobile browsers, X-Frame-Options).
 */
export function PdfViewer({ url, title, className }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={`card-elegant p-8 text-center space-y-4 ${className ?? ""}`}>
        <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground" />
        <p className="text-muted-foreground">
          المعاينة غير مدعومة في هذا المتصفح.
        </p>
        <Button asChild>
          <a href={url} target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4" /> فتح الملف في تبويب جديد
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className={`card-elegant overflow-hidden ${className ?? ""}`}>
      <object
        data={`${url}#toolbar=1&navpanes=0&view=FitH`}
        type="application/pdf"
        className="w-full h-[70vh]"
        onError={() => setFailed(true)}
        aria-label={title ?? "ملف PDF"}
      >
        <iframe
          src={url}
          title={title ?? "ملف PDF"}
          className="w-full h-[70vh] border-0"
          onError={() => setFailed(true)}
        />
        <div className="p-8 text-center space-y-3">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground" />
          <Button asChild>
            <a href={url} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" /> فتح الملف
            </a>
          </Button>
        </div>
      </object>
    </div>
  );
}

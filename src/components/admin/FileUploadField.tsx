import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, Link as LinkIcon, X } from "lucide-react";
import { toast } from "sonner";

type Bucket = "images" | "covers" | "documents" | "thumbnails" | "attachments";

interface Props {
  bucket: Bucket;
  value?: string | null;
  onChange: (url: string | null) => void;
  accept?: string;
  label?: string;
  preview?: "image" | "file";
}

const ACCEPT: Record<Bucket, string> = {
  images: "image/jpeg,image/png,image/webp,image/jpg",
  covers: "image/jpeg,image/png,image/webp,image/jpg",
  documents: "application/pdf",
  thumbnails: "image/jpeg,image/png,image/webp,image/jpg",
  attachments: "application/pdf,image/jpeg,image/png,image/webp",
};

export function FileUploadField({ bucket, value, onChange, accept, label, preview = "image" }: Props) {
  const [uploading, setUploading] = useState(false);
  const [manual, setManual] = useState(value ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setManual(value ?? ""), [value]);

  const handleFile = async (file: File) => {
    const allowed = (accept ?? ACCEPT[bucket]).split(",").map((s) => s.trim());
    if (allowed.length && !allowed.includes(file.type)) {
      toast.error("نوع الملف غير مدعوم.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("حجم الملف كبير جدًا. يرجى رفع ملف أصغر.");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: "31536000",
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      onChange(data.publicUrl);

      // log in media_files
      const { data: u } = await supabase.auth.getUser();
      await supabase.from("media_files").insert({
        file_name: file.name,
        file_url: data.publicUrl,
        file_type: file.type,
        file_size: file.size,
        folder: bucket,
        uploaded_by: u.user?.id ?? null,
      });
      toast.success("تم رفع الملف بنجاح");
    } catch (e: any) {
      toast.error(e.message || "تعذر رفع الملف");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      {value && preview === "image" && (
        <div className="relative inline-block">
          <img src={value} alt="" className="h-32 w-auto rounded-lg border object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -top-2 -start-2 bg-destructive text-destructive-foreground rounded-full p-1"
            aria-label="حذف"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      {value && preview === "file" && (
        <div className="flex items-center gap-2 text-sm bg-muted rounded-lg p-2">
          <a href={value} target="_blank" rel="noreferrer" className="text-primary truncate flex-1" dir="ltr">
            {value.split("/").pop()}
          </a>
          <button type="button" onClick={() => onChange(null)} className="text-destructive p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className="flex gap-2">
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept={accept ?? ACCEPT[bucket]}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          رفع ملف
        </Button>
      </div>
      <div className="flex gap-2 items-center">
        <LinkIcon className="h-4 w-4 text-muted-foreground" />
        <Input
          dir="ltr"
          placeholder="أو ألصق رابط ملف…"
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          onBlur={() => onChange(manual.trim() || null)}
          className="text-left"
        />
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, Link as LinkIcon, X } from "lucide-react";
import { toast } from "sonner";

type KnownBucket =
  | "images" | "covers" | "documents" | "thumbnails" | "attachments"
  | "quran-thumbnails" | "quran-videos-media" | "quran-materials"
  | "khutbah-media" | "khutbah-images";

interface Props {
  bucket: KnownBucket | string;
  value?: string | null;
  onChange: (url: string | null) => void;
  accept?: string;
  label?: string;
  preview?: "image" | "file" | "audio" | "video";
  maxSizeMB?: number;
}

const IMG = "image/jpeg,image/png,image/webp,image/jpg";
const ACCEPT: Record<string, string> = {
  images: IMG,
  covers: IMG,
  thumbnails: IMG,
  "quran-thumbnails": IMG,
  "khutbah-images": IMG,
  documents: "application/pdf",
  attachments: "application/pdf,image/jpeg,image/png,image/webp",
  "quran-materials": "application/pdf,image/jpeg,image/png,image/webp",
  "quran-videos-media": "video/mp4,video/webm,audio/mpeg,audio/mp4,audio/wav,audio/ogg",
  "khutbah-media": "video/mp4,video/webm,audio/mpeg,audio/mp4,audio/wav,audio/ogg",
};

export function FileUploadField({ bucket, value, onChange, accept, label, preview = "image", maxSizeMB = 50 }: Props) {
  const [uploading, setUploading] = useState(false);
  const [manual, setManual] = useState(value ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setManual(value ?? ""), [value]);

  const handleFile = async (file: File) => {
    const acceptList = (accept ?? ACCEPT[bucket] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    if (acceptList.length && !acceptList.includes(file.type)) {
      toast.error("نوع الملف غير مدعوم.");
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`حجم الملف كبير جدًا (الحد الأقصى ${maxSizeMB}MB).`);
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
      {value && preview === "audio" && (
        <div className="flex items-center gap-2 bg-muted rounded-lg p-2">
          <audio controls src={value} className="flex-1 h-9" />
          <button type="button" onClick={() => onChange(null)} className="text-destructive p-1"><X className="h-4 w-4" /></button>
        </div>
      )}
      {value && preview === "video" && (
        <div className="relative">
          <video controls src={value} className="w-full max-h-64 rounded-lg border bg-black" />
          <button type="button" onClick={() => onChange(null)} className="absolute top-2 end-2 bg-destructive text-destructive-foreground rounded-full p-1"><X className="h-3 w-3" /></button>
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
          onBlur={() => {
            const v = manual.trim();
            if (v && !/^https?:\/\//i.test(v)) {
              toast.error("يرجى إدخال رابط صحيح يبدأ بـ https://");
              return;
            }
            onChange(v || null);
          }}
          className="text-left"
        />
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, Trash2, Copy, FileText, Image as ImageIcon, Search } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatBytes, formatDateTime } from "@/lib/admin-utils";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";

const FOLDERS = [
  { key: "images", label: "الصور", accept: "image/*" },
  { key: "covers", label: "الأغلفة", accept: "image/*" },
  { key: "documents", label: "الملفات", accept: "application/pdf" },
  { key: "thumbnails", label: "الصور المصغرة", accept: "image/*" },
  { key: "attachments", label: "المرفقات", accept: "application/pdf,image/*" },
] as const;

export default function MediaManager() {
  const [folder, setFolder] = useState<string>("images");
  const [files, setFiles] = useState<any[] | null>(null);
  const [q, setQ] = useState("");
  const [uploading, setUploading] = useState(false);
  const inp = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const load = async () => {
    setFiles(null);
    const { data } = await supabase.from("media_files").select("*").eq("folder", folder).order("created_at", { ascending: false });
    setFiles(data ?? []);
  };
  useEffect(() => { load(); }, [folder]);

  const upload = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) return toast.error("الحجم يتجاوز 20 م.ب");
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from(folder).upload(path, file, { upsert: false });
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data: pub } = supabase.storage.from(folder).getPublicUrl(path);
    await supabase.from("media_files").insert({
      file_name: file.name, file_url: pub.publicUrl, file_type: file.type,
      file_size: file.size, folder, uploaded_by: user?.id ?? null,
    });
    setUploading(false);
    if (inp.current) inp.current.value = "";
    toast.success("تم الرفع");
    load();
  };

  const remove = async (file: any) => {
    const path = file.file_url.split(`/${folder}/`)[1];
    if (path) await supabase.storage.from(folder).remove([path]);
    await supabase.from("media_files").delete().eq("id", file.id);
    toast.success("تم الحذف");
    load();
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("تم نسخ الرابط");
  };

  const filtered = (files ?? []).filter((f) => !q || f.file_name.includes(q));
  const accept = FOLDERS.find((f) => f.key === folder)?.accept;

  return (
    <div>
      <PageHeader
        title="إدارة الملفات"
        description="رفع الصور وملفات PDF واستخدامها في المحتوى."
        actions={<>
          <input ref={inp} type="file" hidden accept={accept} onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
          <Button onClick={() => inp.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            رفع ملف
          </Button>
        </>}
      />

      <Tabs value={folder} onValueChange={setFolder} className="mb-4">
        <TabsList>
          {FOLDERS.map((f) => <TabsTrigger key={f.key} value={f.key}>{f.label}</TabsTrigger>)}
        </TabsList>
      </Tabs>

      <Card className="p-4 mb-4">
        <div className="relative max-w-md">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث باسم الملف…" className="ps-10" />
        </div>
      </Card>

      {files === null ? (
        <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">لا توجد ملفات في هذا القسم بعد.</Card>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((f) => {
            const isImg = f.file_type?.startsWith("image/");
            return (
              <Card key={f.id} className="overflow-hidden">
                <div className="aspect-video bg-muted flex items-center justify-center">
                  {isImg ? <img src={f.file_url} alt="" className="w-full h-full object-cover" />
                    : <FileText className="h-10 w-10 text-muted-foreground" />}
                </div>
                <div className="p-3 space-y-1">
                  <div className="text-xs font-medium truncate" title={f.file_name}>{f.file_name}</div>
                  <div className="text-[10px] text-muted-foreground flex items-center justify-between">
                    <span>{formatBytes(f.file_size)}</span>
                    <span>{formatDateTime(f.created_at)}</span>
                  </div>
                  <div className="flex gap-1 pt-1">
                    <Button size="sm" variant="outline" className="flex-1 h-8" onClick={() => copyUrl(f.file_url)}><Copy className="h-3 w-3" /> نسخ</Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button size="sm" variant="outline" className="h-8 text-destructive"><Trash2 className="h-3 w-3" /></Button></AlertDialogTrigger>
                      <AlertDialogContent dir="rtl">
                        <AlertDialogHeader><AlertDialogTitle>حذف الملف</AlertDialogTitle><AlertDialogDescription>سيتم حذف الملف من التخزين بشكل نهائي.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => remove(f)} className="bg-destructive">حذف</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

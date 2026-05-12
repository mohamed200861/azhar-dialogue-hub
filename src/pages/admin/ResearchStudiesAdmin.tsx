import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Plus, Save, Trash2, Edit, Paperclip, Upload } from "lucide-react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/admin-utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const CATEGORY: Record<string, string> = { sharia: "شرعية", intellectual: "فكرية", contemporary: "معاصرة", reports: "تقارير" };
const PUBLISH: Record<string, string> = { draft: "مسودة", published: "منشور", archived: "مؤرشف" };
const SUB_STATUS: Record<string, string> = { new: "قيد الانتظار", reviewing: "قيد المراجعة", approved: "مقبول", rejected: "مرفوض" };

const empty = { title: "", abstract: "", author: "", category: "sharia", publish_status: "published", file_url: "", external_url: "", display_order: 0 };

export default function ResearchStudiesAdmin() {
  const { isSuperAdmin } = useAuth();
  const [items, setItems] = useState<any[] | null>(null);
  const [subs, setSubs] = useState<any[] | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [subFilter, setSubFilter] = useState("all");
  const [sel, setSel] = useState<any | null>(null);
  const [selEdit, setSelEdit] = useState<any | null>(null);
  const [signedSub, setSignedSub] = useState<string | null>(null);

  const loadItems = async () => {
    setItems(null);
    const { data, error } = await supabase.from("research_items").select("*").order("display_order").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems(data ?? []);
  };
  const loadSubs = async () => {
    setSubs(null);
    let q = supabase.from("research_submissions").select("*").order("created_at", { ascending: false });
    if (subFilter !== "all") q = q.eq("status", subFilter as any);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setSubs(data ?? []);
  };
  useEffect(() => { loadItems(); }, []);
  useEffect(() => { loadSubs(); }, [subFilter]);

  const uploadPdf = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) { toast.error("الحد الأقصى 20MB"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "pdf";
      const path = `research/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const up = await supabase.storage.from("research-public").upload(path, file, { contentType: file.type, upsert: false });
      if (up.error) throw up.error;
      const { data } = supabase.storage.from("research-public").getPublicUrl(up.data.path);
      setEditing((e: any) => ({ ...e, file_url: data.publicUrl }));
      toast.success("تم رفع الملف");
    } catch (e: any) { toast.error(e.message); } finally { setUploading(false); }
  };

  const save = async () => {
    if (!editing?.title?.trim()) return toast.error("العنوان مطلوب");
    const payload: any = { ...editing };
    if (!payload.file_url) payload.file_url = null;
    if (!payload.external_url) payload.external_url = null;
    if (!payload.author) payload.author = null;
    if (editing.id) {
      const { id, created_at, updated_at, created_by, published_at, ...rest } = payload;
      const { error } = await supabase.from("research_items").update(rest).eq("id", editing.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("research_items").insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success("تم الحفظ");
    setOpen(false); setEditing(null); loadItems();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("research_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف"); loadItems();
  };

  const openSub = async (s: any) => {
    setSel(s);
    setSelEdit({ status: s.status, admin_notes: s.admin_notes ?? "" });
    setSignedSub(null);
    if (s.attachment_url) {
      const { data } = await supabase.storage.from("research-submissions").createSignedUrl(s.attachment_url, 600);
      setSignedSub(data?.signedUrl ?? null);
    }
  };
  const saveSub = async () => {
    if (!sel || !selEdit) return;
    const { error } = await supabase.from("research_submissions").update({
      status: selEdit.status, admin_notes: selEdit.admin_notes || null,
    }).eq("id", sel.id);
    if (error) return toast.error(error.message);
    toast.success("تم الحفظ"); setSel(null); loadSubs();
  };

  return (
    <div>
      <PageHeader title="البحوث والدراسات" description="إدارة الأبحاث المنشورة والطلبات الواردة." />
      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">الأبحاث</TabsTrigger>
          <TabsTrigger value="subs">الطلبات الواردة</TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <div className="flex justify-end mb-3">
            <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditing({ ...empty })}><Plus className="h-4 w-4" /> بحث جديد</Button>
              </DialogTrigger>
              {editing && (
                <DialogContent dir="rtl" className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>{editing.id ? "تعديل" : "بحث جديد"}</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>العنوان</Label><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
                    <div><Label>المؤلف</Label><Input value={editing.author ?? ""} onChange={(e) => setEditing({ ...editing, author: e.target.value })} /></div>
                    <div><Label>الملخص</Label><RichTextEditor value={editing.abstract ?? ""} onChange={(html) => setEditing({ ...editing, abstract: html })} minHeight={200} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>التصنيف</Label>
                        <Select value={editing.category} onValueChange={(v) => setEditing({ ...editing, category: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{Object.entries(CATEGORY).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div><Label>حالة النشر</Label>
                        <Select value={editing.publish_status} onValueChange={(v) => setEditing({ ...editing, publish_status: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{Object.entries(PUBLISH).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>ملف PDF (عمومي)</Label>
                      <div className="flex items-center gap-2">
                        <Input type="file" accept="application/pdf" onChange={(e) => e.target.files?.[0] && uploadPdf(e.target.files[0])} disabled={uploading} />
                        {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                      </div>
                      {editing.file_url && <div className="text-xs text-muted-foreground mt-1 truncate" dir="ltr">{editing.file_url}</div>}
                    </div>
                    <div><Label>أو رابط خارجي</Label><Input dir="ltr" value={editing.external_url ?? ""} onChange={(e) => setEditing({ ...editing, external_url: e.target.value })} /></div>
                    <div><Label>الترتيب</Label><Input type="number" value={editing.display_order} onChange={(e) => setEditing({ ...editing, display_order: Number(e.target.value) })} /></div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
                    <Button onClick={save}><Save className="h-4 w-4" /> حفظ</Button>
                  </DialogFooter>
                </DialogContent>
              )}
            </Dialog>
          </div>

          {items === null ? <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
            : items.length === 0 ? <Card className="p-8 text-center text-muted-foreground">لا توجد أبحاث.</Card>
            : <div className="space-y-2">
              {items.map((p) => (
                <Card key={p.id} className="p-4 flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{p.title}</div>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-2 mt-1">
                      <Badge variant="outline">{CATEGORY[p.category]}</Badge>
                      <Badge variant="secondary">{PUBLISH[p.publish_status]}</Badge>
                      {p.author && <span>{p.author}</span>}
                      {p.file_url && <Paperclip className="h-3 w-3" />}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => { setEditing(p); setOpen(true); }}><Edit className="h-3.5 w-3.5" /> تعديل</Button>
                  {isSuperAdmin && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button size="sm" variant="outline" className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></AlertDialogTrigger>
                      <AlertDialogContent dir="rtl">
                        <AlertDialogHeader><AlertDialogTitle>حذف</AlertDialogTitle><AlertDialogDescription>سيتم الحذف نهائيًا.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => remove(p.id)} className="bg-destructive">حذف</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </Card>
              ))}
            </div>}
        </TabsContent>

        <TabsContent value="subs">
          <div className="mb-3">
            <Select value={subFilter} onValueChange={setSubFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                {Object.entries(SUB_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {subs === null ? <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
            : subs.length === 0 ? <Card className="p-8 text-center text-muted-foreground">لا توجد طلبات.</Card>
            : <div className="space-y-2">
              {subs.map((r) => (
                <Card key={r.id} className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="font-semibold">{r.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{r.full_name} • <span dir="ltr">{r.email}</span></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{CATEGORY[r.category]}</Badge>
                      <Badge>{SUB_STATUS[r.status]}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDateTime(r.created_at)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-2 whitespace-pre-wrap">{r.abstract}</p>
                  <div className="mt-3">
                    <Dialog open={sel?.id === r.id} onOpenChange={(o) => !o && setSel(null)}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => openSub(r)}>عرض / تعديل</Button>
                      </DialogTrigger>
                      {sel?.id === r.id && selEdit && (
                        <DialogContent dir="rtl" className="max-w-xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader><DialogTitle>{r.title}</DialogTitle></DialogHeader>
                          <div className="space-y-3 text-sm">
                            <div><strong>الباحث:</strong> {r.full_name}</div>
                            <div dir="ltr"><strong>Email:</strong> {r.email}</div>
                            <div><strong>الملخص:</strong> <div className="whitespace-pre-wrap">{r.abstract}</div></div>
                            {signedSub && <div><a href={signedSub} target="_blank" rel="noreferrer" className="text-primary underline inline-flex items-center gap-1"><Paperclip className="h-4 w-4" /> فتح المرفق (رابط مؤقت)</a></div>}
                            <div>
                              <Label>الحالة</Label>
                              <Select value={selEdit.status} onValueChange={(v) => setSelEdit({ ...selEdit, status: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{Object.entries(SUB_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>ملاحظات داخلية</Label>
                              <Textarea rows={3} value={selEdit.admin_notes} onChange={(e) => setSelEdit({ ...selEdit, admin_notes: e.target.value })} />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setSel(null)}>إلغاء</Button>
                            <Button onClick={saveSub}><Save className="h-4 w-4" /> حفظ</Button>
                          </DialogFooter>
                        </DialogContent>
                      )}
                    </Dialog>
                  </div>
                </Card>
              ))}
            </div>}
        </TabsContent>
      </Tabs>
    </div>
  );
}

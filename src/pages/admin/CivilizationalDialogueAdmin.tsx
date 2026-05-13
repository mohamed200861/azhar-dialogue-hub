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
import { Loader2, Plus, Save, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/admin-utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useFormDraft } from "@/hooks/useFormDraft";
import { DraftStatus } from "@/components/admin/DraftStatus";

const TYPE: Record<string, string> = { meeting: "لقاء", conference: "مؤتمر", seminar: "ندوة", initiative: "مبادرة" };
const PUBLISH: Record<string, string> = { draft: "مسودة", published: "منشور", archived: "مؤرشف" };
const REQ_STATUS: Record<string, string> = { new: "جديد", reviewing: "قيد المراجعة", contacted: "تم التواصل", closed: "مغلق" };

const empty = { title: "", description: "", initiative_type: "meeting", initiative_date: "", publish_status: "published", display_order: 0 };

export default function CivilizationalDialogueAdmin() {
  const { isSuperAdmin } = useAuth();
  const [items, setItems] = useState<any[] | null>(null);
  const [reqs, setReqs] = useState<any[] | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [reqFilter, setReqFilter] = useState("all");
  const [sel, setSel] = useState<any | null>(null);
  const [selEdit, setSelEdit] = useState<any | null>(null);

  const loadItems = async () => {
    setItems(null);
    const { data, error } = await supabase.from("dialogue_initiatives").select("*").order("display_order").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems(data ?? []);
  };
  const loadReqs = async () => {
    setReqs(null);
    let q = supabase.from("dialogue_requests").select("*").order("created_at", { ascending: false });
    if (reqFilter !== "all") q = q.eq("status", reqFilter as any);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setReqs(data ?? []);
  };
  useEffect(() => { loadItems(); }, []);
  useEffect(() => { loadReqs(); }, [reqFilter]);

  const save = async () => {
    if (!editing?.title?.trim()) return toast.error("العنوان مطلوب");
    const payload: any = { ...editing };
    if (!payload.initiative_date) payload.initiative_date = null;
    if (editing.id) {
      const { id, created_at, updated_at, created_by, ...rest } = payload;
      const { error } = await supabase.from("dialogue_initiatives").update(rest).eq("id", editing.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("dialogue_initiatives").insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success("تم الحفظ");
    setOpen(false); setEditing(null); loadItems();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("dialogue_initiatives").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف"); loadItems();
  };

  const saveReq = async () => {
    if (!sel || !selEdit) return;
    const { error } = await supabase.from("dialogue_requests").update({
      status: selEdit.status, admin_notes: selEdit.admin_notes || null,
    }).eq("id", sel.id);
    if (error) return toast.error(error.message);
    toast.success("تم الحفظ"); setSel(null); loadReqs();
  };

  return (
    <div>
      <PageHeader title="الحوار والتواصل الحضاري" description="إدارة المبادرات وطلبات التواصل." />
      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">المبادرات</TabsTrigger>
          <TabsTrigger value="requests">طلبات التواصل</TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <div className="flex justify-end mb-3">
            <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditing({ ...empty })}><Plus className="h-4 w-4" /> مبادرة جديدة</Button>
              </DialogTrigger>
              {editing && (
                <DialogContent dir="rtl" className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>{editing.id ? "تعديل" : "مبادرة جديدة"}</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>العنوان</Label><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
                    <div><Label>الوصف</Label><RichTextEditor value={editing.description ?? ""} onChange={(html) => setEditing({ ...editing, description: html })} minHeight={200} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>النوع</Label>
                        <Select value={editing.initiative_type} onValueChange={(v) => setEditing({ ...editing, initiative_type: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{Object.entries(TYPE).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div><Label>حالة النشر</Label>
                        <Select value={editing.publish_status} onValueChange={(v) => setEditing({ ...editing, publish_status: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{Object.entries(PUBLISH).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div><Label>التاريخ</Label><Input type="datetime-local" value={editing.initiative_date ? String(editing.initiative_date).slice(0, 16) : ""} onChange={(e) => setEditing({ ...editing, initiative_date: e.target.value })} /></div>
                      <div><Label>الترتيب</Label><Input type="number" value={editing.display_order} onChange={(e) => setEditing({ ...editing, display_order: Number(e.target.value) })} /></div>
                    </div>
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
            : items.length === 0 ? <Card className="p-8 text-center text-muted-foreground">لا توجد مبادرات.</Card>
            : <div className="space-y-2">
              {items.map((p) => (
                <Card key={p.id} className="p-4 flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{p.title}</div>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-2 mt-1">
                      <Badge variant="outline">{TYPE[p.initiative_type]}</Badge>
                      <Badge variant="secondary">{PUBLISH[p.publish_status]}</Badge>
                      {p.initiative_date && <span>{formatDateTime(p.initiative_date)}</span>}
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

        <TabsContent value="requests">
          <div className="mb-3">
            <Select value={reqFilter} onValueChange={setReqFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                {Object.entries(REQ_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {reqs === null ? <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
            : reqs.length === 0 ? <Card className="p-8 text-center text-muted-foreground">لا توجد طلبات.</Card>
            : <div className="space-y-2">
              {reqs.map((r) => (
                <Card key={r.id} className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="font-semibold">{r.full_name} {r.organization && <span className="text-xs text-muted-foreground">({r.organization})</span>}</div>
                      <div className="text-xs text-muted-foreground" dir="ltr">{r.email}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>{REQ_STATUS[r.status]}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDateTime(r.created_at)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-2 whitespace-pre-wrap">{r.message}</p>
                  <div className="mt-3">
                    <Dialog open={sel?.id === r.id} onOpenChange={(o) => !o && setSel(null)}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => { setSel(r); setSelEdit({ status: r.status, admin_notes: r.admin_notes ?? "" }); }}>عرض / تعديل</Button>
                      </DialogTrigger>
                      {sel?.id === r.id && selEdit && (
                        <DialogContent dir="rtl" className="max-w-xl">
                          <DialogHeader><DialogTitle>{r.full_name}</DialogTitle></DialogHeader>
                          <div className="space-y-3 text-sm">
                            <div><strong>الجهة:</strong> {r.organization ?? "—"}</div>
                            <div><strong>الدولة:</strong> {r.country ?? "—"}</div>
                            <div><strong>نوع الطلب:</strong> {r.request_kind}</div>
                            <div><strong>الرسالة:</strong> <div className="whitespace-pre-wrap">{r.message}</div></div>
                            <div>
                              <Label>الحالة</Label>
                              <Select value={selEdit.status} onValueChange={(v) => setSelEdit({ ...selEdit, status: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{Object.entries(REQ_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>ملاحظات داخلية</Label>
                              <Textarea rows={3} value={selEdit.admin_notes} onChange={(e) => setSelEdit({ ...selEdit, admin_notes: e.target.value })} />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setSel(null)}>إلغاء</Button>
                            <Button onClick={saveReq}><Save className="h-4 w-4" /> حفظ</Button>
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

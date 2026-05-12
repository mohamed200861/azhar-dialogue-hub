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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const LEVEL: Record<string, string> = { beginner: "مبتدئ", intermediate: "متوسط", advanced: "متقدم" };
const CATEGORY: Record<string, string> = { course: "دورة", diploma: "دبلوم", ijaza: "إجازة" };
const STATUS: Record<string, string> = { available: "متاح", soon: "قريبًا", closed: "مغلق" };
const PUBLISH: Record<string, string> = { draft: "مسودة", published: "منشور", archived: "مؤرشف" };
const APP_STATUS: Record<string, string> = { new: "جديد", reviewing: "قيد المراجعة", accepted: "مقبول", rejected: "مرفوض" };

const emptyProgram = {
  title: "",
  description: "",
  level: "beginner",
  category: "course",
  status: "available",
  publish_status: "published",
  duration: "",
  display_order: 0,
};

export default function ShariaAcademyAdmin() {
  const { isSuperAdmin } = useAuth();
  const [programs, setPrograms] = useState<any[] | null>(null);
  const [apps, setApps] = useState<any[] | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [appFilter, setAppFilter] = useState("all");
  const [progFilter, setProgFilter] = useState("all");
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [appEdit, setAppEdit] = useState<any | null>(null);

  const loadPrograms = async () => {
    setPrograms(null);
    const { data, error } = await supabase.from("academy_programs").select("*").order("display_order").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setPrograms(data ?? []);
  };
  const loadApps = async () => {
    setApps(null);
    let q = supabase.from("academy_applications").select("*").order("created_at", { ascending: false });
    if (appFilter !== "all") q = q.eq("status", appFilter as any);
    if (progFilter !== "all") q = q.eq("program_id", progFilter);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setApps(data ?? []);
  };
  useEffect(() => { loadPrograms(); }, []);
  useEffect(() => { loadApps(); }, [appFilter, progFilter]);

  const saveProgram = async () => {
    if (!editing?.title?.trim()) return toast.error("العنوان مطلوب");
    const payload = { ...editing };
    if (editing.id) {
      const { id, created_at, updated_at, created_by, ...rest } = payload;
      const { error } = await supabase.from("academy_programs").update(rest).eq("id", editing.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("academy_programs").insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success("تم الحفظ");
    setOpenDialog(false);
    setEditing(null);
    loadPrograms();
  };

  const removeProgram = async (id: string) => {
    const { error } = await supabase.from("academy_programs").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف");
    loadPrograms();
  };

  const saveApp = async () => {
    if (!selectedApp || !appEdit) return;
    const { error } = await supabase.from("academy_applications").update({
      status: appEdit.status,
      admin_notes: appEdit.admin_notes || null,
    }).eq("id", selectedApp.id);
    if (error) return toast.error(error.message);
    toast.success("تم الحفظ");
    setSelectedApp(null);
    loadApps();
  };

  return (
    <div>
      <PageHeader title="أكاديمية العلوم الشرعية" description="إدارة البرامج والطلبات." />
      <Tabs defaultValue="programs">
        <TabsList>
          <TabsTrigger value="programs">البرامج</TabsTrigger>
          <TabsTrigger value="applications">الطلبات</TabsTrigger>
        </TabsList>

        <TabsContent value="programs">
          <div className="flex justify-end mb-3">
            <Dialog open={openDialog} onOpenChange={(o) => { setOpenDialog(o); if (!o) setEditing(null); }}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditing({ ...emptyProgram })}><Plus className="h-4 w-4" /> برنامج جديد</Button>
              </DialogTrigger>
              {editing && (
                <DialogContent dir="rtl" className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>{editing.id ? "تعديل برنامج" : "برنامج جديد"}</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>العنوان</Label><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
                    <div><Label>الوصف</Label><RichTextEditor value={editing.description ?? ""} onChange={(html) => setEditing({ ...editing, description: html })} minHeight={200} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>المستوى</Label>
                        <Select value={editing.level} onValueChange={(v) => setEditing({ ...editing, level: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{Object.entries(LEVEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div><Label>التصنيف</Label>
                        <Select value={editing.category} onValueChange={(v) => setEditing({ ...editing, category: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{Object.entries(CATEGORY).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div><Label>حالة البرنامج</Label>
                        <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{Object.entries(STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div><Label>حالة النشر</Label>
                        <Select value={editing.publish_status} onValueChange={(v) => setEditing({ ...editing, publish_status: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{Object.entries(PUBLISH).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div><Label>المدة</Label><Input value={editing.duration ?? ""} onChange={(e) => setEditing({ ...editing, duration: e.target.value })} /></div>
                      <div><Label>الترتيب</Label><Input type="number" value={editing.display_order} onChange={(e) => setEditing({ ...editing, display_order: Number(e.target.value) })} /></div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpenDialog(false)}>إلغاء</Button>
                    <Button onClick={saveProgram}><Save className="h-4 w-4" /> حفظ</Button>
                  </DialogFooter>
                </DialogContent>
              )}
            </Dialog>
          </div>

          {programs === null ? <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
            : programs.length === 0 ? <Card className="p-8 text-center text-muted-foreground">لا توجد برامج.</Card>
            : <div className="space-y-2">
              {programs.map((p) => (
                <Card key={p.id} className="p-4 flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{p.title}</div>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-2 mt-1">
                      <Badge variant="outline">{CATEGORY[p.category]}</Badge>
                      <Badge variant="outline">{LEVEL[p.level]}</Badge>
                      <Badge>{STATUS[p.status]}</Badge>
                      <Badge variant="secondary">{PUBLISH[p.publish_status]}</Badge>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => { setEditing(p); setOpenDialog(true); }}><Edit className="h-3.5 w-3.5" /> تعديل</Button>
                  {isSuperAdmin && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button size="sm" variant="outline" className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></AlertDialogTrigger>
                      <AlertDialogContent dir="rtl">
                        <AlertDialogHeader><AlertDialogTitle>حذف البرنامج</AlertDialogTitle><AlertDialogDescription>سيتم الحذف نهائيًا.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => removeProgram(p.id)} className="bg-destructive">حذف</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </Card>
              ))}
            </div>}
        </TabsContent>

        <TabsContent value="applications">
          <div className="flex gap-2 mb-3 flex-wrap">
            <Select value={appFilter} onValueChange={setAppFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                {Object.entries(APP_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={progFilter} onValueChange={setProgFilter}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="البرنامج" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل البرامج</SelectItem>
                {(programs ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {apps === null ? <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
            : apps.length === 0 ? <Card className="p-8 text-center text-muted-foreground">لا توجد طلبات.</Card>
            : <div className="space-y-2">
              {apps.map((a) => (
                <Card key={a.id} className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="font-semibold">{a.full_name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5" dir="ltr">{a.email}{a.phone ? ` • ${a.phone}` : ""}</div>
                      {a.program_title && <div className="text-xs mt-1">البرنامج: <span className="font-medium">{a.program_title}</span></div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>{APP_STATUS[a.status]}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDateTime(a.created_at)}</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Dialog open={selectedApp?.id === a.id} onOpenChange={(o) => !o && setSelectedApp(null)}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => { setSelectedApp(a); setAppEdit({ status: a.status, admin_notes: a.admin_notes ?? "" }); }}>عرض / تعديل</Button>
                      </DialogTrigger>
                      {selectedApp?.id === a.id && appEdit && (
                        <DialogContent dir="rtl" className="max-w-xl">
                          <DialogHeader><DialogTitle>{a.full_name}</DialogTitle></DialogHeader>
                          <div className="space-y-3 text-sm">
                            <div><strong>البلد:</strong> {a.country ?? "—"}</div>
                            <div><strong>المؤهل:</strong> {a.qualification ?? "—"}</div>
                            <div><strong>الملاحظات:</strong> <div className="whitespace-pre-wrap">{a.notes ?? "—"}</div></div>
                            <div>
                              <Label>الحالة</Label>
                              <Select value={appEdit.status} onValueChange={(v) => setAppEdit({ ...appEdit, status: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{Object.entries(APP_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>ملاحظات داخلية</Label>
                              <Textarea rows={3} value={appEdit.admin_notes} onChange={(e) => setAppEdit({ ...appEdit, admin_notes: e.target.value })} />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setSelectedApp(null)}>إلغاء</Button>
                            <Button onClick={saveApp}><Save className="h-4 w-4" /> حفظ</Button>
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

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Save, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const BADGES = ["", "عاجل", "جديد", "بيان"];
const STATUS: Record<string, string> = { draft: "مسودة", published: "منشور" };
const empty = { title: "", link_url: "", badge: "", status: "published", is_active: true, display_order: 0 };

export default function NewsTickerAdmin() {
  const { isSuperAdmin } = useAuth();
  const [items, setItems] = useState<any[] | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    setItems(null);
    const { data, error } = await supabase
      .from("news_ticker_items" as any)
      .select("*")
      .order("display_order")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data as any) ?? []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.title?.trim()) return toast.error("العنوان مطلوب");
    const payload: any = {
      title: editing.title.trim(),
      link_url: editing.link_url?.trim() || null,
      badge: editing.badge || null,
      status: editing.status,
      is_active: editing.is_active,
      display_order: Number(editing.display_order) || 0,
    };
    if (editing.id) {
      const { error } = await supabase.from("news_ticker_items" as any).update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("news_ticker_items" as any).insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success("تم الحفظ"); setOpen(false); setEditing(null); load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("news_ticker_items" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف"); load();
  };

  const toggleActive = async (it: any) => {
    const { error } = await supabase.from("news_ticker_items" as any).update({ is_active: !it.is_active }).eq("id", it.id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div>
      <PageHeader title="شريط الأخبار" description="إدارة العناصر الظاهرة في شريط الأخبار في الصفحة الرئيسية." />
      <div className="flex justify-end mb-3">
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing({ ...empty })}><Plus className="h-4 w-4" /> عنصر جديد</Button>
          </DialogTrigger>
          {editing && (
            <DialogContent dir="rtl" className="max-w-lg">
              <DialogHeader><DialogTitle>{editing.id ? "تعديل عنصر" : "عنصر جديد"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>العنوان</Label><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
                <div><Label>الرابط</Label><Input dir="ltr" value={editing.link_url ?? ""} onChange={(e) => setEditing({ ...editing, link_url: e.target.value })} placeholder="/news/..." /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>الشارة</Label>
                    <Select value={editing.badge || "__none__"} onValueChange={(v) => setEditing({ ...editing, badge: v === "__none__" ? "" : v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">بدون</SelectItem>
                        {BADGES.filter(Boolean).map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>الحالة</Label>
                    <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 items-end">
                  <div><Label>الترتيب</Label><Input type="number" value={editing.display_order} onChange={(e) => setEditing({ ...editing, display_order: e.target.value })} /></div>
                  <div className="flex items-center justify-between border rounded-md p-2">
                    <Label>مفعّل</Label>
                    <Switch checked={editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
                  </div>
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

      {items === null ? (
        <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
      ) : items.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">لا توجد عناصر بعد.</Card>
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <Card key={it.id} className="p-4 flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="font-semibold flex items-center gap-2">
                  {it.badge && <Badge variant="destructive">{it.badge}</Badge>}
                  <span className="truncate">{it.title}</span>
                </div>
                {it.link_url && <div className="text-xs text-muted-foreground truncate" dir="ltr">{it.link_url}</div>}
              </div>
              <Badge variant="secondary">{STATUS[it.status]}</Badge>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">مفعّل</span>
                <Switch checked={it.is_active} onCheckedChange={() => toggleActive(it)} />
              </div>
              <Button size="sm" variant="outline" onClick={() => { setEditing(it); setOpen(true); }}><Edit className="h-3.5 w-3.5" /> تعديل</Button>
              {isSuperAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline" className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent dir="rtl">
                    <AlertDialogHeader><AlertDialogTitle>حذف العنصر</AlertDialogTitle><AlertDialogDescription>سيتم الحذف نهائيًا.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => remove(it.id)} className="bg-destructive">حذف</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

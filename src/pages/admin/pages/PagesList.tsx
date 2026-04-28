import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Edit, FileText } from "lucide-react";
import type { DynamicPage } from "@/hooks/useDynamicPages";

const STATUS_LABEL: Record<string, string> = {
  published: "منشور",
  draft: "مخفي",
  archived: "مؤرشف",
};

export default function PagesList() {
  const [rows, setRows] = useState<DynamicPage[] | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("site_pages").select("*").order("display_order");
      setRows((data as DynamicPage[]) ?? []);
    })();
  }, []);

  return (
    <div>
      <PageHeader
        title="إدارة الصفحات"
        description="تعديل محتوى الصفحات الثابتة (من نحن، الرؤية، الشراكات، الخصوصية، الشروط)."
      />
      <Card className="overflow-hidden">
        {rows === null ? (
          <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">لا توجد صفحات بعد.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-right">
                <tr>
                  <th className="p-3 font-semibold">العنوان</th>
                  <th className="p-3 font-semibold">الرابط</th>
                  <th className="p-3 font-semibold">الحالة</th>
                  <th className="p-3 font-semibold">في القائمة</th>
                  <th className="p-3 font-semibold">في الفوتر</th>
                  <th className="p-3 font-semibold">الترتيب</th>
                  <th className="p-3 font-semibold w-24">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-muted/30">
                    <td className="p-3 font-medium inline-flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /> {r.title}</td>
                    <td className="p-3 text-muted-foreground" dir="ltr">/{r.slug}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        r.status === "published" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      }`}>{STATUS_LABEL[r.status] ?? r.status}</span>
                    </td>
                    <td className="p-3">{r.show_in_header ? "نعم" : "لا"}</td>
                    <td className="p-3">{r.show_in_footer ? "نعم" : "لا"}</td>
                    <td className="p-3">{r.display_order}</td>
                    <td className="p-3">
                      <Button asChild size="icon" variant="ghost"><Link to={`/admin/pages/${r.id}`}><Edit className="h-4 w-4" /></Link></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

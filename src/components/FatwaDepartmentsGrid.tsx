import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import * as Icons from "lucide-react";

type Dept = { id: string; title: string; slug: string; description: string | null; icon: string | null };

export function FatwaDepartmentsGrid({
  selectedId,
  onSelect,
}: {
  selectedId?: string | null;
  onSelect?: (d: Dept) => void;
}) {
  const [items, setItems] = useState<Dept[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("fatwa_departments")
        .select("id,title,slug,description,icon")
        .eq("is_active", true)
        .order("display_order");
      setItems((data ?? []) as Dept[]);
    })();
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="mb-10">
      <h2 className="text-xl md:text-2xl font-bold mb-2 text-center">أقسام الفتوى والتحكيم</h2>
      <p className="text-sm text-muted-foreground text-center mb-6">
        اختر القسم المناسب لتوجيه طلبك إلى المختصين مباشرة.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map((d) => {
          const IconCmp = (d.icon && (Icons as any)[d.icon]) || Icons.Scale;
          const active = selectedId === d.id;
          return (
            <Card
              key={d.id}
              onClick={() => onSelect?.(d)}
              className={`p-4 cursor-pointer transition-all border-2 ${active ? "border-primary bg-primary/5" : "border-transparent hover:border-primary/40"}`}
            >
              <IconCmp className="h-7 w-7 text-primary mb-2" />
              <div className="font-bold text-sm mb-1">{d.title}</div>
              {d.description && <p className="text-xs text-muted-foreground line-clamp-2">{d.description}</p>}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

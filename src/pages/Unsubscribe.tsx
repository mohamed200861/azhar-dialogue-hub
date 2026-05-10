import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    (async () => {
      if (!token) {
        setState("error");
        setMessage("الرابط غير صالح.");
        return;
      }
      try {
        const { data, error } = await supabase.functions.invoke("unsubscribe-confirm", {
          body: { token },
        });
        if (error || !(data as { ok?: boolean })?.ok) {
          setState("error");
          setMessage("لم نتمكن من إلغاء الاشتراك. الرابط قد يكون منتهي الصلاحية أو غير صالح.");
          return;
        }
        setState("ok");
      } catch {
        setState("error");
        setMessage("حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.");
      }
    })();
  }, [token]);

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="max-w-md w-full p-8 text-center space-y-4">
        {state === "loading" && (
          <>
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">جارٍ معالجة طلبك...</p>
          </>
        )}
        {state === "ok" && (
          <>
            <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-600" />
            <h1 className="text-xl font-bold">تم إلغاء الاشتراك بنجاح</h1>
            <p className="text-muted-foreground">
              لن تتلقى رسائل إخبارية إضافية من اتحاد علماء الأزهر.
              يمكنك إعادة الاشتراك في أي وقت من خلال الموقع.
            </p>
            <Button asChild className="mt-4"><Link to="/">العودة إلى الصفحة الرئيسية</Link></Button>
          </>
        )}
        {state === "error" && (
          <>
            <AlertCircle className="h-12 w-12 mx-auto text-amber-600" />
            <h1 className="text-xl font-bold">تعذّر إلغاء الاشتراك</h1>
            <p className="text-muted-foreground">{message}</p>
            <Button asChild variant="outline" className="mt-4"><Link to="/">العودة إلى الصفحة الرئيسية</Link></Button>
          </>
        )}
      </Card>
    </div>
  );
}

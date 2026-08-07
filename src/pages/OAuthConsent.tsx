import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Loader2, ShieldCheck } from "lucide-react";

type OAuthNamespace = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: { message: string } | null }>;
};

const oauth = () => (supabase.auth as unknown as { oauth: OAuthNamespace }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "ربط تطبيق خارجي — اتحاد علماء الأزهر";
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/admin/login?next=" + encodeURIComponent(next);
        return;
      }
      const { data, error: err } = await oauth().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (err) {
        setError(err.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error: err } = approve
      ? await oauth().approveAuthorization(authorizationId)
      : await oauth().denyAuthorization(authorizationId);
    if (err) {
      setBusy(false);
      setError(err.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("لم يُرجع خادم الترخيص عنوان إعادة توجيه.");
      return;
    }
    window.location.href = target;
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex bg-white rounded-2xl p-3 shadow-soft mb-4">
            <Logo size={56} />
          </div>
          <h1 className="text-2xl font-bold">ربط تطبيق خارجي</h1>
        </div>

        <div className="card-elegant p-8 space-y-5">
          {error ? (
            <p className="text-sm text-destructive">تعذّر تحميل طلب الترخيص: {error}</p>
          ) : !details ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-primary text-sm font-semibold">
                <ShieldCheck className="h-4 w-4" />
                طلب صلاحية وصول
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                يطلب <span className="font-semibold text-foreground">{details.client?.name ?? "تطبيق خارجي"}</span> الوصول
                إلى أدوات الموقع باسم حسابك. لن يحصل التطبيق على صلاحيات أكثر من صلاحياتك الحالية.
              </p>
              <div className="flex gap-3">
                <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  الموافقة
                </Button>
                <Button variant="outline" className="flex-1" disabled={busy} onClick={() => decide(false)}>
                  رفض
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

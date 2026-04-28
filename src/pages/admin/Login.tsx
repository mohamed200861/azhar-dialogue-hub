import { useEffect, useState } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function AdminLogin() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    document.title = "تسجيل الدخول — لوحة تحكم اتحاد علماء الأزهر";
    (async () => {
      const { data } = await supabase.rpc("public_has_any_super_admin");
      setNeedsSetup(!data);
    })();
  }, []);

  if (!loading && user && isAdmin) return <Navigate to="/admin" replace />;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const { data: signInData, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      toast.error("بيانات الدخول غير صحيحة أو لا تملك صلاحية الوصول.");
      setSubmitting(false);
      return;
    }

    const uid = signInData.user?.id ?? signInData.session?.user?.id;
    if (!uid) {
      await supabase.auth.signOut();
      toast.error("بيانات الدخول غير صحيحة أو لا تملك صلاحية الوصول.");
      setSubmitting(false);
      return;
    }

    const { data: rolesData, error: rolesError } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    if (rolesError) {
      await supabase.auth.signOut();
      toast.error("بيانات الدخول غير صحيحة أو لا تملك صلاحية الوصول.");
      setSubmitting(false);
      return;
    }

    const roles = (rolesData ?? []).map((r: any) => r.role);
    const ok = roles.some((r: string) => ["super_admin", "admin", "editor", "media_manager"].includes(r));
    if (!ok) {
      await supabase.auth.signOut();
      toast.error("بيانات الدخول غير صحيحة أو لا تملك صلاحية الوصول.");
      setSubmitting(false);
      return;
    }
    // Block deactivated admins
    const { data: adminRec } = await supabase
      .from("admin_users")
      .select("is_active")
      .eq("user_id", uid)
      .maybeSingle();
    if (adminRec && adminRec.is_active === false) {
      await supabase.auth.signOut();
      toast.error("تم إيقاف هذا الحساب. يرجى التواصل مع المدير العام.");
      setSubmitting(false);
      return;
    }
    toast.success("تم تسجيل الدخول بنجاح");
    navigate("/admin", { replace: true });
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex bg-white rounded-2xl p-3 shadow-soft mb-4">
            <Logo size={56} />
          </div>
          <h1 className="text-2xl font-bold">لوحة تحكم الاتحاد</h1>
          <p className="text-muted-foreground text-sm mt-1">منطقة محمية — للمدراء المعتمدين فقط</p>
        </div>

        <form onSubmit={onSubmit} className="card-elegant p-8 space-y-5">
          <div className="flex items-center gap-2 text-primary text-sm font-semibold">
            <ShieldCheck className="h-4 w-4" />
            تسجيل دخول آمن
          </div>

          <div>
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              dir="ltr"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-left"
            />
          </div>
          <div>
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              dir="ltr"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="text-left"
            />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            تسجيل الدخول
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            بالدخول إلى لوحة التحكم فإنك توافق على سياسة الاستخدام الخاصة بإدارة الموقع.
          </p>

          {needsSetup && (
            <div className="text-center pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-2">لم يتم إنشاء المدير العام بعد.</p>
              <Button asChild variant="outline" size="sm">
                <Link to="/admin/setup">إعداد المدير العام</Link>
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

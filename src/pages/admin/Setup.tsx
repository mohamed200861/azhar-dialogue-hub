import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function AdminSetup() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "إعداد المدير العام — اتحاد علماء الأزهر";
    (async () => {
      const { data, error } = await supabase.rpc("public_has_any_super_admin");
      if (error) {
        setAllowed(false);
      } else {
        setAllowed(!data);
      }
      setChecking(false);
    })();
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!allowed) {
    toast.info("تم إنشاء المدير العام بالفعل. يرجى تسجيل الدخول.");
    return <Navigate to="/admin/login" replace />;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      toast.error("يرجى إدخال بريد إلكتروني صحيح.");
      return;
    }
    if (password.length < 8) {
      toast.error("كلمة المرور يجب أن لا تقل عن 8 أحرف.");
      return;
    }
    if (password !== confirm) {
      toast.error("تأكيد كلمة المرور غير مطابق.");
      return;
    }

    setSubmitting(true);
    try {
      // Re-check before creating to avoid race
      const { data: already } = await supabase.rpc("public_has_any_super_admin");
      if (already) {
        toast.error("تم إنشاء المدير العام بالفعل.");
        navigate("/admin/login", { replace: true });
        return;
      }

      const { data: signUp, error: signErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      if (signErr) {
        toast.error("تعذر إنشاء المدير العام. يرجى المحاولة مرة أخرى.");
        setSubmitting(false);
        return;
      }

      let uid = signUp.user?.id ?? null;

      // If email confirmation is off, sign-in to get a session
      if (!signUp.session) {
        const { data: si, error: siErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (siErr || !si.session) {
          toast.error("تم إنشاء الحساب لكن يلزم تأكيد البريد قبل المتابعة.");
          setSubmitting(false);
          return;
        }
        uid = si.user?.id ?? uid;
      }

      if (!uid) {
        toast.error("تعذر إنشاء المدير العام. يرجى المحاولة مرة أخرى.");
        setSubmitting(false);
        return;
      }

      const { data: ok, error: bsErr } = await supabase.rpc("bootstrap_first_super_admin", {
        _user_id: uid,
      });
      if (bsErr || !ok) {
        toast.error("تعذر تعيين دور المدير العام.");
        setSubmitting(false);
        return;
      }

      toast.success("تم إنشاء المدير العام بنجاح.");
      navigate("/admin", { replace: true });
    } catch {
      toast.error("تعذر إنشاء المدير العام. يرجى المحاولة مرة أخرى.");
      setSubmitting(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex bg-white rounded-2xl p-3 shadow-soft mb-4">
            <Logo size={56} />
          </div>
          <h1 className="text-2xl font-bold">إعداد المدير العام</h1>
          <p className="text-muted-foreground text-sm mt-1">إعداد لمرة واحدة فقط لإنشاء أول حساب إدارة</p>
        </div>

        <form onSubmit={onSubmit} className="card-elegant p-8 space-y-5">
          <div className="flex items-center gap-2 text-primary text-sm font-semibold">
            <ShieldCheck className="h-4 w-4" />
            إعداد آمن
          </div>

          <div>
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" type="email" autoComplete="email" dir="ltr" required
              value={email} onChange={(e) => setEmail(e.target.value)} className="text-left" />
          </div>
          <div>
            <Label htmlFor="password">كلمة المرور (8 أحرف على الأقل)</Label>
            <Input id="password" type="password" autoComplete="new-password" dir="ltr" required
              value={password} onChange={(e) => setPassword(e.target.value)} className="text-left" />
          </div>
          <div>
            <Label htmlFor="confirm">تأكيد كلمة المرور</Label>
            <Input id="confirm" type="password" autoComplete="new-password" dir="ltr" required
              value={confirm} onChange={(e) => setConfirm(e.target.value)} className="text-left" />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            إنشاء المدير العام
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            هذه الصفحة تُستخدم لمرة واحدة فقط لإنشاء أول مدير عام للموقع.
          </p>
        </form>
      </div>
    </div>
  );
}

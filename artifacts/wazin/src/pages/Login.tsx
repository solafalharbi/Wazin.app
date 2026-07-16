import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { getAuthToken } from "@workspace/api-client-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Login() {
  const { login } = useAuth();
  const { language } = useLanguage();
  const [, navigate] = useLocation();
  const isRtl = language === "ar";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = async () => {
    setError("");
    setLoading(true);
    try {
      const token = await getAuthToken();
      const res = await fetch("/api/auth/demo", {
        method: "POST",
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Demo login failed");
      const user = await res.json();
      // AuthContext.login updates user state — replicate that via refreshUser
      // by importing useAuth which already handles this. We call login with a
      // sentinel so we can reuse the context; simpler: just hit /auth/me after.
      navigate("/");
      // Force a page reload so AuthContext re-hydrates from the new session.
      window.location.href = "/";
    } catch (err) {
      setError("Demo login failed — please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-background flex items-center justify-center p-4"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-white" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3C8 3 4 6 4 10c0 5 8 11 8 11s8-6 8-11c0-4-4-7-8-7z" />
                <circle cx="12" cy="10" r="3" fill="currentColor" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Wazin <span className="text-purple-500">وازِن</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            {isRtl
              ? "رحلتك نحو الحرية المالية تبدأ هنا"
              : "Your journey to financial freedom starts here"}
          </p>
        </div>

        <Card className="border border-border/50 bg-card/80 backdrop-blur shadow-xl">
          <CardHeader className="pb-2 pt-6 px-6">
            <h2 className="text-xl font-semibold text-foreground">
              {isRtl ? "تسجيل الدخول" : "Sign in"}
            </h2>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">{isRtl ? "البريد الإلكتروني" : "Email"}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isRtl ? "أدخل بريدك الإلكتروني" : "Enter your email"}
                  required
                  autoComplete="email"
                  className="bg-background/60"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">{isRtl ? "كلمة المرور" : "Password"}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isRtl ? "أدخل كلمة المرور" : "Enter your password"}
                  required
                  autoComplete="current-password"
                  className="bg-background/60"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold h-11"
                disabled={loading}
              >
                {loading
                  ? (isRtl ? "جارٍ تسجيل الدخول…" : "Signing in…")
                  : (isRtl ? "تسجيل الدخول" : "Sign in")}
              </Button>
            </form>

            {/* Demo shortcut */}
            <div className="mt-4 pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground text-center mb-2">
                {isRtl ? "أو جرّب الحساب التجريبي" : "Or try the demo account"}
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full h-10 border-purple-500/40 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 text-sm"
                onClick={fillDemo}
              >
                {isRtl ? "🎮 دخول كـ صلوف (تجريبي)" : "🎮 Login as Solaf (Demo)"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          {isRtl ? "ليس لديك حساب؟ " : "Don't have an account? "}
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="text-purple-400 hover:text-purple-300 font-medium underline underline-offset-2"
          >
            {isRtl ? "إنشاء حساب" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  );
}

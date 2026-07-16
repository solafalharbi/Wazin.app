import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Register() {
  const { register } = useAuth();
  const { language } = useLanguage();
  const [, navigate] = useLocation();
  const isRtl = language === "ar";

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError(isRtl ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل" : "Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await register(username, email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
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
              ? "ابدأ رحلتك المالية من المستوى الأول"
              : "Start your financial journey at Level 1"}
          </p>
        </div>

        <Card className="border border-border/50 bg-card/80 backdrop-blur shadow-xl">
          <CardHeader className="pb-2 pt-6 px-6">
            <h2 className="text-xl font-semibold text-foreground">
              {isRtl ? "إنشاء حساب" : "Create account"}
            </h2>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username">{isRtl ? "الاسم" : "Name"}</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={isRtl ? "اسمك" : "Your name"}
                  required
                  autoComplete="name"
                  className="bg-background/60"
                />
              </div>

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
                  placeholder={isRtl ? "6 أحرف على الأقل" : "At least 6 characters"}
                  required
                  minLength={6}
                  autoComplete="new-password"
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
                  ? (isRtl ? "جارٍ الإنشاء…" : "Creating account…")
                  : (isRtl ? "إنشاء حساب" : "Create account")}
              </Button>
            </form>

            {/* Level 1 badge hint */}
            <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-3 text-sm text-muted-foreground">
              <div className="w-9 h-9 rounded-full bg-purple-600/20 border border-purple-500/40 flex items-center justify-center shrink-0">
                <span className="text-purple-400 font-bold text-xs">L1</span>
              </div>
              <p>{isRtl ? "ستبدأ من المستوى الأول وتكسب 100 عملة ترحيبية!" : "You'll start at Level 1 and earn 100 welcome coins!"}</p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          {isRtl ? "لديك حساب بالفعل؟ " : "Already have an account? "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-purple-400 hover:text-purple-300 font-medium underline underline-offset-2"
          >
            {isRtl ? "تسجيل الدخول" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";

export default function Register() {
  const { register } = useAuth();
  const { language } = useLanguage();
  const [, navigate] = useLocation();
  const isRtl = language === "ar";

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <AuthLayout>
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="px-0 pb-2">
          <p className="text-sm text-muted-foreground mb-1">
            {isRtl ? "إنشاء حساب في" : "Create an account on"}
          </p>
          <h2 className="text-2xl font-bold text-foreground">
            {isRtl ? "إنشاء حساب جديد" : "Create a new account"}
          </h2>
        </CardHeader>
        <CardContent className="px-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="font-medium text-sm">
                {isRtl ? "الاسم الكامل" : "Full name"}
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isRtl ? "أدخل اسمك الكامل" : "Enter your full name"}
                required
                autoComplete="name"
                className="h-12 bg-muted/40 border-0 focus-visible:ring-2 focus-visible:ring-[#6C4AB6]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="font-medium text-sm">
                {isRtl ? "البريد الإلكتروني" : "Email"}
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isRtl ? "أدخل بريدك الإلكتروني" : "Enter your email"}
                required
                autoComplete="email"
                className="h-12 bg-muted/40 border-0 focus-visible:ring-2 focus-visible:ring-[#6C4AB6]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="font-medium text-sm">
                {isRtl ? "كلمة المرور" : "Password"}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isRtl ? "6 أحرف على الأقل" : "At least 6 characters"}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="h-12 bg-muted/40 border-0 focus-visible:ring-2 focus-visible:ring-[#6C4AB6] pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-[#6C4AB6] hover:bg-[#5a3d9e] text-white font-semibold text-base"
              disabled={loading}
            >
              {loading
                ? (isRtl ? "جارٍ الإنشاء…" : "Creating account…")
                : (isRtl ? "إنشاء حساب" : "Create account")}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isRtl ? "لديك حساب بالفعل؟ " : "Already have an account? "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-[#6C4AB6] hover:text-[#5a3d9e] font-medium underline underline-offset-2"
            >
              {isRtl ? "تسجيل الدخول" : "Sign in"}
            </button>
          </p>

          {/* Level 1 badge hint */}
          <div className="mt-6 pt-4 border-t border-border/50 flex items-center gap-3 text-sm text-muted-foreground">
            <div className="w-9 h-9 rounded-full bg-[#6C4AB6]/15 border border-[#6C4AB6]/30 flex items-center justify-center shrink-0">
              <span className="text-[#6C4AB6] font-bold text-xs">L1</span>
            </div>
            <p>{isRtl ? "ستبدأ من المستوى الأول وتكسب 100 عملة ترحيبية!" : "You'll start at Level 1 and earn 100 welcome coins!"}</p>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

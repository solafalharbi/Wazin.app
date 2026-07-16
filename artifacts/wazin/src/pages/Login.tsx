import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { getAuthToken } from "@workspace/api-client-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";

const DEV_CODE = "6767";

export default function Login() {
  const { login } = useAuth();
  const { language } = useLanguage();
  const [, navigate] = useLocation();
  const isRtl = language === "ar";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showDevPin, setShowDevPin] = useState(false);
  const [devPin, setDevPin] = useState("");
  const [devPinError, setDevPinError] = useState("");

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

  const handleDevPinChange = (val: string) => {
    if (!/^\d*$/.test(val) || val.length > 4) return;
    setDevPin(val);
    setDevPinError("");
  };

  const handleDevAccess = async () => {
    if (devPin !== DEV_CODE) {
      setDevPinError(isRtl ? "رمز غير صحيح" : "Incorrect code");
      setDevPin("");
      return;
    }
    setDevPinError("");
    setLoading(true);
    try {
      const token = await getAuthToken();
      const res = await fetch("/api/auth/demo", {
        method: "POST",
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Dev login failed");
      window.location.href = "/";
    } catch {
      setDevPinError(isRtl ? "فشل الدخول، حاول مجدداً" : "Login failed — try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="px-0 pb-2">
          <p className="text-sm text-muted-foreground mb-1">
            {isRtl ? "تسجيل الدخول إلى" : "Login to"}
          </p>
          <h2 className="text-2xl font-bold text-foreground">
            {isRtl ? "تسجيل الدخول إلى حسابك" : "Sign in to your account"}
          </h2>
        </CardHeader>
        <CardContent className="px-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="font-medium text-sm">
                {isRtl ? "اسم المستخدم أو البريد الإلكتروني" : "Username or email"}
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isRtl ? "أدخل اسم المستخدم أو البريد الإلكتروني" : "Enter your username or email"}
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
                  placeholder={isRtl ? "أدخل كلمة المرور" : "Enter your password"}
                  required
                  autoComplete="current-password"
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

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-muted-foreground/30 text-[#6C4AB6] focus:ring-[#6C4AB6]" />
                <span className="text-muted-foreground">{isRtl ? "تذكرني" : "Remember me"}</span>
              </label>
              <button type="button" className="text-[#6C4AB6] hover:underline">
                {isRtl ? "نسيت كلمة المرور؟" : "Forgot password?"}
              </button>
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
                ? (isRtl ? "جارٍ تسجيل الدخول…" : "Signing in…")
                : (isRtl ? "تسجيل الدخول" : "Sign in")}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isRtl ? "مستخدم جديد؟ " : "New user? "}
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="text-[#6C4AB6] hover:text-[#5a3d9e] font-medium underline underline-offset-2"
            >
              {isRtl ? "تسجيل جديد" : "Register"}
            </button>
          </p>

          {/* Developer access */}
          <div className="mt-6 pt-4 border-t border-border/50">
            {!showDevPin ? (
              <Button
                type="button"
                variant="ghost"
                className="w-full h-9 text-xs text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/30"
                onClick={() => { setShowDevPin(true); setDevPin(""); setDevPinError(""); }}
              >
                {isRtl ? "⚙️ وصول المطور" : "⚙️ Developer Access"}
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground text-center">
                  {isRtl ? "أدخل رمز المطور المكوّن من 4 أرقام" : "Enter the 4-digit developer code"}
                </p>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={devPin}
                    onChange={(e) => handleDevPinChange(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && devPin.length === 4 && handleDevAccess()}
                    placeholder="••••"
                    className="bg-muted/40 text-center tracking-[0.5em] font-mono text-lg h-11"
                    autoFocus
                  />
                  <Button
                    type="button"
                    onClick={handleDevAccess}
                    disabled={devPin.length !== 4 || loading}
                    className="h-11 px-4 bg-zinc-700 hover:bg-zinc-600 text-white shrink-0"
                  >
                    {isRtl ? "دخول" : "Enter"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => { setShowDevPin(false); setDevPin(""); setDevPinError(""); }}
                    className="h-11 px-3 text-muted-foreground shrink-0"
                  >
                    ✕
                  </Button>
                </div>
                {devPinError && (
                  <p className="text-xs text-destructive text-center">{devPinError}</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

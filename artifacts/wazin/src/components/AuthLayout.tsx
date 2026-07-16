import { useLanguage } from "@/contexts/LanguageContext";
import { Scale } from "lucide-react";
import { cn } from "@/lib/utils";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const { language, setLanguage } = useLanguage();
  const isRtl = language === "ar";
  const toggleLanguage = () => setLanguage(isRtl ? "en" : "ar");

  return (
    <div className="min-h-screen w-full flex" dir={isRtl ? "rtl" : "ltr"}>
      {/* Left branded panel — logo placeholder */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center bg-[#6C4AB6] overflow-hidden">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-white rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
        </div>

        {/* Geometric blocks like Tuwaiq design */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className={cn("absolute top-0 bg-white/10 w-24 h-16 rounded-br-2xl", isRtl ? "left-0 rounded-bl-2xl rounded-br-none" : "right-0 rounded-bl-2xl rounded-br-none")} />
          <div className={cn("absolute bottom-0 bg-white/10 w-28 h-20 rounded-tr-2xl", isRtl ? "right-0 rounded-tl-2xl rounded-tr-none" : "left-0 rounded-tl-2xl rounded-tr-none")} />
        </div>

        {/* Logo placeholder area */}
        <div className="relative z-10 flex flex-col items-center text-center px-8">
          <div className="w-32 h-32 rounded-3xl bg-white/20 flex items-center justify-center mb-8 backdrop-blur-sm border border-white/30">
            <Scale className="w-16 h-16 text-white" />
          </div>
          <h2 className="text-5xl font-bold text-white mb-2 tracking-tight">Wazin</h2>
          <h2 className="text-4xl font-bold text-white/90 mb-6">وازِن</h2>
          <p className="text-white/80 text-lg max-w-sm">
            {isRtl
              ? "رحلتك نحو الحرية المالية تبدأ هنا"
              : "Your journey to financial freedom starts here"}
          </p>
        </div>

        <p className="absolute bottom-6 text-white/50 text-sm">
          {isRtl ? "سيتم إضافة الشعار قريباً" : "Logo will be added soon"}
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background relative">
        {/* Language toggle — top corner */}
        <button
          onClick={toggleLanguage}
          className={cn(
            "absolute top-5 flex items-center gap-2 px-3 py-1.5 rounded-full border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-[#6C4AB6]/50 transition-colors",
            isRtl ? "left-5" : "right-5"
          )}
        >
          <span className="text-base leading-none">{isRtl ? "🇬🇧" : "🇸🇦"}</span>
          <span>{isRtl ? "English" : "العربية"}</span>
        </button>

        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#6C4AB6] flex items-center justify-center">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-[#6C4AB6]">
              Wazin <span className="font-normal">وازِن</span>
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}

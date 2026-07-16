import React from 'react';
import { useLocation, Link } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Gamepad2, 
  CalendarDays, 
  MessageSquare, 
  Gift, 
  Trophy, 
  User, 
  Menu,
  Sun,
  Moon,
  Scale,
  Sparkles,
  BrainCircuit,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

export function Sidebar({ className }: { className?: string }) {
  const [location] = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();

  const navItems = [
    { href: '/', icon: LayoutDashboard, labelAr: 'الرئيسية', labelEn: 'Dashboard' },
    { href: '/simulation', icon: Gamepad2, labelAr: 'المحاكاة', labelEn: 'Simulation' },
    { href: '/events', icon: CalendarDays, labelAr: 'الأحداث', labelEn: 'Events' },
    { href: '/ai-advisor', icon: MessageSquare, labelAr: 'المستشار الذكي', labelEn: 'AI Advisor' },
    { href: '/rewards', icon: Gift, labelAr: 'المكافآت', labelEn: 'Rewards' },
    { href: '/leaderboard', icon: Trophy, labelAr: 'لوحة الصدارة', labelEn: 'Leaderboard' },
    { href: '/profile', icon: User, labelAr: 'الملف الشخصي', labelEn: 'Profile' },
    { href: '/scenarios', icon: Sparkles, labelAr: 'سيناريوهات الذكاء', labelEn: 'AI Scenarios' },
    { href: '/personality', icon: BrainCircuit, labelAr: 'شخصيتي المالية', labelEn: 'My Personality' },
    { href: '/financial-twin', icon: TrendingUp, labelAr: 'توأمي المالي', labelEn: 'Financial Twin' },
  ];

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const SidebarContent = (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground p-4">
      <div className="flex items-center gap-3 mb-8 px-2 mt-4">
        <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground shadow-md">
          <Scale size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-sidebar-primary tracking-tight">
            {t('وازِن', 'Wazin')}
          </h1>
        </div>
      </div>

      <div className="mb-8 px-2">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-12 w-12 border-2 border-sidebar-primary">
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground font-semibold">
              {(user?.username ?? '').substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1">
            <span className="font-semibold text-lg">{user?.username ?? ''}</span>
            <span className="text-xs text-sidebar-foreground/60">
              {language === 'ar' ? `المستوى ${user?.level ?? 1}` : `Level ${user?.level ?? 1}`}
            </span>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-sidebar-foreground/70">
            <span>XP</span>
            <span>{user?.xp ?? 0} / {((user?.level ?? 1) * 500)}</span>
          </div>
          <Progress value={(((user?.xp ?? 0) % ((user?.level ?? 1) * 500)) / ((user?.level ?? 1) * 500)) * 100} className="h-2 bg-sidebar-accent [&>div]:bg-sidebar-primary" />
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.href} href={item.href} className="block">
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 cursor-pointer font-medium hover-elevate",
                  isActive 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md" 
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon size={20} className={cn("shrink-0", isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/60")} />
                <span>{t(item.labelAr, item.labelEn)}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-sidebar-border flex flex-col gap-2">
        <Button 
          variant="ghost" 
          className="justify-start gap-3 w-full text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={toggleLanguage}
        >
          <span className="font-bold text-lg leading-none shrink-0 w-5 flex justify-center">
            {language === 'ar' ? 'EN' : 'ع'}
          </span>
          <span>{t('English', 'العربية')}</span>
        </Button>
        <Button 
          variant="ghost" 
          className="justify-start gap-3 w-full text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <Sun size={20} className="shrink-0" /> : <Moon size={20} className="shrink-0" />}
          <span>{t(theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن', theme === 'dark' ? 'Light Mode' : 'Dark Mode')}</span>
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn("hidden md:flex w-72 flex-col fixed inset-y-0 border-r border-sidebar-border", className)}>
        {SidebarContent}
      </aside>

      {/* Mobile Topbar & Sheet */}
      <div className="md:hidden fixed top-0 inset-x-0 h-16 border-b border-border bg-sidebar text-sidebar-foreground z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground">
            <Scale size={16} />
          </div>
          <span className="font-bold text-lg text-sidebar-primary">{t('وازِن', 'Wazin')}</span>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:bg-sidebar-accent">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side={language === 'ar' ? 'right' : 'left'} className="p-0 border-sidebar-border bg-sidebar w-72">
            {SidebarContent}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

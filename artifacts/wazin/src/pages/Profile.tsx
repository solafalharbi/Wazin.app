import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from 'next-themes';
import { useGetUserProfile, useUpdateUserProfile } from '@workspace/api-client-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { User, Settings, Globe, Moon, Sun, Save, Shield, LogOut } from 'lucide-react';

export default function Profile() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { data: profile, isLoading, refetch } = useGetUserProfile();
  const updateProfile = useUpdateUserProfile();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // logout navigates away regardless
    }
  };

  const [username, setUsername] = React.useState('');

  React.useEffect(() => {
    if (profile?.username) {
      setUsername(profile.username);
    }
  }, [profile]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const handleSave = () => {
    updateProfile.mutate({
      data: { username }
    }, {
      onSuccess: () => {
        toast.success(t('تم تحديث الملف الشخصي بنجاح', 'Profile updated successfully'));
        refetch();
      }
    });
  };

  const handleLanguageToggle = (checked: boolean) => {
    const newLang = checked ? 'ar' : 'en';
    setLanguage(newLang);
    updateProfile.mutate({ data: { language: newLang } });
  };

  const handleThemeToggle = (checked: boolean) => {
    const newTheme = checked ? 'dark' : 'light';
    setTheme(newTheme);
    updateProfile.mutate({ data: { theme: newTheme } });
  };

  const p = profile || {
    username: '',
    email: '',
    xp: 0,
    level: 1,
    coins: 0,
    joinedAt: new Date().toISOString()
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-3xl mx-auto pb-20">
      <h1 className="text-3xl font-bold tracking-tight mb-6">{t('الملف الشخصي', 'Profile')}</h1>

      {/* Header Card */}
      <Card className="bg-gradient-to-br from-primary/10 via-background to-background overflow-hidden relative border-primary/20">
        <div className="absolute top-0 left-0 w-full h-24 bg-primary/20" />
        <CardContent className="pt-12 px-6 pb-6 relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-6">
          <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
              {username.substring(0, 2).toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold">{username}</h2>
            <p className="text-muted-foreground">{p.email}</p>
          </div>
          <div className="flex gap-4 w-full sm:w-auto mt-4 sm:mt-0">
            <div className="bg-background/80 backdrop-blur rounded-lg p-3 text-center flex-1 border shadow-sm">
              <div className="text-xs text-muted-foreground uppercase">{t('المستوى', 'Level')}</div>
              <div className="font-bold text-xl text-primary">{p.level}</div>
            </div>
            <div className="bg-background/80 backdrop-blur rounded-lg p-3 text-center flex-1 border shadow-sm">
              <div className="text-xs text-muted-foreground uppercase">XP</div>
              <div className="font-bold text-xl">{p.xp}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User size={18} className="text-primary" />
              {t('المعلومات الشخصية', 'Personal Information')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{t('الاسم', 'Name')}</Label>
              <Input 
                id="username" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('البريد الإلكتروني', 'Email')}</Label>
              <Input 
                id="email" 
                value={p.email} 
                disabled 
                className="bg-muted opacity-70"
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Shield size={12} />
                {t('لا يمكن تغيير البريد الإلكتروني حالياً', 'Email cannot be changed currently')}
              </p>
            </div>
            <Button onClick={handleSave} disabled={updateProfile.isPending || username === profile?.username} className="w-full mt-4 gap-2">
              <Save size={16} />
              {t('حفظ التغييرات', 'Save Changes')}
            </Button>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings size={18} className="text-primary" />
              {t('التفضيلات', 'Preferences')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-md text-primary">
                  <Globe size={18} />
                </div>
                <div>
                  <div className="font-medium">{t('اللغة العربية', 'Arabic Language')}</div>
                  <div className="text-xs text-muted-foreground">
                    {t('تبديل واجهة التطبيق', 'Switch app interface')}
                  </div>
                </div>
              </div>
              <Switch 
                checked={language === 'ar'} 
                onCheckedChange={handleLanguageToggle}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-md text-primary">
                  {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                </div>
                <div>
                  <div className="font-medium">{t('الوضع الداكن', 'Dark Mode')}</div>
                  <div className="text-xs text-muted-foreground">
                    {t('تبديل مظهر التطبيق', 'Switch app appearance')}
                  </div>
                </div>
              </div>
              <Switch 
                checked={theme === 'dark'} 
                onCheckedChange={handleThemeToggle}
              />
            </div>
            
            <div className="pt-4 border-t border-border mt-6">
              <p className="text-xs text-center text-muted-foreground">
                {t('عضو منذ:', 'Member since:')} {new Date(p.joinedAt).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logout */}
      <div className="pt-2">
        <Button
          variant="outline"
          className="w-full h-11 border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground gap-2 transition-colors"
          onClick={handleLogout}
        >
          <LogOut size={18} />
          {t('تسجيل الخروج', 'Log out')}
        </Button>
      </div>
    </div>
  );
}

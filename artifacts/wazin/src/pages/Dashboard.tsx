import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGetDashboardSummary, useGetActivityFeed } from '@workspace/api-client-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Trophy, Zap, Lightbulb, TrendingUp, Coins, Activity, ArrowUpRight, ArrowDownRight, Target, Gamepad2, Gift, MessageSquare } from 'lucide-react';
import { Link } from 'wouter';
import { 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { t, language } = useLanguage();
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: activities, isLoading: isLoadingActivities } = useGetActivityFeed();

  if (isLoadingSummary || isLoadingActivities) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 w-full rounded-xl lg:col-span-2" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // Fallback data if API returns empty
  const s = summary || {
    user: { username: '', xp: 450, level: 4, coins: 1200 },
    budgetHealth: 85,
    xpToNextLevel: 550,
    activeChallenges: 2,
    totalRewards: 5,
    weeklyXpGain: 120,
    rank: 4,
    spendingBreakdown: [
      { category: 'Food', categoryAr: 'طعام', amount: 800, percentage: 40, color: 'hsl(var(--chart-1))' },
      { category: 'Transport', categoryAr: 'مواصلات', amount: 400, percentage: 20, color: 'hsl(var(--chart-2))' },
      { category: 'Entertainment', categoryAr: 'ترفيه', amount: 600, percentage: 30, color: 'hsl(var(--chart-3))' },
      { category: 'Savings', categoryAr: 'مدخرات', amount: 200, percentage: 10, color: 'hsl(var(--chart-4))' },
    ]
  };

  const acts = activities || [
    { id: 1, type: 'decision', titleEn: 'Market Crash Avoided', titleAr: 'تجنب انهيار السوق', descriptionEn: 'Smart move protecting assets.', descriptionAr: 'حركة ذكية لحماية الأصول', xpChange: 50, coinsChange: 10, createdAt: new Date().toISOString() },
    { id: 2, type: 'level_up', titleEn: 'Level 4 Reached!', titleAr: 'وصلت للمستوى 4!', descriptionEn: 'You are moving up.', descriptionAr: 'أنت تتقدم بسرعة', xpChange: 0, coinsChange: 100, createdAt: new Date().toISOString() },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">
            {language === 'ar'
              ? `أهلاً بعودتك يا ${s.user?.username ?? ''}!`
              : `Welcome back, ${s.user?.username ?? ''}!`}
          </h1>
          <p className="text-muted-foreground">
            {t('ها هي نظرة سريعة على تقدمك المالي هذا الأسبوع.', 'Here is a quick look at your financial progress this week.')}
          </p>
        </div>
        <Link href="/simulation" className="w-full md:w-auto">
          <Button size="lg" className="w-full gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow">
            <Gamepad2 size={20} />
            <span>{t('متابعة المحاكاة', 'Resume Simulation')}</span>
          </Button>
        </Link>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-primary/20 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Trophy size={48} />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="font-medium">{t('الترتيب الحالي', 'Current Rank')}</CardDescription>
            <CardTitle className="text-4xl flex items-baseline gap-2 text-primary">
              #{s.rank}
              <span className="text-sm text-muted-foreground font-normal">
                {t('في التحدي', 'in challenge')}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm text-emerald-500 font-medium">
              <TrendingUp size={14} />
              <span>+{s.weeklyXpGain} XP {t('هذا الأسبوع', 'this week')}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity size={48} />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="font-medium">{t('صحة الميزانية', 'Budget Health')}</CardDescription>
            <CardTitle className="text-4xl flex items-baseline gap-2">
              {s.budgetHealth}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={s.budgetHealth} className={cn("h-2", s.budgetHealth > 80 ? "[&>div]:bg-emerald-500" : s.budgetHealth > 50 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-destructive")} />
            <p className="text-xs text-muted-foreground mt-2">
              {s.budgetHealth > 80 ? t('أداء ممتاز!', 'Excellent performance!') : t('يحتاج بعض التحسين', 'Needs some improvement')}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Coins size={48} />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="font-medium">{t('رصيد العملات', 'Coins Balance')}</CardDescription>
            <CardTitle className="text-4xl flex items-baseline gap-2 text-amber-500">
              {s.user?.coins || 1200}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/rewards" className="text-sm text-primary hover:underline flex items-center gap-1">
              {t('استبدل المكافآت', 'Redeem rewards')} <ArrowUpRight size={14} />
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Target size={48} />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="font-medium">{t('تحديات نشطة', 'Active Challenges')}</CardDescription>
            <CardTitle className="text-4xl flex items-baseline gap-2">
              {s.activeChallenges}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/events" className="text-sm text-primary hover:underline flex items-center gap-1">
              {t('عرض التفاصيل', 'View details')} <ArrowUpRight size={14} />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Charts & Insights) */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          
          {/* AI Insight Card - PROMINENT */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 shadow-inner">
            <CardContent className="p-6 flex gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                <Lightbulb size={24} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  {t('نصيحة المستشار الذكي', 'AI Advisor Insight')}
                </h3>
                <p className="text-foreground/80 leading-relaxed mb-4">
                  {t(
                    'معدل إنفاقك على "الترفيه" أعلى بنسبة 15% من الشهر الماضي. أقترح تخصيص هذا الفارق للطوارئ استعداداً للحدث الاقتصادي القادم.',
                    'Your spending on "Entertainment" is 15% higher than last month. I suggest allocating this difference to emergencies in preparation for the upcoming economic event.'
                  )}
                </p>
                <div className="flex gap-2">
                  <Link href="/ai-advisor">
                    <Button variant="default" size="sm" className="gap-2">
                      <MessageSquare size={16} />
                      {t('تحدث مع المستشار', 'Chat with Advisor')}
                    </Button>
                  </Link>
                  <Link href="/simulation">
                    <Button variant="outline" size="sm" className="gap-2 bg-background/50">
                      {t('تعديل الميزانية', 'Adjust Budget')}
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Spending Breakdown */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>{t('تحليل الإنفاق (هذا الشهر)', 'Spending Breakdown (This Month)')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={s.spendingBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="amount"
                      nameKey={language === 'ar' ? 'categoryAr' : 'category'}
                      stroke="none"
                    >
                      {s.spendingBreakdown?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || `hsl(var(--chart-${(index % 5) + 1}))`} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value} SR`, t('المبلغ', 'Amount')]}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {s.spendingBreakdown?.map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center p-3 rounded-lg bg-muted/50 text-center">
                    <div className="w-3 h-3 rounded-full mb-2" style={{ backgroundColor: item.color || `hsl(var(--chart-${(idx % 5) + 1}))` }} />
                    <span className="text-sm font-medium">{language === 'ar' ? item.categoryAr : item.category}</span>
                    <span className="text-xs text-muted-foreground">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right Column (Activity Feed & XP) */}
        <div className="space-y-6">
          
          {/* XP Progress */}
          <Card className="shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10" />
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{t('تقدم المستوى', 'Level Progress')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end mb-2">
                <div className="text-3xl font-bold">Lvl {s.user?.level || 4}</div>
                <div className="text-sm text-muted-foreground">{s.xpToNextLevel} {t('XP للمستوى التالي', 'XP to next')}</div>
              </div>
              <Progress value={((s.user?.xp || 450) / ((s.user?.xp || 450) + s.xpToNextLevel)) * 100} className="h-3 mb-4" />
              <div className="text-xs text-center text-muted-foreground">
                {t('استمر في اللعب لفتح مكافآت جديدة من مصرف الإنماء!', 'Keep playing to unlock new rewards from Alinma Bank!')}
              </div>
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card className="shadow-sm flex-1 flex flex-col h-[420px]">
            <CardHeader>
              <CardTitle className="text-lg">{t('أحدث النشاطات', 'Recent Activity')}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto pr-2 pb-4 space-y-4">
              {acts.map((act) => (
                <div key={act.id} className="flex gap-3 group relative">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm",
                      act.type === 'decision' ? "bg-blue-500" :
                      act.type === 'reward' ? "bg-amber-500" :
                      act.type === 'level_up' ? "bg-emerald-500" :
                      act.type === 'challenge' ? "bg-purple-500" : "bg-primary"
                    )}>
                      {act.type === 'decision' && <ArrowDownRight size={16} />}
                      {act.type === 'reward' && <Gift size={16} />}
                      {act.type === 'level_up' && <Zap size={16} />}
                      {act.type === 'challenge' && <Target size={16} />}
                      {act.type === 'ai_advice' && <Lightbulb size={16} />}
                    </div>
                    <div className="w-px h-full bg-border mt-2 group-last:hidden" />
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-semibold">{language === 'ar' ? act.titleAr : act.titleEn}</p>
                    <p className="text-xs text-muted-foreground mt-1 mb-2">{language === 'ar' ? act.descriptionAr : act.descriptionEn}</p>
                    <div className="flex gap-2">
                      {act.xpChange > 0 && (
                        <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                          +{act.xpChange} XP
                        </span>
                      )}
                      {act.coinsChange && act.coinsChange > 0 && (
                        <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                          +{act.coinsChange} {t('عملة', 'Coins')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

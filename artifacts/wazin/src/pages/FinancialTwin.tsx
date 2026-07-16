import React, { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetTwinProjection,
  useGenerateTwinProjection,
  getGetTwinProjectionQueryKey,
} from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Telescope, TrendingUp, AlertTriangle, Target, Activity, Wallet, ShieldAlert } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function FinancialTwin() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useGetTwinProjection();
  const generateTwin = useGenerateTwinProjection();

  const handleGenerate = () => {
    generateTwin.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetTwinProjectionQueryKey() });
        toast({
          title: t('تم إنشاء التوأم المالي!', 'Financial Twin Generated!'),
          description: t('تم حساب التوقعات المالية بنجاح.', 'Financial projections calculated successfully.'),
        });
      },
      onError: () => {
        toast({
          title: t('حدث خطأ', 'Error'),
          description: t('لم نتمكن من توليد التوأم المالي. حاول مرة أخرى.', 'Could not generate financial twin. Try again.'),
          variant: 'destructive',
        });
      },
    });
  };

  const chartData = useMemo(() => {
    if (!data || !data.scenarios) return [];
    const baseScen = data.scenarios.find((s) => s.type === 'base');
    if (!baseScen) return [];

    return baseScen.projections.map((p, i) => {
      const year = p.year;
      const opt = data.scenarios.find((s) => s.type === 'optimistic')?.projections[i]?.netWorth || p.netWorth;
      const base = p.netWorth;
      const pess = data.scenarios.find((s) => s.type === 'pessimistic')?.projections[i]?.netWorth || p.netWorth;

      return {
        year,
        optimistic: opt,
        base: base,
        pessimistic: pess,
      };
    });
  }, [data]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'medium': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'high': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20';
    }
  };

  if (isLoading && !isError) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('توأمك المالي', 'Financial Twin')}</h1>
          <p className="text-muted-foreground mt-1 text-lg">
            {t('توقع مستقبلك المالي عبر مسارات مختلفة ومحاكاة المخاطر.', 'Project your financial future through different paths and simulate risks.')}
          </p>
        </div>
        <Button 
          onClick={handleGenerate} 
          disabled={generateTwin.isPending}
          className="bg-primary/90 hover:bg-primary gap-2 shadow-sm transition-all"
        >
          {generateTwin.isPending ? (
            <Activity className="w-5 h-5 animate-pulse" />
          ) : (
            <Telescope className="w-5 h-5 text-indigo-300" />
          )}
          {t('تحديث التوقعات', 'Generate Projection')}
        </Button>
      </div>

      {!data ? (
        <Card className="border-dashed border-2 bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Telescope className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{t('رؤية مستقبلك المالي', 'See Your Financial Future')}</h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              {t('سنقوم ببناء توأم مالي رقمي لك لتوقع نمو ثروتك في السنوات العشر القادمة.', 'We will build a digital financial twin to project your wealth growth over the next 10 years.')}
            </p>
            <Button onClick={handleGenerate} disabled={generateTwin.isPending} size="lg" className="gap-2">
              <TrendingUp className="w-5 h-5" />
              {t('بناء التوأم المالي', 'Build Financial Twin')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Summary Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2 bg-gradient-to-br from-primary/5 to-transparent border-primary/20 shadow-sm">
              <CardContent className="p-6 flex flex-col justify-center h-full">
                <h3 className="font-semibold text-primary mb-2 flex items-center gap-2">
                  <Telescope className="w-5 h-5" />
                  {t('الملخص المستقبلي', 'Future Summary')}
                </h3>
                <p className="text-lg leading-relaxed font-medium">
                  {language === 'ar' ? data.summaryAr : data.summaryEn}
                </p>
              </CardContent>
            </Card>
            <div className="flex flex-col gap-4">
              <Card className="shadow-sm">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-full shrink-0">
                    <Wallet className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t('الدخل الشهري الحالي', 'Current Monthly Income')}</p>
                    <p className="text-2xl font-bold font-mono">
                      {data.currentMonthlyIncome.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">{t('ر.س', 'SAR')}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 rounded-full shrink-0">
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t('معدل الادخار', 'Savings Rate')}</p>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-lg px-3">
                      {data.currentSavingsRate}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Chart */}
          <Card className="shadow-sm border-primary/10">
            <CardHeader>
              <CardTitle>{t('مسار الثروة الصافية (10 سنوات)', 'Net Worth Trajectory (10 Years)')}</CardTitle>
              <CardDescription>{t('مقارنة بين السيناريوهات المتفائلة والأساسية والمتشائمة.', 'Comparison between optimistic, base, and pessimistic scenarios.')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full mt-4" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.2)" />
                    <XAxis 
                      dataKey="year" 
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      dy={10}
                    />
                    <YAxis 
                      tickFormatter={(value) => `${(value / 1000)}k`} 
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      dx={-10}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toLocaleString()} SAR`, '']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Line 
                      type="monotone" 
                      name={t('متفائل', 'Optimistic')} 
                      dataKey="optimistic" 
                      stroke="#10b981" 
                      strokeWidth={3} 
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      name={t('أساسي', 'Base')} 
                      dataKey="base" 
                      stroke="#3b82f6" 
                      strokeWidth={4} 
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 8 }}
                    />
                    <Line 
                      type="monotone" 
                      name={t('متشائم', 'Pessimistic')} 
                      dataKey="pessimistic" 
                      stroke="#f43f5e" 
                      strokeWidth={3} 
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Goals */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  {t('الأهداف المالية', 'Financial Goals')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.goals.map((goal, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">{language === 'ar' ? goal.titleAr : goal.titleEn}</span>
                        {goal.isAchievable ? (
                          <Badge variant="default" className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/30 border-0">{t('ممكن تحقيقه', 'Achievable')}</Badge>
                        ) : (
                          <Badge variant="default" className="bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/30 border-0">{t('صعب التحقيق', 'At Risk')}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{language === 'ar' ? goal.descriptionAr : goal.descriptionEn}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold">{goal.targetAmount.toLocaleString()} <span className="text-xs font-normal">SAR</span></div>
                      <div className="text-xs text-muted-foreground">{t('بحلول', 'By')} {goal.targetYear}</div>
                    </div>
                  </div>
                ))}
                {data.goals.length === 0 && (
                  <div className="text-center p-6 text-muted-foreground">
                    {t('لا توجد أهداف مسجلة.', 'No goals recorded.')}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Risks */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-primary" />
                  {t('المخاطر المحتملة', 'Potential Risks')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.risks.map((risk, i) => (
                  <div key={i} className="space-y-3 p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{language === 'ar' ? risk.titleAr : risk.titleEn}</span>
                          <Badge variant="outline" className={cn("text-xs py-0", getSeverityColor(risk.severity))}>
                            {t(risk.severity === 'high' ? 'عالي' : risk.severity === 'medium' ? 'متوسط' : 'منخفض', risk.severity)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{language === 'ar' ? risk.descriptionAr : risk.descriptionEn}</p>
                      </div>
                      <div className="text-right shrink-0 bg-background px-2 py-1 rounded-md border">
                        <div className="text-xs text-muted-foreground">{t('احتمالية', 'Prob.')}</div>
                        <div className="font-mono font-bold text-sm">{Math.round(risk.probability * 100)}%</div>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full",
                          risk.severity === 'high' ? 'bg-red-500' : risk.severity === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                        )}
                        style={{ width: `${risk.probability * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                {data.risks.length === 0 && (
                  <div className="text-center p-6 text-muted-foreground">
                    {t('لا توجد مخاطر واضحة.', 'No clear risks identified.')}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>{t('التوقعات السنوية (السيناريو الأساسي)', 'Yearly Projections (Base Scenario)')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left rtl:text-right">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg rounded-bl-lg rtl:rounded-tr-lg rtl:rounded-tl-none rtl:rounded-br-none rtl:rounded-bl-none">{t('السنة', 'Year')}</th>
                      <th className="px-4 py-3">{t('الدخل', 'Income')}</th>
                      <th className="px-4 py-3">{t('المصروفات', 'Expenses')}</th>
                      <th className="px-4 py-3">{t('المدخرات', 'Savings')}</th>
                      <th className="px-4 py-3">{t('الثروة الصافية', 'Net Worth')}</th>
                      <th className="px-4 py-3 rounded-tr-lg rounded-br-lg rtl:rounded-tl-lg rtl:rounded-tr-none rtl:rounded-bl-none rtl:rounded-br-none">{t('أحداث', 'Milestones')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.projection.map((row, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-medium">{row.year}</td>
                        <td className="px-4 py-3 font-mono text-emerald-600 dark:text-emerald-400">+{row.income.toLocaleString()}</td>
                        <td className="px-4 py-3 font-mono text-rose-600 dark:text-rose-400">-{row.expenses.toLocaleString()}</td>
                        <td className="px-4 py-3 font-mono">{row.savings.toLocaleString()}</td>
                        <td className="px-4 py-3 font-mono font-bold text-primary">{row.netWorth.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          {row.milestoneAr || row.milestone ? (
                            <Badge variant="secondary" className="font-normal bg-primary/10 text-primary hover:bg-primary/20">
                              {language === 'ar' ? (row.milestoneAr || row.milestone) : (row.milestone || row.milestoneAr)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetPersonalityAnalysis,
  useGeneratePersonalityAnalysis,
  getGetPersonalityAnalysisQueryKey,
} from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { BrainCircuit, Activity, CheckCircle2, AlertTriangle, Star } from 'lucide-react';

export default function PersonalityAnalysis() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useGetPersonalityAnalysis();
  const generateAnalysis = useGeneratePersonalityAnalysis();

  const handleGenerate = () => {
    generateAnalysis.mutate(undefined, {
      onSuccess: (data) => {
        // Update the query cache immediately so the UI shows the new analysis
        // without waiting for a background refetch.
        queryClient.setQueryData(getGetPersonalityAnalysisQueryKey(), data);
        queryClient.invalidateQueries({ queryKey: getGetPersonalityAnalysisQueryKey() });
        toast({
          title: t('تم إنشاء التحليل بنجاح!', 'Analysis Generated!'),
          description: t('لقد قام الذكاء الاصطناعي بتحليل شخصيتك المالية.', 'AI has successfully analyzed your financial personality.'),
        });
      },
      onError: (err) => {
        toast({
          title: t('حدث خطأ', 'Error'),
          description: err instanceof Error ? err.message : t('لم نتمكن من توليد التحليل. حاول مرة أخرى.', 'Could not generate analysis. Try again.'),
          variant: 'destructive',
        });
      },
    });
  };

  if (isLoading && !isError) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 mb-8" />
        <Skeleton className="h-[250px] w-full rounded-xl" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-[300px] w-full rounded-xl" />
          <div className="space-y-6">
            <Skeleton className="h-[140px] w-full rounded-xl" />
            <Skeleton className="h-[140px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('شخصيتك المالية', 'Financial Personality')}</h1>
          <p className="text-muted-foreground mt-1 text-lg">
            {t('اكتشف نمطك المالي ونقاط قوتك لتحسين قراراتك.', 'Discover your financial pattern and strengths to improve decisions.')}
          </p>
        </div>
        <Button 
          onClick={handleGenerate} 
          disabled={generateAnalysis.isPending}
          className="bg-primary/90 hover:bg-primary gap-2 shadow-sm transition-all"
        >
          {generateAnalysis.isPending ? (
            <Activity className="w-5 h-5 animate-pulse" />
          ) : (
            <BrainCircuit className="w-5 h-5" />
          )}
          {t('تحديث التحليل', 'Generate Analysis')}
        </Button>
      </div>

      {!data ? (
        <Card className="border-dashed border-2 bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <BrainCircuit className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{t('اكتشف شخصيتك المالية', 'Discover Your Financial Personality')}</h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              {t('دع الذكاء الاصطناعي يحلل بياناتك وعاداتك لاكتشاف نمطك المالي الخاص.', 'Let AI analyze your data and habits to discover your unique financial pattern.')}
            </p>
            <Button onClick={handleGenerate} disabled={generateAnalysis.isPending} size="lg" className="gap-2">
              <Activity className="w-5 h-5" />
              {t('ابدأ التحليل الآن', 'Start Analysis Now')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Hero Card */}
          <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-background to-primary/5 shadow-md">
            <CardContent className="p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
              {/* Score Circle */}
              <div className="relative w-40 h-40 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
                  <circle 
                    cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" 
                    strokeDasharray={`${(data.overallScore / 100) * 282.74} 282.74`} 
                    className="text-primary transition-all duration-1000 ease-out" 
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-bold text-primary">{data.overallScore}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Score</span>
                </div>
              </div>

              <div className="flex-1 space-y-4 text-center md:text-start md:rtl:text-right">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <Badge variant="default" className="px-3 py-1 bg-primary/20 text-primary hover:bg-primary/30 border-none font-bold text-sm">
                    {language === 'ar' ? data.badgeAr : data.badgeEn}
                  </Badge>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    {t('آخر تحليل:', 'Last analyzed:')} {new Date(data.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                  {language === 'ar' ? data.personalityTypeAr : data.personalityTypeEn}
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {language === 'ar' ? data.descriptionAr : data.descriptionEn}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Traits */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  {t('سمات الشخصية', 'Personality Traits')}
                </CardTitle>
                <CardDescription>
                  {t('تحليل تفصيلي لسماتك المالية الأساسية.', 'Detailed analysis of your core financial traits.')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {data.traits.map((trait, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-end mb-1">
                      <div>
                        <span className="font-bold text-base block">{language === 'ar' ? trait.nameAr : trait.nameEn}</span>
                        {(trait.descriptionAr || trait.descriptionEn) && (
                          <span className="text-xs text-muted-foreground block mt-0.5">
                            {language === 'ar' ? trait.descriptionAr : trait.descriptionEn}
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-semibold text-sm">{trait.score}/100</span>
                    </div>
                    <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          trait.score >= 80 ? "bg-emerald-500" : trait.score >= 50 ? "bg-primary" : "bg-amber-500"
                        )} 
                        style={{ width: `${trait.score}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="space-y-6">
              {/* Strengths */}
              <Card className="shadow-sm border-emerald-500/20 bg-emerald-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-emerald-700 dark:text-emerald-400 flex items-center gap-2 text-xl">
                    <CheckCircle2 className="w-5 h-5" />
                    {t('نقاط القوة', 'Strengths')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {data.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-emerald-900 dark:text-emerald-200 leading-snug">
                          {language === 'ar' ? strength.ar : strength.en}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Improvements */}
              <Card className="shadow-sm border-amber-500/20 bg-amber-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-amber-700 dark:text-amber-400 flex items-center gap-2 text-xl">
                    <AlertTriangle className="w-5 h-5" />
                    {t('مجالات التحسين', 'Areas for Improvement')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {data.improvements.map((improvement, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span className="text-amber-900 dark:text-amber-200 leading-snug">
                          {language === 'ar' ? improvement.ar : improvement.en}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

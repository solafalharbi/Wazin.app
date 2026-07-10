import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetActiveScenarios,
  useGenerateScenario,
  useRespondToScenario,
  getGetActiveScenariosQueryKey,
} from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Sparkles, Shield, AlertTriangle, Zap, CheckCircle2, Lock, Bot, Activity } from 'lucide-react';

export default function Scenarios() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: scenarios, isLoading } = useGetActiveScenarios();
  const generateScenario = useGenerateScenario();
  const respondToScenario = useRespondToScenario();

  const [respondingId, setRespondingId] = useState<number | null>(null);

  const handleGenerate = () => {
    generateScenario.mutate(
      { data: {} },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetActiveScenariosQueryKey() });
          toast({
            title: t('تم إنشاء سيناريو جديد!', 'New Scenario Generated!'),
            description: t('لقد قام الذكاء الاصطناعي بتجهيز تحدي جديد لك.', 'AI has prepared a new challenge for you.'),
          });
        },
        onError: () => {
          toast({
            title: t('حدث خطأ', 'Error'),
            description: t('لم نتمكن من إنشاء السيناريو. حاول مرة أخرى.', 'Could not generate scenario. Try again.'),
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleRespond = (scenarioId: number, optionId: string) => {
    setRespondingId(scenarioId);
    respondToScenario.mutate(
      { scenarioId, data: { optionId } },
      {
        onSuccess: (result) => {
          queryClient.invalidateQueries({ queryKey: getGetActiveScenariosQueryKey() });
          toast({
            title: t('تم تسجيل قرارك!', 'Decision Recorded!'),
            description: language === 'ar' ? result.feedbackAr : result.feedbackEn,
          });
          setRespondingId(null);
        },
        onError: () => {
          toast({
            title: t('حدث خطأ', 'Error'),
            description: t('لم نتمكن من حفظ قرارك.', 'Could not save your decision.'),
            variant: 'destructive',
          });
          setRespondingId(null);
        },
      }
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'medium': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
      case 'critical': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'safe': return <Shield className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" />;
      case 'moderate': return <Activity className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" />;
      case 'risky': return <Zap className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" />;
      default: return null;
    }
  };

  const getRiskStyle = (level: string) => {
    switch (level) {
      case 'safe': return 'hover:bg-emerald-500 hover:text-white border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400';
      case 'moderate': return 'hover:bg-amber-500 hover:text-white border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400';
      case 'risky': return 'hover:bg-rose-500 hover:text-white border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400';
      default: return '';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('سيناريوهات الذكاء الاصطناعي', 'AI Scenarios')}</h1>
          <p className="text-muted-foreground mt-1 text-lg">
            {t('تحديات مالية يومية مخصصة لتحسين وعيك المالي.', 'Daily financial challenges tailored to improve your financial awareness.')}
          </p>
        </div>
        <Button 
          onClick={handleGenerate} 
          disabled={generateScenario.isPending}
          className="bg-primary/90 hover:bg-primary gap-2 shadow-lg hover:shadow-xl transition-all"
        >
          {generateScenario.isPending ? (
            <Activity className="w-5 h-5 animate-pulse" />
          ) : (
            <Sparkles className="w-5 h-5 text-yellow-300" />
          )}
          {t('توليد سيناريو جديد', 'Generate New Scenario')}
        </Button>
      </div>

      {!scenarios || scenarios.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Bot className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{t('الذكاء الاصطناعي مستعد', 'AI is Ready')}</h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              {t('لا توجد سيناريوهات نشطة حالياً. قم بتوليد سيناريو جديد لاختبار قراراتك المالية.', 'There are no active scenarios right now. Generate a new one to test your financial decision-making.')}
            </p>
            <Button onClick={handleGenerate} disabled={generateScenario.isPending} size="lg" className="gap-2">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              {t('توليد سيناريو الآن', 'Generate Scenario Now')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {scenarios.map((scenario) => (
            <Card key={scenario.id} className={cn("overflow-hidden transition-all duration-300", scenario.responded ? "border-primary/20 bg-primary/5" : "hover:border-primary/50 shadow-sm hover:shadow-md")}>
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={cn("uppercase text-xs font-bold px-2.5 py-0.5 border", getSeverityColor(scenario.severity))}>
                        {scenario.severity}
                      </Badge>
                      <Badge variant="secondary" className="capitalize">
                        {scenario.type}
                      </Badge>
                      {scenario.responded && (
                        <Badge variant="default" className="bg-primary/20 text-primary hover:bg-primary/30 gap-1 border-0">
                          <CheckCircle2 className="w-3 h-3" />
                          {t('مكتمل', 'Completed')}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl md:text-2xl">
                      {language === 'ar' ? scenario.titleAr : scenario.titleEn}
                    </CardTitle>
                    <CardDescription className="text-base text-foreground/80 mt-2 max-w-3xl leading-relaxed">
                      {language === 'ar' ? scenario.descriptionAr : scenario.descriptionEn}
                    </CardDescription>
                  </div>
                  <div className="text-right shrink-0 bg-muted/50 p-3 rounded-xl">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-semibold">{t('التأثير المحتمل', 'Potential Impact')}</div>
                    <div className="text-xl font-bold font-mono">
                      {scenario.impactAmount.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">{t('ر.س', 'SAR')}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {scenario.responded ? (
                  <div className="bg-background rounded-xl p-6 border shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 p-3 rounded-full shrink-0">
                        <Lock className="w-6 h-6 text-primary" />
                      </div>
                      <div className="space-y-3 flex-1">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold text-lg">{t('نتيجة قرارك', 'Decision Result')}</h4>
                          {scenario.xpEarned && (
                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20 gap-1 px-3 py-1 font-bold">
                              <Sparkles className="w-4 h-4" />
                              +{scenario.xpEarned} XP
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                          {language === 'ar' ? scenario.feedbackAr : scenario.feedbackEn}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    {scenario.options.map((option) => (
                      <Button
                        key={option.id}
                        variant="outline"
                        className={cn("h-auto p-4 flex flex-col items-start text-start justify-between transition-all group whitespace-normal border-2", getRiskStyle(option.riskLevel))}
                        onClick={() => handleRespond(scenario.id, option.id)}
                        disabled={respondingId === scenario.id}
                      >
                        <div className="w-full space-y-3">
                          <div className="flex justify-between items-center w-full">
                            <Badge variant="outline" className={cn("uppercase text-xs tracking-wider font-bold shadow-sm bg-background", 
                              option.riskLevel === 'safe' ? 'text-emerald-600 border-emerald-200' : 
                              option.riskLevel === 'moderate' ? 'text-amber-600 border-amber-200' : 
                              'text-rose-600 border-rose-200'
                            )}>
                              <div className="flex items-center">
                                {getRiskIcon(option.riskLevel)}
                                {option.riskLevel}
                              </div>
                            </Badge>
                            <span className="text-xs font-bold opacity-70 group-hover:opacity-100 flex items-center gap-1">
                              +{option.xpReward} XP
                            </span>
                          </div>
                          <span className="font-semibold text-base leading-snug">
                            {language === 'ar' ? option.labelAr : option.labelEn}
                          </span>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

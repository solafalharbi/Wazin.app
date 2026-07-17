import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGetEconomicEvents, useMakeDecision } from '@workspace/api-client-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingDown, Gift, Stethoscope, Briefcase, Zap, Clock, ShieldCheck, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function Events() {
  const { t, language } = useLanguage();
  const { data: events, isLoading, refetch } = useGetEconomicEvents();
  const decideMutation = useMakeDecision();

  if (isLoading) {
    return <PageLoader />;
  }

  const handleDecision = (eventId: number, optionId: string) => {
    decideMutation.mutate({
      eventId,
      data: { optionId }
    }, {
      onSuccess: (result) => {
        toast.success(t('تم اتخاذ القرار!', 'Decision made!'), {
          description: language === 'ar' ? result.feedbackAr : result.feedbackEn,
        });
        refetch();
      }
    });
  };

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground hover:bg-destructive/90';
      case 'high': return 'bg-orange-500 text-white hover:bg-orange-600';
      case 'medium': return 'bg-yellow-500 text-white hover:bg-yellow-600';
      case 'low': return 'bg-emerald-500 text-white hover:bg-emerald-600';
      default: return 'bg-primary text-primary-foreground';
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'market_crash': return <TrendingDown size={24} className="text-destructive" />;
      case 'bonus': return <Gift size={24} className="text-emerald-500" />;
      case 'emergency': return <Stethoscope size={24} className="text-orange-500" />;
      case 'investment': return <Briefcase size={24} className="text-primary" />;
      default: return <Zap size={24} className="text-yellow-500" />;
    }
  };

  const evs = events || [];

  if (evs.length === 0) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('الأحداث الاقتصادية', 'Economic Events')}</h1>
          <p className="text-muted-foreground">{t('قرارات تشكل مستقبلك المالي.', 'Decisions that shape your financial future.')}</p>
        </div>
        <Card className="border-dashed bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center h-64 text-center">
            <ShieldCheck size={48} className="text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t('لا توجد أحداث نشطة حالياً', 'No active events currently')}</h3>
            <p className="text-muted-foreground">{t('عد لاحقاً أو استمر في المحاكاة لتوليد أحداث جديدة.', 'Check back later or continue the simulation to generate new events.')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('الأحداث الاقتصادية', 'Economic Events')}</h1>
        <p className="text-muted-foreground">{t('قرارات تشكل مستقبلك المالي.', 'Decisions that shape your financial future.')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {evs.map((event) => (
          <Card key={event.id} className="relative overflow-hidden group border-primary/20 shadow-md hover:shadow-lg transition-shadow">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-full -z-10" />
            
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-background rounded-lg shadow-sm">
                  {getTypeIcon(event.type)}
                </div>
                <Badge className={getSeverityColor(event.severity)}>
                  {t(event.severity.toUpperCase(), event.severity.toUpperCase())}
                </Badge>
              </div>
              <CardTitle className="text-xl">{language === 'ar' ? event.titleAr : event.titleEn}</CardTitle>
              <CardDescription className="text-foreground/80 font-medium">
                {language === 'ar' ? event.descriptionAr : event.descriptionEn}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {event.impact && (
                <div className="flex items-center gap-2 text-sm font-semibold text-destructive bg-destructive/10 w-fit px-3 py-1 rounded-md mb-4">
                  <AlertTriangle size={14} />
                  <span>{t('تأثير مالي محتمل:', 'Potential Impact:')} {event.impact} SR</span>
                </div>
              )}
              {event.expiresAt && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                  <Clock size={14} />
                  <span>{t('ينتهي في:', 'Expires at:')} {new Date(event.expiresAt).toLocaleDateString()}</span>
                </div>
              )}
              
              <div className="space-y-3 mt-6">
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">{t('الخيارات المتاحة:', 'Available Options:')}</h4>
                {event.options.map((opt) => (
                  <Button 
                    key={opt.id} 
                    variant="outline" 
                    className="w-full justify-start h-auto p-4 flex flex-col items-start gap-2 hover:bg-primary/5 hover:border-primary/50 text-left whitespace-normal"
                    onClick={() => handleDecision(event.id, opt.id)}
                    disabled={decideMutation.isPending}
                  >
                    <div className="flex justify-between items-start w-full">
                      <span className="font-semibold text-base">{language === 'ar' ? opt.labelAr : opt.labelEn}</span>
                      <Badge variant="secondary" className="shrink-0 ml-2">
                        {opt.riskLevel === 'safe' ? t('آمن', 'Safe') : opt.riskLevel === 'risky' ? t('عالي المخاطر', 'Risky') : t('متوسط المخاطر', 'Moderate')}
                      </Badge>
                    </div>
                    {(opt.expectedOutcomeAr || opt.expectedOutcomeEn) && (
                      <span className="text-sm text-muted-foreground">
                        {language === 'ar' ? opt.expectedOutcomeAr : opt.expectedOutcomeEn}
                      </span>
                    )}
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">+{opt.xpReward} XP</span>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

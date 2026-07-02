import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGetSimulationState, useStartSimulation, useAllocateBudget } from '@workspace/api-client-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Activity, Wallet, TrendingDown, Target, Coins, ShieldAlert, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'wouter';

export default function Simulation() {
  const { t, language } = useLanguage();
  const { data: state, isLoading, refetch } = useGetSimulationState();
  const startSim = useStartSimulation();
  const allocateBtn = useAllocateBudget();

  const [isStartOpen, setIsStartOpen] = useState(false);
  const [income, setIncome] = useState("5000");
  const [difficulty, setDifficulty] = useState("medium");

  const [allocations, setAllocations] = useState<Record<string, number>>({});

  // Initialize sliders when state loads
  React.useEffect(() => {
    if (state && state.allocations && Object.keys(allocations).length === 0) {
      const initial: Record<string, number> = {};
      state.allocations.forEach(a => {
        initial[a.category] = a.allocated;
      });
      setAllocations(initial);
    }
  }, [state]);

  const handleStart = () => {
    startSim.mutate({
      data: {
        monthlyIncome: Number(income),
        difficulty: difficulty as any
      }
    }, {
      onSuccess: () => {
        setIsStartOpen(false);
        refetch();
        toast.success(t('تم بدء محاكاة جديدة!', 'New simulation started!'));
        setAllocations({}); // reset to trigger re-init
      }
    });
  };

  const handleSaveAllocations = () => {
    const data = Object.keys(allocations).map(key => ({
      category: key,
      amount: allocations[key]
    }));

    allocateBtn.mutate({
      data: { allocations: data }
    }, {
      onSuccess: () => {
        toast.success(t('تم تحديث الميزانية بنجاح', 'Budget updated successfully'));
        refetch();
      }
    });
  };

  const handleSliderChange = (category: string, value: number) => {
    setAllocations(prev => ({ ...prev, [category]: value }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  const s = state || {
    status: 'active',
    month: 3,
    year: 2024,
    totalBudget: 5000,
    healthScore: 78,
    pendingEvents: 1,
    allocations: [
      { category: 'Necessities', categoryAr: 'أساسيات', allocated: 2500, spent: 2100, limit: 3000 },
      { category: 'Wants', categoryAr: 'رغبات', allocated: 1500, spent: 1600, limit: 1500 },
      { category: 'Savings', categoryAr: 'مدخرات', allocated: 1000, spent: 1000, limit: 5000 },
    ]
  };

  const totalAllocated = Object.values(allocations).reduce((sum, val) => sum + val, 0);
  const remaining = s.totalBudget - totalAllocated;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('المحاكاة المالية', 'Financial Simulation')}</h1>
          <p className="text-muted-foreground">
            {t('الشهر', 'Month')} {s.month} / {s.year}
          </p>
        </div>
        
        <Dialog open={isStartOpen} onOpenChange={setIsStartOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Zap size={16} />
              {t('إعادة تعيين المحاكاة', 'Reset Simulation')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('بدء محاكاة جديدة', 'Start New Simulation')}</DialogTitle>
              <DialogDescription>
                {t('حدد الدخل الشهري ومستوى الصعوبة للبدء من جديد.', 'Set your monthly income and difficulty to start fresh.')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t('الدخل الشهري (ريال)', 'Monthly Income (SAR)')}</Label>
                <Input type="number" value={income} onChange={e => setIncome(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t('مستوى الصعوبة', 'Difficulty')}</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">{t('سهل - دخل ثابت، أحداث قليلة', 'Easy - Stable income, few events')}</SelectItem>
                    <SelectItem value="medium">{t('متوسط - واقعي', 'Medium - Realistic')}</SelectItem>
                    <SelectItem value="hard">{t('صعب - تقلبات اقتصادية', 'Hard - Economic volatility')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleStart} disabled={startSim.isPending}>
                {startSim.isPending ? t('جاري البدء...', 'Starting...') : t('ابدأ المحاكاة', 'Start Simulation')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col - Overview */}
        <div className="col-span-1 space-y-6">
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg border-none">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Wallet size={20} />
                {t('الميزانية الكلية', 'Total Budget')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-4">{s.totalBudget} <span className="text-xl font-normal opacity-80">SR</span></div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm opacity-90">
                  <span>{t('المتبقي للتخصيص', 'Left to allocate')}</span>
                  <span className={cn("font-bold", remaining < 0 ? "text-red-300" : "text-emerald-300")}>
                    {remaining} SR
                  </span>
                </div>
                <Progress value={Math.min(100, (totalAllocated / s.totalBudget) * 100)} className="h-2 bg-primary-foreground/20 [&>div]:bg-white" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity size={18} className="text-primary" />
                {t('صحة الميزانية', 'Budget Health')}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-muted/30" />
                  <circle 
                    cx="80" cy="80" r="70" 
                    stroke="currentColor" 
                    strokeWidth="12" 
                    fill="transparent" 
                    strokeDasharray="439.8" 
                    strokeDashoffset={439.8 - (439.8 * s.healthScore) / 100}
                    className={cn(
                      "transition-all duration-1000 ease-out",
                      s.healthScore > 75 ? "text-emerald-500" : s.healthScore > 50 ? "text-yellow-500" : "text-destructive"
                    )}
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold">{s.healthScore}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-widest">{t('درجة', 'Score')}</span>
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground mt-4 px-4">
                {t('حافظ على ميزانية صحية لتجاوز الأحداث المفاجئة بنجاح.', 'Maintain a healthy budget to survive unexpected events.')}
              </p>
            </CardContent>
          </Card>

          {s.pendingEvents ? (
            <Card className="border-amber-500/50 bg-amber-500/5 shadow-inner">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-amber-600 dark:text-amber-500">
                  <ShieldAlert size={18} />
                  {t('أحداث تتطلب قرارك', 'Pending Events')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">
                  {t('هناك حدث اقتصادي يتطلب اتخاذ قرار مالي مهم.', 'There is an economic event requiring a crucial financial decision.')}
                </p>
                <Link href="/events">
                  <Button variant="outline" className="w-full border-amber-500/50 text-amber-600 hover:bg-amber-500/10">
                    {t('الذهاب للأحداث', 'Go to Events')}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Right Col - Allocation */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>{t('توزيع الميزانية', 'Budget Allocation')}</CardTitle>
              <CardDescription>
                {t('قم بتوزيع دخلك على الفئات المختلفة. انتبه للحد الأقصى لكل فئة.', 'Allocate your income across categories. Pay attention to limits.')}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-8">
              {s.allocations.map((alloc) => {
                const currentVal = allocations[alloc.category] ?? alloc.allocated;
                const percent = (currentVal / s.totalBudget) * 100;
                const isOverBudget = alloc.spent > currentVal;

                return (
                  <div key={alloc.category} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          alloc.category === 'Necessities' ? "bg-blue-500" :
                          alloc.category === 'Wants' ? "bg-purple-500" : "bg-emerald-500"
                        )} />
                        <span className="font-semibold text-lg">{language === 'ar' ? alloc.categoryAr : alloc.category}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-lg">{currentVal} SR</span>
                        <span className="text-xs text-muted-foreground block">{percent.toFixed(0)}% {t('من الإجمالي', 'of total')}</span>
                      </div>
                    </div>
                    
                    <div className="relative pt-2">
                      <Slider 
                        value={[currentVal]} 
                        min={0} 
                        max={s.totalBudget} 
                        step={50}
                        onValueChange={([val]) => handleSliderChange(alloc.category, val)}
                        className={cn(
                          "[&_[role=slider]]:h-5 [&_[role=slider]]:w-5",
                          alloc.category === 'Necessities' ? "[&_[role=slider]]:border-blue-500 [&>span:first-child]:bg-blue-500/20 [&_[data-orientation]]:bg-blue-500" :
                          alloc.category === 'Wants' ? "[&_[role=slider]]:border-purple-500 [&>span:first-child]:bg-purple-500/20 [&_[data-orientation]]:bg-purple-500" : 
                          "[&_[role=slider]]:border-emerald-500 [&>span:first-child]:bg-emerald-500/20 [&_[data-orientation]]:bg-emerald-500"
                        )}
                      />
                      
                      {/* Spent marker indicator */}
                      <div 
                        className={cn(
                          "absolute top-0 w-1 h-3 rounded-full transform -translate-x-1/2 bg-destructive",
                          isOverBudget ? "animate-pulse" : "bg-foreground/30"
                        )}
                        style={{ left: `${language === 'ar' ? 100 - (alloc.spent / s.totalBudget)*100 : (alloc.spent / s.totalBudget)*100}%` }}
                        title={`${t('المصروف:', 'Spent:')} ${alloc.spent}`}
                      />
                    </div>
                    
                    <div className="flex justify-between text-xs mt-1">
                      <span className={cn(isOverBudget ? "text-destructive font-semibold" : "text-muted-foreground")}>
                        {t('تم إنفاق', 'Spent')}: {alloc.spent} SR
                      </span>
                      <span className="text-muted-foreground">
                        {t('الحد الأقصى المنطقي', 'Recommended limit')}: {alloc.limit} SR
                      </span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
            <CardFooter className="pt-6 border-t mt-auto bg-muted/20">
              <div className="w-full flex items-center justify-between">
                <div className={cn(
                  "text-sm font-medium px-3 py-1.5 rounded-md",
                  remaining === 0 ? "bg-emerald-500/10 text-emerald-600" :
                  remaining < 0 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                )}>
                  {remaining === 0 
                    ? t('ميزانية متوازنة 100%', 'Perfectly balanced budget') 
                    : remaining > 0 
                      ? `${t('متبقي', 'Remaining')} ${remaining} SR` 
                      : `${t('عجز', 'Deficit')} ${Math.abs(remaining)} SR`}
                </div>
                <Button 
                  onClick={handleSaveAllocations} 
                  disabled={allocateBtn.isPending || remaining < 0}
                  className="gap-2"
                >
                  <Target size={16} />
                  {t('تأكيد التوزيع', 'Confirm Allocation')}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

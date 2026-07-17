import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGetRewards, useGetUserRewards, useRedeemReward, useGetUserProfile } from '@workspace/api-client-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Gift, Coins, CheckCircle2, Ticket, Coffee, GraduationCap, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Rewards() {
  const { t, language } = useLanguage();
  const { data: rewards, isLoading: isLoadingRewards } = useGetRewards();
  const { data: userRewards, isLoading: isLoadingUserRewards, refetch: refetchUserRewards } = useGetUserRewards();
  const { data: profile, refetch: refetchProfile } = useGetUserProfile();
  const redeemMut = useRedeemReward();

  const [selectedReward, setSelectedReward] = React.useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  if (isLoadingRewards || isLoadingUserRewards) {
    return <PageLoader />;
  }

  const handleRedeem = () => {
    if (!selectedReward) return;
    
    redeemMut.mutate({
      rewardId: selectedReward.id
    }, {
      onSuccess: (result) => {
        setIsDialogOpen(false);
        toast.success(t('تم الاستبدال بنجاح!', 'Redeemed successfully!'), {
          description: result.redemptionCode ? `${t('الكود:', 'Code:')} ${result.redemptionCode}` : '',
        });
        refetchUserRewards();
        refetchProfile();
      },
      onError: () => {
        toast.error(t('فشل الاستبدال. تأكد من وجود رصيد كافٍ.', 'Redemption failed. Check your balance.'));
      }
    });
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'cashback': return <Coins className="text-amber-500" />;
      case 'discount': return <Ticket className="text-blue-500" />;
      case 'voucher': return <Coffee className="text-orange-500" />;
      case 'free_service': return <GraduationCap className="text-purple-500" />;
      case 'investment': return <Building2 className="text-emerald-500" />;
      default: return <Gift className="text-primary" />;
    }
  };

  const availableRewards = rewards || [
    { id: 1, titleAr: 'قسيمة قهوة', titleEn: 'Coffee Voucher', descriptionAr: 'قسيمة بقيمة 50 ريال', descriptionEn: '50 SR Voucher', coinsRequired: 500, type: 'voucher', partnerName: 'Alinma Bank', isAvailable: true },
    { id: 2, titleAr: 'كاش باك 5%', titleEn: '5% Cashback', descriptionAr: 'على مشترياتك القادمة', descriptionEn: 'On your next purchase', coinsRequired: 1200, type: 'cashback', partnerName: 'Alinma Bank', isAvailable: true },
    { id: 3, titleAr: 'دورة استثمار', titleEn: 'Investment Course', descriptionAr: 'دخول مجاني لدورة متقدمة', descriptionEn: 'Free access to advanced course', coinsRequired: 2500, type: 'free_service', partnerName: 'Alinma Bank', isAvailable: true },
  ];

  const myRewards = userRewards || [];
  const coinsBalance = profile?.coins || 1200;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header & Balance */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            {t('المكافآت', 'Rewards Hub')}
            <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20 px-3 py-1 text-sm font-bold">
              {t('حصرياً من مصرف الإنماء', 'Exclusive by Alinma Bank')}
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('استبدل عملاتك بمكافآت حقيقية وخصومات حصرية.', 'Redeem your coins for real rewards and exclusive discounts.')}
          </p>
        </div>

        <Card className="bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg border-none w-full md:w-auto">
          <CardContent className="p-6 flex items-center gap-6">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Coins size={32} className="text-white" />
            </div>
            <div>
              <p className="text-white/80 font-medium">{t('رصيد العملات', 'Coins Balance')}</p>
              <h2 className="text-4xl font-bold">{coinsBalance}</h2>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="available" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8 bg-muted/50 p-1">
          <TabsTrigger value="available" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
            {t('متاح للاستبدال', 'Available to Redeem')}
          </TabsTrigger>
          <TabsTrigger value="my-rewards" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
            {t('مكافآتي', 'My Rewards')}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="available" className="focus-visible:outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableRewards.map((reward) => (
              <Card key={reward.id} className="flex flex-col overflow-hidden hover:shadow-xl transition-all duration-300 border-primary/10 group">
                <div className="h-32 bg-gradient-to-br from-primary/5 to-primary/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-primary transform -rotate-6 group-hover:rotate-0 transition-transform">
                    {getTypeIcon(reward.type)}
                  </div>
                </div>
                <CardHeader className="pt-4 pb-2 text-center">
                  <Badge variant="outline" className="w-fit mx-auto mb-2 text-[10px] uppercase tracking-wider">{reward.partnerName}</Badge>
                  <CardTitle className="text-xl">{language === 'ar' ? reward.titleAr : reward.titleEn}</CardTitle>
                  <CardDescription className="text-sm font-medium h-10">
                    {language === 'ar' ? reward.descriptionAr : reward.descriptionEn}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="mt-auto pt-4 flex flex-col gap-3">
                  <div className="flex items-center gap-1.5 text-amber-500 font-bold bg-amber-500/10 px-4 py-1.5 rounded-full w-full justify-center">
                    <Coins size={16} />
                    <span>{reward.coinsRequired}</span>
                  </div>
                  <Button 
                    className="w-full font-bold shadow-md hover-elevate" 
                    variant={coinsBalance >= reward.coinsRequired ? "default" : "secondary"}
                    disabled={coinsBalance < reward.coinsRequired}
                    onClick={() => {
                      setSelectedReward(reward);
                      setIsDialogOpen(true);
                    }}
                  >
                    {coinsBalance >= reward.coinsRequired 
                      ? t('استبدال الآن', 'Redeem Now') 
                      : t('رصيد غير كافٍ', 'Not enough coins')}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="my-rewards" className="focus-visible:outline-none">
          {myRewards.length === 0 ? (
            <Card className="border-dashed bg-muted/30">
              <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                <Gift size={48} className="text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{t('لا توجد مكافآت بعد', 'No rewards yet')}</h3>
                <p className="text-muted-foreground">{t('استبدل عملاتك بمكافآت وستظهر هنا.', 'Redeem your coins for rewards and they will appear here.')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myRewards.map((userReward) => (
                <Card key={userReward.id} className="flex flex-row overflow-hidden border-l-4 border-l-emerald-500">
                  <div className="w-24 bg-emerald-50 flex items-center justify-center text-emerald-500 border-r border-border shrink-0">
                    {getTypeIcon(userReward.reward.type)}
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-lg">{language === 'ar' ? userReward.reward.titleAr : userReward.reward.titleEn}</h4>
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                          <CheckCircle2 size={12} className="mr-1 inline" /> {t('متاح', 'Available')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {language === 'ar' ? userReward.reward.descriptionAr : userReward.reward.descriptionEn}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                      {t('تم الاستبدال في:', 'Redeemed on:')} {new Date(userReward.earnedAt).toLocaleDateString()}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">{t('تأكيد الاستبدال', 'Confirm Redemption')}</DialogTitle>
          </DialogHeader>
          {selectedReward && (
            <div className="flex flex-col items-center py-6 text-center space-y-4">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2">
                {getTypeIcon(selectedReward.type)}
              </div>
              <h3 className="font-bold text-xl">{language === 'ar' ? selectedReward.titleAr : selectedReward.titleEn}</h3>
              <p className="text-muted-foreground">{language === 'ar' ? selectedReward.descriptionAr : selectedReward.descriptionEn}</p>
              
              <div className="bg-muted p-4 rounded-xl w-full flex justify-between items-center mt-4">
                <span className="text-sm font-medium text-muted-foreground">{t('التكلفة:', 'Cost:')}</span>
                <span className="text-xl font-bold text-amber-500 flex items-center gap-1">
                  {selectedReward.coinsRequired} <Coins size={20} />
                </span>
              </div>
            </div>
          )}
          <DialogFooter className="flex-row justify-between sm:justify-between w-full">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
              {t('إلغاء', 'Cancel')}
            </Button>
            <Button onClick={handleRedeem} disabled={redeemMut.isPending} className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white">
              {redeemMut.isPending ? t('جاري الاستبدال...', 'Redeeming...') : t('تأكيد الاستبدال', 'Confirm Redeem')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

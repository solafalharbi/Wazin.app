import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGetLeaderboard } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Star, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Leaderboard() {
  const { t, language } = useLanguage();
  const { data: leaderboard, isLoading } = useGetLeaderboard();

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="space-y-3 mt-8">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // Use provided hardcoded specific users if API doesn't return them exactly as requested,
  // but map over API data if it exists.
  const entries = leaderboard?.entries || [
    { rank: 1, userId: 101, username: 'juju (جوجو)', xp: 4500, level: 12, isCurrentUser: false, weeklyXpGain: 850, badge: 'Pioneer', avatarUrl: null },
    { rank: 2, userId: 102, username: 'Nama (نمى)', xp: 4100, level: 11, isCurrentUser: false, weeklyXpGain: 720, badge: 'Investor', avatarUrl: null },
    { rank: 3, userId: 103, username: 'Leen (لين)', xp: 3800, level: 10, isCurrentUser: false, weeklyXpGain: 650, badge: 'Saver', avatarUrl: null },
    { rank: 4, userId: 1, username: 'Solaf', xp: 3200, level: 8, isCurrentUser: false, weeklyXpGain: 550, badge: 'Rising Star', avatarUrl: null },
    { rank: 5, userId: 104, username: 'Ahmed (أحمد)', xp: 2900, level: 7, isCurrentUser: false, weeklyXpGain: 400, badge: null, avatarUrl: null },
  ];

  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]'; // Gold
      case 2: return 'text-slate-400 drop-shadow-[0_0_8px_rgba(148,163,184,0.5)]'; // Silver
      case 3: return 'text-amber-700 drop-shadow-[0_0_8px_rgba(180,83,9,0.5)]'; // Bronze
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto pb-20">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 text-primary mb-4 shadow-inner">
          <Trophy size={40} />
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">{t('لوحة الصدارة', 'Leaderboard')}</h1>
        <p className="text-lg text-muted-foreground">
          {t('تنافس مع أصدقائك وكن الأفضل في إدارة أموالك.', 'Compete with friends and be the best at managing your money.')}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {entries.map((entry) => {
          const isTop3 = entry.rank <= 3;
          
          return (
            <div 
              key={entry.userId}
              className={cn(
                "relative flex items-center p-4 md:p-6 rounded-2xl transition-all duration-300",
                entry.isCurrentUser 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02] z-10 border-none" 
                  : "bg-card border hover:border-primary/50 hover:shadow-md",
                isTop3 && !entry.isCurrentUser ? "border-l-4" : "",
                entry.rank === 1 && !entry.isCurrentUser ? "border-l-yellow-500" :
                entry.rank === 2 && !entry.isCurrentUser ? "border-l-slate-400" :
                entry.rank === 3 && !entry.isCurrentUser ? "border-l-amber-700" : ""
              )}
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-12 md:w-16 flex justify-center items-center font-bold text-2xl">
                {isTop3 ? (
                  <Medal size={32} className={getMedalColor(entry.rank)} />
                ) : (
                  <span className={entry.isCurrentUser ? "text-primary-foreground/80" : "text-muted-foreground"}>
                    #{entry.rank}
                  </span>
                )}
              </div>

              {/* Avatar & Info */}
              <div className="flex flex-1 items-center gap-4 ml-2">
                <Avatar className={cn(
                  "w-12 h-12 md:w-16 md:h-16 border-2 shadow-sm",
                  entry.isCurrentUser ? "border-primary-foreground" : "border-background"
                )}>
                  <AvatarImage src={entry.avatarUrl || undefined} />
                  <AvatarFallback className={cn(
                    "font-bold text-lg",
                    entry.isCurrentUser ? "bg-primary-foreground text-primary" : "bg-primary/10 text-primary"
                  )}>
                    {entry.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg md:text-xl">
                      {entry.username}
                    </span>
                    {entry.isCurrentUser && (
                      <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30 border-none px-2 py-0 h-5 text-[10px]">
                        {t('أنت', 'You')}
                      </Badge>
                    )}
                  </div>
                  <div className={cn(
                    "flex items-center gap-3 text-sm font-medium mt-1",
                    entry.isCurrentUser ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}>
                    <span className="flex items-center gap-1">
                      <Star size={14} className={entry.isCurrentUser ? "text-yellow-300" : "text-yellow-500"} />
                      Lvl {entry.level}
                    </span>
                    {entry.badge && (
                      <span className="px-2 py-0.5 rounded-full bg-background/10 border border-current/10 text-xs">
                        {entry.badge}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex flex-col items-end text-right ml-4">
                <div className="text-xl md:text-2xl font-black tracking-tight flex items-baseline gap-1">
                  {entry.xp.toLocaleString()}
                  <span className={cn(
                    "text-xs font-normal",
                    entry.isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}>XP</span>
                </div>
                {entry.weeklyXpGain && (
                  <div className={cn(
                    "flex items-center gap-1 text-xs font-medium mt-1",
                    entry.isCurrentUser ? "text-emerald-300" : "text-emerald-500"
                  )}>
                    <TrendingUp size={12} />
                    <span>+{entry.weeklyXpGain} {t('هذا الأسبوع', 'this week')}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

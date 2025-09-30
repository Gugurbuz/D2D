import { useMemo } from 'react';
import type { Customer } from '../../../types';

export function useDashboardData(customers: Customer[]) {
  return useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Today's visits
    const todaysVisits = customers.filter(c => c.visitDate === today);
    const completedVisits = todaysVisits.filter(c => c.status === 'Tamamlandı');
    const pendingVisits = todaysVisits.filter(c => c.status === 'Bekliyor');
    
    // Weekly stats
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weeklyVisits = customers.filter(c => {
      const visitDate = new Date(c.visitDate);
      return visitDate >= weekStart;
    });
    
    const completedThisWeek = weeklyVisits.filter(c => c.status === 'Tamamlandı').length;
    const targetThisWeek = 140; // 7 days * 20 target per day
    
    // Time-based messages
    const hour = now.getHours();
    let headerMessage = 'Günaydın! Bugünkü ziyaretlerinize başlayabilirsiniz.';
    let programTitle = 'Bugünkü Ziyaret Programı';
    
    if (hour >= 12 && hour < 18) {
      headerMessage = 'İyi öğleden sonralar! Ziyaretlerinize devam edebilirsiniz.';
    } else if (hour >= 18) {
      headerMessage = 'İyi akşamlar! Bugünün ziyaretlerini tamamlayabilirsiniz.';
      programTitle = 'Kalan Ziyaretler';
    }
    
    const currentTime = now.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const noVisitMessage = completedVisits.length > 0 
      ? 'Bugünkü tüm ziyaretlerinizi tamamladınız! 🎉'
      : 'Bugün için planlanmış ziyaret bulunmuyor.';
    
    const visitsToShow = pendingVisits.length > 0 ? pendingVisits : completedVisits;
    const dailyTarget = 20;
    
    return {
      headerMessage,
      currentTime,
      programTitle,
      completedVisits,
      pendingVisits,
      dailyTarget,
      weeklyStats: {
        completedThisWeek,
        targetThisWeek
      },
      noVisitMessage,
      visitsToShow
    };
  }, [customers]);
}
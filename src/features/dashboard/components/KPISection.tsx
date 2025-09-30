import React from 'react';
import { Target, CircleCheck as CheckCircle, Clock, TrendingUp } from 'lucide-react';
import KPICard from '../../../components/KPICard';

type Props = {
  completedVisits: number;
  pendingVisits: number;
  dailyTarget: number;
  weeklyStats: {
    completedThisWeek: number;
    targetThisWeek: number;
  };
};

const KPISection: React.FC<Props> = ({
  completedVisits,
  pendingVisits,
  dailyTarget,
  weeklyStats,
}) => {
  const completionRate = dailyTarget > 0 ? Math.round((completedVisits / dailyTarget) * 100) : 0;
  const weeklyCompletionRate = weeklyStats.targetThisWeek > 0 
    ? Math.round((weeklyStats.completedThisWeek / weeklyStats.targetThisWeek) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <KPICard
        title="Günlük Hedef"
        value={`${completedVisits}/${dailyTarget}`}
        icon={<Target />}
        type="target"
        progress={completionRate}
      />
      
      <KPICard
        title="Tamamlanan"
        value={completedVisits.toString()}
        icon={<CheckCircle />}
        type="completed"
        subtitle="Bu gün"
      />
      
      <KPICard
        title="Bekliyor"
        value={pendingVisits.toString()}
        icon={<Clock />}
        type="pending"
        subtitle="Ziyaret sayısı"
      />
      
      <KPICard
        title="Haftalık"
        value={`${weeklyStats.completedThisWeek}/${weeklyStats.targetThisWeek}`}
        icon={<TrendingUp />}
        type="performance"
        progress={weeklyCompletionRate}
      />
    </div>
  );
};

export default KPISection;
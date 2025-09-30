import React from 'react';
import { Target, CircleCheck as CheckCircle, Clock, TrendingUp } from 'lucide-react';
import KPICard from '../../../components/KPICard';

interface KPISectionProps {
  completedVisits: number;
  pendingVisits: number;
  dailyTarget: number;
  weeklyStats: {
    completed: number;
    target: number;
    rate: number;
  };
}

const KPISection: React.FC<KPISectionProps> = ({
  completedVisits,
  pendingVisits,
  dailyTarget,
  weeklyStats,
}) => {
  const completionRate = Math.round((completedVisits / dailyTarget) * 100);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard 
        title="Günlük Hedef" 
        value={`${completedVisits}/${dailyTarget}`} 
        progress={completionRate} 
        icon={<Target className="w-6 h-6" />} 
        type="target" 
      />
      <KPICard 
        title="Tamamlanan" 
        value={completedVisits.toString()} 
        subtitle="Bugünkü ziyaret" 
        icon={<CheckCircle className="w-6 h-6" />} 
        type="completed" 
      />
      <KPICard 
        title="Bekleyen" 
        value={pendingVisits.toString()} 
        subtitle="Bugünkü ziyaret" 
        icon={<Clock className="w-6 h-6" />} 
        type="pending" 
      />
      <KPICard 
        title="Haftalık Performans" 
        value={`%${weeklyStats.rate}`} 
        subtitle={`${weeklyStats.completed}/${weeklyStats.target} ziyaret`} 
        icon={<TrendingUp className="w-6 h-6" />} 
        type="performance" 
      />
    </div>
  );
};

export default KPISection;
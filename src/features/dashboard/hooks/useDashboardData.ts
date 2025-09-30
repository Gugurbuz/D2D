import { useMemo } from 'react';
import { Customer } from '../../customers/types';

export function useDashboardData(customers: Customer[]) {
  const today = new Date().toISOString().split('T')[0];
  const time = new Date();
  const hour = time.getHours();
  const day = time.getDay();
  const isWeekend = day === 0 || day === 6;
  const isWorkingHours = hour >= 9 && hour < 18;

  const todaysVisits = useMemo(
    () => customers.filter(c => c.visitDate === today),
    [customers, today]
  );

  const tomorrowsVisits = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDateString = tomorrow.toISOString().split('T')[0];
    return customers.filter(c => c.visitDate === tomorrowDateString);
  }, [customers]);

  const completedVisits = useMemo(
    () => todaysVisits.filter(c => c.status === 'Tamamlandı'),
    [todaysVisits]
  );

  const pendingVisits = useMemo(
    () => todaysVisits.filter(c => c.status === 'Planlandı'),
    [todaysVisits]
  );

  const dailyTarget = 20;
  const completionRate = Math.round((completedVisits.length / dailyTarget) * 100);

  const weeklyStats = useMemo(() => {
    const weeklyTarget = dailyTarget * 5;
    const weeklyCompleted = Math.min(weeklyTarget, completedVisits.length * 4 + 15);
    const rate = Math.round((weeklyCompleted / weeklyTarget) * 100);
    return { target: weeklyTarget, completed: weeklyCompleted, rate };
  }, [completedVisits.length, dailyTarget]);

  const headerMessage = useMemo(() => {
    const getRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

    const greetings = {
      morning: ["Günaydın", "Harika bir gün dilerim", "Enerjin bol olsun"],
      afternoon: ["Merhaba", "İyi çalışmalar", "Günün nasıl geçiyor?"],
      evening: ["İyi akşamlar", "Umarım günün iyi geçmiştir"],
      night: ["İyi geceler", "İyi dinlenmeler"],
    };

    const status = {
      hasVisits: (count: number) => [
        `bugün ${count} ziyaretin var.`,
        `seni bekleyen ${count} müşteri var.`,
        `programında ${count} ziyaret görünüyor.`,
      ],
      noVisits: [
        "bugün için planlanmış bir ziyaretin yok.",
        "programın bugün boş görünüyor, yeni görevler için hazır ol.",
        "bugün dinlenme veya hazırlık günü mü? Fırsatları değerlendirebilirsin.",
      ],
    };

    const motivation = {
      high: ["Hedefine çok yakınsın, harika gidiyor! 🎉", "Mükemmel bir performans, böyle devam et! 🏆"],
      medium: ["İyi ilerliyorsun, motivasyonunu koru. 💪", "Hedefin yarısı tamam, harika! 👍"],
      low: ["Başarılı bir gün seni bekliyor! 🚀", "Güne enerjik bir başlangıç yapalım! ⚡"],
    };

    if (isWeekend) {
      return "Merhaba! Bugün dinlenme günü. Haftanın yorgunluğunu at, iyi hafta sonları! 🏖️";
    }

    let greeting = "";
    if (hour < 12) greeting = getRandom(greetings.morning);
    else if (hour < 17) greeting = getRandom(greetings.afternoon);
    else greeting = getRandom(greetings.evening);

    const statusMessage = todaysVisits.length > 0
      ? getRandom(status.hasVisits(todaysVisits.length))
      : getRandom(status.noVisits);

    let motivationalMessage = "";
    if (todaysVisits.length > 0) {
      if (completionRate >= 80) motivationalMessage = getRandom(motivation.high);
      else if (completionRate >= 40) motivationalMessage = getRandom(motivation.medium);
      else motivationalMessage = getRandom(motivation.low);
    }

    return `${greeting}! ${statusMessage} ${motivationalMessage}`;
  }, [todaysVisits.length, completionRate, isWorkingHours, isWeekend, hour]);

  // Determine which visits to show
  const isShowingTomorrow = !isWeekend && !isWorkingHours;
  const visitsToShow = isShowingTomorrow ? tomorrowsVisits : todaysVisits;
  const programTitle = isShowingTomorrow ? "Yarınki Program" : "Bugünkü Program";
  const noVisitMessage = isShowingTomorrow
    ? "Yarın için planlanmış ziyaret yok."
    : "Bugün için planlanmış ziyaret yok.";

  return {
    todaysVisits,
    tomorrowsVisits,
    completedVisits,
    pendingVisits,
    visitsToShow,
    dailyTarget,
    completionRate,
    weeklyStats,
    headerMessage,
    programTitle,
    noVisitMessage,
    currentTime: time,
  };
}
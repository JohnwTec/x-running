export const calculateIMC = (weight: number, height: number): string => {
  return (weight / (height * height)).toFixed(1);
};

export const getIMCCategory = (imc: number): { category: string; color: string; description: string } => {
  if (imc < 18.5) {
    return {
      category: 'Abaixo do peso',
      color: 'text-blue-600 bg-blue-50',
      description: 'Considere ganhar peso de forma saudável'
    };
  } else if (imc < 25) {
    return {
      category: 'Peso normal',
      color: 'text-green-600 bg-green-50',
      description: 'Peso ideal para corrida!'
    };
  } else if (imc < 30) {
    return {
      category: 'Sobrepeso',
      color: 'text-yellow-600 bg-yellow-50',
      description: 'Corrida ajudará a manter peso saudável'
    };
  } else {
    return {
      category: 'Obesidade',
      color: 'text-red-600 bg-red-50',
      description: 'Comece gradualmente e consulte um médico'
    };
  }
};

export const getAgeGroup = (age: number): string => {
  if (age >= 18 && age <= 30) return 'jovem';
  if (age > 30 && age <= 50) return 'adulto';
  if (age > 50 && age <= 65) return 'meia-idade';
  return 'idoso';
};

export const calculateFCMax = (age: number): number => {
  return Math.round(208 - 0.7 * age);
};

export const classifyUser = (distance: number, time: number): 'iniciante' | 'intermediário' | 'avançado' | 'profissional' => {
  const pace = (time / distance) * 60;
  if (pace > 8 || distance < 3) return 'iniciante';
  if (pace > 6 && distance < 10) return 'intermediário';
  if (pace > 6 && distance < 20) return 'avançado';
  return 'profissional';
};

export const haversineDistance = (pos1: { latitude: number; longitude: number }, pos2: { latitude: number; longitude: number }): number => {
  const R = 6371e3; // Raio da Terra em metros
  const φ1 = (pos1.latitude * Math.PI) / 180;
  const φ2 = (pos2.latitude * Math.PI) / 180;
  const Δφ = ((pos2.latitude - pos1.latitude) * Math.PI) / 180;
  const Δλ = ((pos2.longitude - pos1.longitude) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c / 1000; // Distância em km
};

export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const calculateWeeklyStats = (trainings: TrainingProgress[]): any[] => {
  const weeks: { [key: string]: any } = {};
  
  trainings.forEach(training => {
    const date = new Date(training.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeks[weekKey]) {
      weeks[weekKey] = {
        week: weekKey,
        totalDistance: 0,
        totalTime: 0,
        trainingsCount: 0,
        totalPace: 0
      };
    }
    
    weeks[weekKey].totalDistance += training.distance;
    weeks[weekKey].totalTime += training.duration;
    weeks[weekKey].trainingsCount += 1;
    weeks[weekKey].totalPace += training.pace;
  });
  
  return Object.values(weeks).map(week => ({
    ...week,
    averagePace: week.totalPace / week.trainingsCount || 0
  }));
};

export const getStatsComparison = (trainings: TrainingProgress[]) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const todayTrainings = trainings.filter(t => {
    const trainingDate = new Date(t.date);
    return trainingDate >= today;
  });

  const weekTrainings = trainings.filter(t => {
    const trainingDate = new Date(t.date);
    return trainingDate >= weekAgo;
  });

  const monthTrainings = trainings.filter(t => {
    const trainingDate = new Date(t.date);
    return trainingDate >= monthAgo;
  });

  const calculateStats = (data: TrainingProgress[]) => ({
    distance: data.reduce((sum, t) => sum + t.distance, 0),
    time: data.reduce((sum, t) => sum + t.duration, 0),
    count: data.length,
    averagePace: data.length > 0 ? data.reduce((sum, t) => sum + t.pace, 0) / data.length : 0
  });

  return {
    today: calculateStats(todayTrainings),
    week: calculateStats(weekTrainings),
    month: calculateStats(monthTrainings),
    total: calculateStats(trainings)
  };
};
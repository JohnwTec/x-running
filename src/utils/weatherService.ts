// Serviço para obter dados meteorológicos
interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
  recommendation: string;
  uvIndex?: number;
  airQuality?: string;
}

class WeatherService {
  private apiKey: string = ''; // Seria configurado via env
  private lastFetch: Date | null = null;
  private cachedData: WeatherData | null = null;
  private cacheTimeout = 10 * 60 * 1000; // 10 minutos

  async getCurrentWeather(lat?: number, lon?: number): Promise<WeatherData | null> {
    // Verificar cache
    if (this.cachedData && this.lastFetch && 
        (Date.now() - this.lastFetch.getTime()) < this.cacheTimeout) {
      return this.cachedData;
    }

    try {
      // Se não tiver coordenadas, tentar obter localização
      if (!lat || !lon) {
        const position = await this.getCurrentPosition();
        lat = position.coords.latitude;
        lon = position.coords.longitude;
      }

      // Em produção, usar API real como OpenWeatherMap
      const weatherData = await this.fetchWeatherData(lat, lon);
      
      this.cachedData = weatherData;
      this.lastFetch = new Date();
      
      return weatherData;
    } catch (error) {
      console.error('Erro ao obter dados meteorológicos:', error);
      return this.getSimulatedWeather();
    }
  }

  private async getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalização não suportada'));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 300000 // 5 minutos
      });
    });
  }

  private async fetchWeatherData(lat: number, lon: number): Promise<WeatherData> {
    // Em produção, fazer requisição para API real
    // const response = await fetch(
    //   `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&lang=pt_br`
    // );
    // const data = await response.json();

    // Por enquanto, simular dados baseados na localização
    return this.getSimulatedWeather();
  }

  private getSimulatedWeather(): WeatherData {
    const conditions = [
      {
        condition: 'Ensolarado',
        temp: 22 + Math.random() * 8, // 22-30°C
        humidity: 40 + Math.random() * 20, // 40-60%
        wind: 5 + Math.random() * 10, // 5-15 km/h
        visibility: 8 + Math.random() * 2, // 8-10 km
        uvIndex: 6 + Math.random() * 4 // 6-10
      },
      {
        condition: 'Parcialmente Nublado',
        temp: 18 + Math.random() * 6, // 18-24°C
        humidity: 50 + Math.random() * 20, // 50-70%
        wind: 8 + Math.random() * 12, // 8-20 km/h
        visibility: 6 + Math.random() * 3, // 6-9 km
        uvIndex: 3 + Math.random() * 4 // 3-7
      },
      {
        condition: 'Nublado',
        temp: 15 + Math.random() * 5, // 15-20°C
        humidity: 60 + Math.random() * 25, // 60-85%
        wind: 10 + Math.random() * 15, // 10-25 km/h
        visibility: 4 + Math.random() * 4, // 4-8 km
        uvIndex: 1 + Math.random() * 3 // 1-4
      },
      {
        condition: 'Chuvoso',
        temp: 12 + Math.random() * 8, // 12-20°C
        humidity: 75 + Math.random() * 20, // 75-95%
        wind: 15 + Math.random() * 20, // 15-35 km/h
        visibility: 2 + Math.random() * 3, // 2-5 km
        uvIndex: 0 + Math.random() * 2 // 0-2
      }
    ];

    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    
    return {
      temperature: Math.round(randomCondition.temp * 10) / 10,
      condition: randomCondition.condition,
      humidity: Math.round(randomCondition.humidity),
      windSpeed: Math.round(randomCondition.wind),
      visibility: Math.round(randomCondition.visibility * 10) / 10,
      uvIndex: Math.round(randomCondition.uvIndex),
      airQuality: this.getRandomAirQuality(),
      recommendation: this.getRunningRecommendation(randomCondition)
    };
  }

  private getRandomAirQuality(): string {
    const qualities = ['Boa', 'Moderada', 'Insalubre para grupos sensíveis', 'Insalubre'];
    const weights = [0.5, 0.3, 0.15, 0.05]; // Probabilidades
    
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < qualities.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        return qualities[i];
      }
    }
    
    return qualities[0];
  }

  private getRunningRecommendation(condition: any): string {
    const temp = condition.temp;
    const humidity = condition.humidity;
    const wind = condition.wind;
    const conditionName = condition.condition;

    if (conditionName === 'Chuvoso') {
      return 'Chuva detectada - considere treino indoor ou aguarde melhorar';
    }

    if (temp > 28) {
      return 'Temperatura alta - hidrate-se bem, evite horários de pico (10h-16h)';
    }

    if (temp < 8) {
      return 'Temperatura baixa - faça aquecimento extra e use roupas adequadas';
    }

    if (humidity > 80) {
      return 'Umidade alta - reduza a intensidade e hidrate-se frequentemente';
    }

    if (wind > 25) {
      return 'Vento forte - cuidado com a estabilidade, considere rota protegida';
    }

    if (condition.uvIndex > 8) {
      return 'UV alto - use protetor solar, boné e evite exposição prolongada';
    }

    if (temp >= 15 && temp <= 25 && humidity < 70 && wind < 20) {
      return 'Condições ideais para corrida! Aproveite o treino 🏃‍♂️';
    }

    return 'Condições adequadas para corrida - mantenha-se hidratado';
  }

  // Obter previsão para os próximos dias
  async getWeatherForecast(days: number = 5): Promise<WeatherData[]> {
    try {
      // Em produção, usar API de previsão
      const forecast: WeatherData[] = [];
      
      for (let i = 0; i < days; i++) {
        forecast.push(this.getSimulatedWeather());
      }
      
      return forecast;
    } catch (error) {
      console.error('Erro ao obter previsão:', error);
      return [];
    }
  }

  // Verificar se as condições são adequadas para corrida
  isGoodForRunning(weather: WeatherData): boolean {
    const { temperature, condition, windSpeed, visibility } = weather;
    
    // Condições ruins
    if (condition === 'Chuvoso') return false;
    if (temperature < 5 || temperature > 35) return false;
    if (windSpeed > 30) return false;
    if (visibility < 3) return false;
    
    return true;
  }

  // Obter recomendações específicas de equipamento
  getEquipmentRecommendations(weather: WeatherData): string[] {
    const recommendations: string[] = [];
    const { temperature, condition, windSpeed, humidity } = weather;

    // Recomendações baseadas na temperatura
    if (temperature < 10) {
      recommendations.push('Roupas térmicas e luvas');
      recommendations.push('Aquecimento prolongado');
    } else if (temperature > 25) {
      recommendations.push('Roupas leves e respiráveis');
      recommendations.push('Boné ou viseira');
    }

    // Recomendações baseadas na condição
    if (condition === 'Ensolarado') {
      recommendations.push('Protetor solar FPS 30+');
      recommendations.push('Óculos de sol');
    } else if (condition === 'Chuvoso') {
      recommendations.push('Jaqueta impermeável');
      recommendations.push('Tênis com boa aderência');
    }

    // Recomendações baseadas no vento
    if (windSpeed > 20) {
      recommendations.push('Corta-vento');
      recommendations.push('Evitar roupas largas');
    }

    // Recomendações baseadas na umidade
    if (humidity > 70) {
      recommendations.push('Roupas que absorvem suor');
      recommendations.push('Hidratação extra');
    }

    return recommendations;
  }

  // Salvar dados meteorológicos do treino
  saveTrainingWeather(weather: WeatherData): void {
    const trainingWeather = {
      temperature: weather.temperature,
      condition: weather.condition,
      humidity: weather.humidity,
      windSpeed: weather.windSpeed,
      timestamp: new Date().toISOString()
    };

    // Salvar no localStorage para usar no banco de dados
    localStorage.setItem('last_training_weather', JSON.stringify(trainingWeather));
  }

  // Obter dados meteorológicos do último treino
  getLastTrainingWeather(): any {
    try {
      const data = localStorage.getItem('last_training_weather');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Erro ao carregar dados meteorológicos do treino:', error);
      return null;
    }
  }
}

export const weatherService = new WeatherService();
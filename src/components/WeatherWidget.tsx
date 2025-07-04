import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Wind, Thermometer, Eye } from 'lucide-react';

interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
  recommendation: string;
}

export const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular dados meteorológicos (em produção, usar API real como OpenWeatherMap)
    const simulateWeather = () => {
      const conditions = [
        { condition: 'Ensolarado', temp: 22, humidity: 45, wind: 8, visibility: 10, icon: Sun },
        { condition: 'Parcialmente Nublado', temp: 18, humidity: 60, wind: 12, visibility: 8, icon: Cloud },
        { condition: 'Chuvoso', temp: 15, humidity: 85, wind: 15, visibility: 5, icon: CloudRain }
      ];
      
      const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
      
      let recommendation = '';
      if (randomCondition.temp > 25) {
        recommendation = 'Tempo quente - hidrate-se bem e evite horários de pico';
      } else if (randomCondition.temp < 10) {
        recommendation = 'Tempo frio - faça aquecimento extra e use roupas adequadas';
      } else if (randomCondition.condition === 'Chuvoso') {
        recommendation = 'Chuva - considere treino indoor ou use equipamentos impermeáveis';
      } else {
        recommendation = 'Condições ideais para corrida!';
      }

      setWeather({
        temperature: randomCondition.temp,
        condition: randomCondition.condition,
        humidity: randomCondition.humidity,
        windSpeed: randomCondition.wind,
        visibility: randomCondition.visibility,
        recommendation
      });
      setLoading(false);
    };

    simulateWeather();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-8 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!weather) return null;

  const getWeatherIcon = () => {
    switch (weather.condition) {
      case 'Ensolarado':
        return <Sun className="w-8 h-8 text-yellow-500" />;
      case 'Parcialmente Nublado':
        return <Cloud className="w-8 h-8 text-gray-500" />;
      case 'Chuvoso':
        return <CloudRain className="w-8 h-8 text-blue-500" />;
      default:
        return <Sun className="w-8 h-8 text-yellow-500" />;
    }
  };

  const getRecommendationColor = () => {
    if (weather.condition === 'Chuvoso' || weather.temperature > 25 || weather.temperature < 10) {
      return 'text-orange-600 bg-orange-50';
    }
    return 'text-green-600 bg-green-50';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
        {getWeatherIcon()}
        <span className="ml-2">Condições do Tempo</span>
      </h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center">
            <Thermometer className="w-5 h-5 text-red-500 mr-1" />
            <span className="text-2xl font-bold text-gray-800">{weather.temperature}°C</span>
          </div>
          <p className="text-sm text-gray-500">{weather.condition}</p>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center">
            <Wind className="w-4 h-4 text-blue-500 mr-2" />
            <span>Vento: {weather.windSpeed} km/h</span>
          </div>
          <div className="flex items-center">
            <Eye className="w-4 h-4 text-gray-500 mr-2" />
            <span>Visibilidade: {weather.visibility} km</span>
          </div>
        </div>
      </div>

      <div className={`p-3 rounded-lg ${getRecommendationColor()}`}>
        <p className="text-sm font-medium">{weather.recommendation}</p>
      </div>
    </div>
  );
};
import { UserProfile, TrainingProgress, Goal, WeeklyStats } from '../types';

export interface AICoachAnalysis {
  recommendation: string;
  reasoning: string;
  confidence: number;
  trainingType: 'recovery' | 'easy' | 'moderate' | 'intense' | 'rest';
  targetPace?: number;
  targetDistance?: number;
  warnings?: string[];
  tips?: string[];
  motivationalMessage: string;
}

export interface AICoachContext {
  userProfile: UserProfile;
  recentTrainings: TrainingProgress[];
  weeklyStats: WeeklyStats[];
  currentGoal: Goal;
  weatherData?: any;
  heartRateData?: number[];
  sleepQuality?: number;
  stressLevel?: number;
  energyLevel?: number;
}

export class AICoach {
  private apiKey: string;
  private baseUrl: string = 'https://api.openai.com/v1/chat/completions';
  
  constructor(apiKey?: string) {
    this.apiKey = apiKey || this.getStoredApiKey() || '';
  }

  private getStoredApiKey(): string | null {
    return localStorage.getItem('ai_coach_api_key');
  }

  public setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    localStorage.setItem('ai_coach_api_key', apiKey);
  }

  public hasApiKey(): boolean {
    return !!this.apiKey;
  }

  async getPersonalizedRecommendation(context: AICoachContext): Promise<AICoachAnalysis> {
    if (!this.apiKey) {
      return this.getFallbackRecommendation(context);
    }

    try {
      const prompt = this.buildPrompt(context);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `Você é um coach de corrida especialista com 20 anos de experiência. 
              Analise os dados do atleta e forneça recomendações personalizadas baseadas em:
              - Histórico de treinos e performance
              - Condições físicas atuais
              - Objetivos e metas
              - Fatores externos (clima, sono, stress)
              
              Responda SEMPRE em formato JSON válido com a estrutura:
              {
                "recommendation": "string",
                "reasoning": "string", 
                "confidence": number (0-100),
                "trainingType": "recovery|easy|moderate|intense|rest",
                "targetPace": number (opcional),
                "targetDistance": number (opcional),
                "warnings": ["string"] (opcional),
                "tips": ["string"],
                "motivationalMessage": "string"
              }`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('Resposta vazia da API');
      }

      // Tentar parsear JSON da resposta
      try {
        const analysis = JSON.parse(content);
        return this.validateAndEnhanceAnalysis(analysis, context);
      } catch (parseError) {
        console.error('Erro ao parsear resposta da IA:', parseError);
        return this.getFallbackRecommendation(context);
      }

    } catch (error) {
      console.error('Erro na consulta à IA:', error);
      return this.getFallbackRecommendation(context);
    }
  }

  private buildPrompt(context: AICoachContext): string {
    const { userProfile, recentTrainings, weeklyStats, currentGoal } = context;
    
    const recentPerformance = recentTrainings.slice(-5);
    const lastWeek = weeklyStats[weeklyStats.length - 1];
    
    return `
PERFIL DO ATLETA:
- Nome: ${userProfile.name}
- Idade: ${userProfile.age} anos
- Nível: ${userProfile.level}
- Peso: ${userProfile.weight}kg
- Altura: ${userProfile.height}m

META ATUAL:
- Distância objetivo: ${currentGoal.distance}km
- Prazo: ${currentGoal.months} meses
- Tipo: ${currentGoal.type}

TREINOS RECENTES (últimos 5):
${recentPerformance.map((t, i) => `
${i + 1}. ${new Date(t.date).toLocaleDateString('pt-BR')}
   - Tipo: ${t.type}
   - Distância: ${t.distance.toFixed(2)}km
   - Tempo: ${Math.floor(t.duration / 60)}:${(t.duration % 60).toString().padStart(2, '0')}
   - Pace: ${t.pace.toFixed(1)} min/km
   - Dificuldade: ${t.difficulty || 'normal'}
`).join('')}

ESTATÍSTICAS DA SEMANA:
${lastWeek ? `
- Distância total: ${lastWeek.totalDistance.toFixed(1)}km
- Treinos realizados: ${lastWeek.trainingsCount}
- Pace médio: ${lastWeek.averagePace.toFixed(1)} min/km
- Tempo total: ${Math.floor(lastWeek.totalTime / 60)} minutos
` : 'Nenhum dado semanal disponível'}

DADOS ADICIONAIS:
${context.sleepQuality ? `- Qualidade do sono: ${context.sleepQuality}/10` : ''}
${context.stressLevel ? `- Nível de stress: ${context.stressLevel}/10` : ''}
${context.energyLevel ? `- Nível de energia: ${context.energyLevel}/10` : ''}
${context.weatherData ? `- Clima: ${context.weatherData.condition}, ${context.weatherData.temperature}°C` : ''}

SOLICITAÇÃO:
Com base nesses dados, forneça uma recomendação personalizada para o próximo treino do atleta.
Considere:
1. Progressão adequada baseada no histórico
2. Recuperação necessária entre treinos
3. Adaptação ao nível atual
4. Fatores externos (clima, sono, stress)
5. Proximidade da meta estabelecida

Seja específico sobre tipo de treino, intensidade, duração e pace recomendado.
Inclua dicas práticas e uma mensagem motivacional personalizada.
    `;
  }

  private validateAndEnhanceAnalysis(analysis: any, context: AICoachContext): AICoachAnalysis {
    // Validar estrutura básica
    const validated: AICoachAnalysis = {
      recommendation: analysis.recommendation || 'Treino moderado recomendado',
      reasoning: analysis.reasoning || 'Baseado no seu histórico recente',
      confidence: Math.min(100, Math.max(0, analysis.confidence || 75)),
      trainingType: this.validateTrainingType(analysis.trainingType),
      targetPace: analysis.targetPace,
      targetDistance: analysis.targetDistance,
      warnings: Array.isArray(analysis.warnings) ? analysis.warnings : [],
      tips: Array.isArray(analysis.tips) ? analysis.tips : ['Mantenha-se hidratado', 'Faça aquecimento adequado'],
      motivationalMessage: analysis.motivationalMessage || this.getDefaultMotivationalMessage(context)
    };

    // Validar valores numéricos
    if (validated.targetPace && (validated.targetPace < 3 || validated.targetPace > 15)) {
      validated.targetPace = undefined;
    }
    
    if (validated.targetDistance && (validated.targetDistance < 0.5 || validated.targetDistance > 50)) {
      validated.targetDistance = undefined;
    }

    return validated;
  }

  private validateTrainingType(type: string): 'recovery' | 'easy' | 'moderate' | 'intense' | 'rest' {
    const validTypes = ['recovery', 'easy', 'moderate', 'intense', 'rest'];
    return validTypes.includes(type) ? type as any : 'moderate';
  }

  private getFallbackRecommendation(context: AICoachContext): AICoachAnalysis {
    const { userProfile, recentTrainings, currentGoal } = context;
    
    // Análise simples baseada em regras
    const lastTraining = recentTrainings[recentTrainings.length - 1];
    const daysSinceLastTraining = lastTraining ? 
      Math.floor((Date.now() - new Date(lastTraining.date).getTime()) / (1000 * 60 * 60 * 24)) : 7;
    
    let trainingType: 'recovery' | 'easy' | 'moderate' | 'intense' | 'rest' = 'moderate';
    let recommendation = '';
    let reasoning = '';
    
    if (daysSinceLastTraining === 0) {
      trainingType = 'rest';
      recommendation = 'Descanso recomendado - você já treinou hoje';
      reasoning = 'Recuperação é essencial para evitar overtraining';
    } else if (daysSinceLastTraining === 1 && lastTraining?.type === 'intervalado') {
      trainingType = 'recovery';
      recommendation = 'Treino de recuperação leve';
      reasoning = 'Após treino intervalado, recuperação ativa é importante';
    } else if (daysSinceLastTraining >= 3) {
      trainingType = 'moderate';
      recommendation = 'Treino moderado para retomar o ritmo';
      reasoning = 'Tempo adequado de descanso, pode intensificar gradualmente';
    } else {
      trainingType = 'easy';
      recommendation = 'Treino leve a moderado';
      reasoning = 'Manter consistência sem sobrecarregar';
    }

    const basePace = this.calculateBasePace(userProfile, recentTrainings);
    
    return {
      recommendation,
      reasoning,
      confidence: 70,
      trainingType,
      targetPace: basePace,
      targetDistance: this.calculateTargetDistance(userProfile, trainingType),
      warnings: this.getWarnings(context),
      tips: this.getTips(trainingType),
      motivationalMessage: this.getDefaultMotivationalMessage(context)
    };
  }

  private calculateBasePace(userProfile: UserProfile, recentTrainings: TrainingProgress[]): number {
    if (recentTrainings.length === 0) {
      // Pace base por nível
      const basePaces = {
        'iniciante': 8.0,
        'intermediário': 6.5,
        'avançado': 5.5,
        'profissional': 4.5
      };
      return basePaces[userProfile.level] || 7.0;
    }

    // Média dos últimos 3 treinos
    const recent = recentTrainings.slice(-3);
    const avgPace = recent.reduce((sum, t) => sum + t.pace, 0) / recent.length;
    return avgPace;
  }

  private calculateTargetDistance(userProfile: UserProfile, trainingType: string): number {
    const baseDistances = {
      'iniciante': { recovery: 2, easy: 3, moderate: 5, intense: 4, rest: 0 },
      'intermediário': { recovery: 3, easy: 5, moderate: 8, intense: 6, rest: 0 },
      'avançado': { recovery: 4, easy: 7, moderate: 12, intense: 8, rest: 0 },
      'profissional': { recovery: 6, easy: 10, moderate: 16, intense: 12, rest: 0 }
    };

    return baseDistances[userProfile.level]?.[trainingType] || 5;
  }

  private getWarnings(context: AICoachContext): string[] {
    const warnings: string[] = [];
    
    if (context.stressLevel && context.stressLevel > 7) {
      warnings.push('Nível de stress alto - considere treino mais leve');
    }
    
    if (context.sleepQuality && context.sleepQuality < 4) {
      warnings.push('Qualidade de sono baixa - priorize recuperação');
    }
    
    if (context.energyLevel && context.energyLevel < 4) {
      warnings.push('Energia baixa - evite treinos intensos');
    }

    if (context.weatherData?.temperature > 30) {
      warnings.push('Temperatura alta - hidrate-se bem e evite horários de pico');
    }

    return warnings;
  }

  private getTips(trainingType: string): string[] {
    const tipsByType = {
      recovery: [
        'Mantenha pace bem confortável',
        'Foque na respiração e postura',
        'Hidrate-se adequadamente'
      ],
      easy: [
        'Você deve conseguir conversar durante o treino',
        'Mantenha cadência alta e passadas curtas',
        'Não se preocupe com velocidade'
      ],
      moderate: [
        'Encontre um ritmo sustentável',
        'Monitore sua frequência cardíaca',
        'Faça aquecimento adequado'
      ],
      intense: [
        'Aquecimento prolongado é essencial',
        'Respeite os intervalos de descanso',
        'Hidrate-se durante o treino'
      ],
      rest: [
        'Recuperação ativa: caminhada leve',
        'Alongamento e mobilidade',
        'Foque na nutrição e hidratação'
      ]
    };

    return tipsByType[trainingType] || tipsByType.moderate;
  }

  private getDefaultMotivationalMessage(context: AICoachContext): string {
    const messages = [
      `${context.userProfile.name}, cada passo te aproxima do seu objetivo de ${context.currentGoal.distance}km!`,
      `Você está no caminho certo, ${context.userProfile.name}! Consistência é a chave do sucesso.`,
      `Acredite no processo, ${context.userProfile.name}. Grandes conquistas começam com pequenos passos.`,
      `Seu corpo é capaz de mais do que você imagina. Vamos juntos nessa jornada!`,
      `A disciplina de hoje é a conquista de amanhã. Continue firme!`
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  // Análise pós-treino
  async analyzeTrainingPerformance(
    training: TrainingProgress,
    context: AICoachContext
  ): Promise<{
    performance: 'excellent' | 'good' | 'average' | 'below_average' | 'poor';
    feedback: string;
    nextTrainingAdvice: string;
    recoveryTime: number; // horas
  }> {
    const expectedPace = this.calculateBasePace(context.userProfile, context.recentTrainings);
    const paceRatio = training.pace / expectedPace;
    
    let performance: 'excellent' | 'good' | 'average' | 'below_average' | 'poor';
    let feedback: string;
    let recoveryTime: number;

    if (paceRatio <= 0.85) {
      performance = 'excellent';
      feedback = 'Excelente performance! Você superou as expectativas.';
      recoveryTime = training.type === 'intervalado' ? 48 : 24;
    } else if (paceRatio <= 0.95) {
      performance = 'good';
      feedback = 'Boa performance! Você está progredindo bem.';
      recoveryTime = training.type === 'intervalado' ? 36 : 18;
    } else if (paceRatio <= 1.05) {
      performance = 'average';
      feedback = 'Performance dentro do esperado. Continue assim!';
      recoveryTime = training.type === 'intervalado' ? 24 : 12;
    } else if (paceRatio <= 1.15) {
      performance = 'below_average';
      feedback = 'Performance abaixo do esperado. Pode ser fadiga ou condições externas.';
      recoveryTime = training.type === 'intervalado' ? 48 : 24;
    } else {
      performance = 'poor';
      feedback = 'Performance bem abaixo do esperado. Considere mais descanso.';
      recoveryTime = 72;
    }

    const nextTrainingAdvice = this.getNextTrainingAdvice(performance, training.type);

    return {
      performance,
      feedback,
      nextTrainingAdvice,
      recoveryTime
    };
  }

  private getNextTrainingAdvice(performance: string, lastTrainingType: string): string {
    if (performance === 'excellent') {
      return 'Você pode manter ou aumentar ligeiramente a intensidade no próximo treino.';
    } else if (performance === 'good') {
      return 'Continue com a progressão atual. Você está no caminho certo.';
    } else if (performance === 'average') {
      return 'Mantenha a intensidade atual e foque na consistência.';
    } else if (performance === 'below_average') {
      return 'Considere um treino mais leve no próximo. Pode ser necessário mais recuperação.';
    } else {
      return 'Recomendo descanso ou treino muito leve. Escute seu corpo.';
    }
  }

  // Análise de tendências
  analyzeTrends(recentTrainings: TrainingProgress[]): {
    paceImprovement: number; // % de melhoria
    consistencyScore: number; // 0-100
    volumeProgression: number; // % de aumento
    recommendations: string[];
  } {
    if (recentTrainings.length < 3) {
      return {
        paceImprovement: 0,
        consistencyScore: 50,
        volumeProgression: 0,
        recommendations: ['Continue treinando para gerar análises mais precisas']
      };
    }

    const recent = recentTrainings.slice(-6);
    const older = recent.slice(0, 3);
    const newer = recent.slice(3);

    // Melhoria de pace
    const oldAvgPace = older.reduce((sum, t) => sum + t.pace, 0) / older.length;
    const newAvgPace = newer.reduce((sum, t) => sum + t.pace, 0) / newer.length;
    const paceImprovement = ((oldAvgPace - newAvgPace) / oldAvgPace) * 100;

    // Score de consistência (baseado na variação de pace)
    const paceVariation = this.calculateVariation(newer.map(t => t.pace));
    const consistencyScore = Math.max(0, 100 - (paceVariation * 20));

    // Progressão de volume
    const oldAvgDistance = older.reduce((sum, t) => sum + t.distance, 0) / older.length;
    const newAvgDistance = newer.reduce((sum, t) => sum + t.distance, 0) / newer.length;
    const volumeProgression = ((newAvgDistance - oldAvgDistance) / oldAvgDistance) * 100;

    const recommendations = this.generateTrendRecommendations(
      paceImprovement,
      consistencyScore,
      volumeProgression
    );

    return {
      paceImprovement,
      consistencyScore,
      volumeProgression,
      recommendations
    };
  }

  private calculateVariation(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance) / mean;
  }

  private generateTrendRecommendations(
    paceImprovement: number,
    consistencyScore: number,
    volumeProgression: number
  ): string[] {
    const recommendations: string[] = [];

    if (paceImprovement > 5) {
      recommendations.push('Excelente melhoria de pace! Continue com a progressão atual.');
    } else if (paceImprovement < -5) {
      recommendations.push('Pace está regredindo. Considere mais descanso ou revisão do treino.');
    }

    if (consistencyScore < 60) {
      recommendations.push('Foque em manter pace mais consistente entre os treinos.');
    } else if (consistencyScore > 80) {
      recommendations.push('Ótima consistência! Você pode tentar variar mais a intensidade.');
    }

    if (volumeProgression > 15) {
      recommendations.push('Aumento de volume muito rápido. Cuidado com overtraining.');
    } else if (volumeProgression < -10) {
      recommendations.push('Volume de treino diminuindo. Considere aumentar gradualmente.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Você está mantendo um bom equilíbrio. Continue assim!');
    }

    return recommendations;
  }
}

export const aiCoach = new AICoach();
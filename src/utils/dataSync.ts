import { database } from '../lib/database';
import { TrainingProgress, UserProfile, Goal, Achievement } from '../types';

interface SyncStatus {
  lastSync: Date | null;
  pendingSync: string[];
  isOnline: boolean;
  syncInProgress: boolean;
}

class DataSyncService {
  private syncStatus: SyncStatus = {
    lastSync: null,
    pendingSync: [],
    isOnline: navigator.onLine,
    syncInProgress: false
  };

  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeSync();
    this.setupEventListeners();
  }

  private initializeSync(): void {
    // Carregar status de sincronização do localStorage
    const savedStatus = localStorage.getItem('sync_status');
    if (savedStatus) {
      const parsed = JSON.parse(savedStatus);
      this.syncStatus = {
        ...this.syncStatus,
        lastSync: parsed.lastSync ? new Date(parsed.lastSync) : null,
        pendingSync: parsed.pendingSync || []
      };
    }

    // Iniciar sincronização automática se online
    if (this.syncStatus.isOnline) {
      this.startAutoSync();
    }
  }

  private setupEventListeners(): void {
    // Monitorar status de conectividade
    window.addEventListener('online', () => {
      this.syncStatus.isOnline = true;
      this.startAutoSync();
      this.syncPendingData();
    });

    window.addEventListener('offline', () => {
      this.syncStatus.isOnline = false;
      this.stopAutoSync();
    });

    // Sincronizar antes de fechar a página
    window.addEventListener('beforeunload', () => {
      if (this.syncStatus.pendingSync.length > 0) {
        this.syncPendingData();
      }
    });
  }

  private startAutoSync(): void {
    if (this.syncInterval) return;

    // Sincronizar a cada 30 segundos
    this.syncInterval = setInterval(() => {
      this.syncPendingData();
    }, 30000);
  }

  private stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  private saveSyncStatus(): void {
    localStorage.setItem('sync_status', JSON.stringify({
      lastSync: this.syncStatus.lastSync?.toISOString(),
      pendingSync: this.syncStatus.pendingSync
    }));
  }

  // Adicionar item à fila de sincronização
  private addToPendingSync(item: string): void {
    if (!this.syncStatus.pendingSync.includes(item)) {
      this.syncStatus.pendingSync.push(item);
      this.saveSyncStatus();
    }
  }

  // Remover item da fila de sincronização
  private removeFromPendingSync(item: string): void {
    this.syncStatus.pendingSync = this.syncStatus.pendingSync.filter(i => i !== item);
    this.saveSyncStatus();
  }

  // Salvar perfil do usuário
  async saveUserProfile(profile: UserProfile & { email: string }): Promise<boolean> {
    try {
      if (this.syncStatus.isOnline) {
        const success = await database.createUserProfile(profile);
        if (success) {
          this.removeFromPendingSync('user_profile');
          return true;
        }
      }
      
      // Salvar localmente se offline ou se falhou
      localStorage.setItem('user_profile', JSON.stringify(profile));
      this.addToPendingSync('user_profile');
      return true;
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      return false;
    }
  }

  // Salvar meta
  async saveGoal(goal: Goal): Promise<boolean> {
    try {
      if (this.syncStatus.isOnline) {
        const success = await database.createGoal(goal);
        if (success) {
          this.removeFromPendingSync('goal');
          return true;
        }
      }
      
      localStorage.setItem('goal', JSON.stringify(goal));
      this.addToPendingSync('goal');
      return true;
    } catch (error) {
      console.error('Erro ao salvar meta:', error);
      return false;
    }
  }

  // Salvar progresso de treino
  async saveTrainingProgress(training: Omit<TrainingProgress, 'id'> & {
    heartRateAvg?: number;
    heartRateMax?: number;
    caloriesBurned?: number;
    elevationGain?: number;
    weatherTemp?: number;
    weatherCondition?: string;
    gpsAccuracy?: number;
    notes?: string;
  }): Promise<string | null> {
    try {
      if (this.syncStatus.isOnline) {
        const trainingId = await database.saveTrainingProgress(training);
        if (trainingId) {
          // Atualizar localStorage com dados sincronizados
          const localTrainings = this.getLocalTrainingProgress();
          const updatedTrainings = [...localTrainings, { ...training, id: trainingId }];
          localStorage.setItem('training_progress', JSON.stringify(updatedTrainings));
          return trainingId;
        }
      }
      
      // Salvar localmente se offline ou se falhou
      const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const localTrainings = this.getLocalTrainingProgress();
      const updatedTrainings = [...localTrainings, { ...training, id: localId }];
      localStorage.setItem('training_progress', JSON.stringify(updatedTrainings));
      this.addToPendingSync(`training_${localId}`);
      return localId;
    } catch (error) {
      console.error('Erro ao salvar treino:', error);
      return null;
    }
  }

  // Obter progresso de treinos local
  private getLocalTrainingProgress(): TrainingProgress[] {
    try {
      const data = localStorage.getItem('training_progress');
      if (!data) return [];
      
      return JSON.parse(data).map((training: any) => ({
        ...training,
        date: new Date(training.date)
      }));
    } catch (error) {
      console.error('Erro ao carregar treinos locais:', error);
      return [];
    }
  }

  // Sincronizar dados pendentes
  async syncPendingData(): Promise<boolean> {
    if (!this.syncStatus.isOnline || this.syncStatus.syncInProgress) {
      return false;
    }

    this.syncStatus.syncInProgress = true;

    try {
      const pendingItems = [...this.syncStatus.pendingSync];
      
      for (const item of pendingItems) {
        try {
          if (item === 'user_profile') {
            const profile = localStorage.getItem('user_profile');
            if (profile) {
              const success = await database.createUserProfile(JSON.parse(profile));
              if (success) {
                this.removeFromPendingSync(item);
              }
            }
          } else if (item === 'goal') {
            const goal = localStorage.getItem('goal');
            if (goal) {
              const success = await database.createGoal(JSON.parse(goal));
              if (success) {
                this.removeFromPendingSync(item);
              }
            }
          } else if (item.startsWith('training_')) {
            const localId = item.replace('training_', '');
            const localTrainings = this.getLocalTrainingProgress();
            const training = localTrainings.find(t => t.id === localId);
            
            if (training) {
              const { id, ...trainingData } = training;
              const newId = await database.saveTrainingProgress(trainingData);
              
              if (newId) {
                // Atualizar ID local com ID do servidor
                const updatedTrainings = localTrainings.map(t => 
                  t.id === localId ? { ...t, id: newId } : t
                );
                localStorage.setItem('training_progress', JSON.stringify(updatedTrainings));
                this.removeFromPendingSync(item);
              }
            }
          }
        } catch (error) {
          console.error(`Erro ao sincronizar ${item}:`, error);
        }
      }

      this.syncStatus.lastSync = new Date();
      this.saveSyncStatus();
      return true;
    } catch (error) {
      console.error('Erro na sincronização:', error);
      return false;
    } finally {
      this.syncStatus.syncInProgress = false;
    }
  }

  // Carregar dados do servidor
  async loadServerData(): Promise<{
    profile: UserProfile | null;
    goal: Goal | null;
    trainings: TrainingProgress[];
    achievements: Achievement[];
  }> {
    try {
      if (!this.syncStatus.isOnline) {
        return {
          profile: null,
          goal: null,
          trainings: [],
          achievements: []
        };
      }

      const [profile, goal, trainings, achievements] = await Promise.all([
        database.getUserProfile(),
        database.getActiveGoal(),
        database.getTrainingProgress(),
        database.getAchievements()
      ]);

      // Atualizar dados locais com dados do servidor
      if (profile) {
        localStorage.setItem('user_profile', JSON.stringify(profile));
      }
      if (goal) {
        localStorage.setItem('goal', JSON.stringify(goal));
      }
      if (trainings.length > 0) {
        localStorage.setItem('training_progress', JSON.stringify(trainings));
      }
      if (achievements.length > 0) {
        localStorage.setItem('achievements', JSON.stringify(achievements));
      }

      this.syncStatus.lastSync = new Date();
      this.saveSyncStatus();

      return { profile, goal, trainings, achievements };
    } catch (error) {
      console.error('Erro ao carregar dados do servidor:', error);
      return {
        profile: null,
        goal: null,
        trainings: [],
        achievements: []
      };
    }
  }

  // Obter status de sincronização
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  // Forçar sincronização
  async forcSync(): Promise<boolean> {
    return this.syncPendingData();
  }

  // Limpar dados locais
  clearLocalData(): void {
    const keysToRemove = [
      'user_profile',
      'goal',
      'training_progress',
      'achievements',
      'sync_status'
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    this.syncStatus = {
      lastSync: null,
      pendingSync: [],
      isOnline: navigator.onLine,
      syncInProgress: false
    };
  }

  // Verificar se há dados pendentes
  hasPendingData(): boolean {
    return this.syncStatus.pendingSync.length > 0;
  }

  // Obter dados locais para exibição offline
  getLocalData(): {
    profile: UserProfile | null;
    goal: Goal | null;
    trainings: TrainingProgress[];
    achievements: Achievement[];
  } {
    try {
      const profile = localStorage.getItem('user_profile');
      const goal = localStorage.getItem('goal');
      const achievements = localStorage.getItem('achievements');
      
      return {
        profile: profile ? JSON.parse(profile) : null,
        goal: goal ? JSON.parse(goal) : null,
        trainings: this.getLocalTrainingProgress(),
        achievements: achievements ? JSON.parse(achievements).map((a: any) => ({
          ...a,
          unlockedAt: new Date(a.unlockedAt)
        })) : []
      };
    } catch (error) {
      console.error('Erro ao carregar dados locais:', error);
      return {
        profile: null,
        goal: null,
        trainings: [],
        achievements: []
      };
    }
  }
}

export const dataSync = new DataSyncService();
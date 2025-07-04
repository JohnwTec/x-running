// Integração com apps de fitness e dispositivos wearables

export interface HealthData {
  heartRate?: number;
  steps?: number;
  distance?: number;
  calories?: number;
  activeMinutes?: number;
}

export interface WorkoutData {
  type: string;
  startTime: Date;
  endTime: Date;
  distance: number;
  duration: number;
  calories?: number;
  heartRate?: {
    average: number;
    max: number;
    min: number;
  };
}

class FitnessIntegration {
  private isAppleHealthAvailable = false;
  private isWebBluetoothAvailable = false;

  constructor() {
    this.checkAvailability();
  }

  private checkAvailability(): void {
    // Verificar se está no iOS e se o HealthKit está disponível
    this.isAppleHealthAvailable = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
                                  'webkit' in window;
    
    // Verificar se Web Bluetooth está disponível
    this.isWebBluetoothAvailable = 'bluetooth' in navigator;
  }

  // Integração com Apple Health (via Web API quando disponível)
  async requestAppleHealthPermission(): Promise<boolean> {
    if (!this.isAppleHealthAvailable) {
      console.log('Apple Health não disponível neste dispositivo');
      return false;
    }

    try {
      // Simular solicitação de permissão
      // Em produção, seria necessário usar capacitor-health ou similar
      const permission = await this.simulateHealthPermission();
      return permission;
    } catch (error) {
      console.error('Erro ao solicitar permissão do Apple Health:', error);
      return false;
    }
  }

  private async simulateHealthPermission(): Promise<boolean> {
    return new Promise((resolve) => {
      // Simular dialog de permissão
      const userConsent = confirm(
        'Permitir acesso aos dados de saúde?\n\n' +
        '• Frequência cardíaca\n' +
        '• Passos\n' +
        '• Distância percorrida\n' +
        '• Calorias queimadas'
      );
      
      setTimeout(() => resolve(userConsent), 500);
    });
  }

  // Conectar com smartwatch via Bluetooth
  async connectSmartwatch(): Promise<boolean> {
    if (!this.isWebBluetoothAvailable) {
      console.log('Web Bluetooth não disponível');
      return false;
    }

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: ['heart_rate'] },
          { services: ['running_speed_and_cadence'] },
          { namePrefix: 'Apple Watch' },
          { namePrefix: 'Galaxy Watch' },
          { namePrefix: 'Fitbit' },
          { namePrefix: 'Garmin' },
          { namePrefix: 'Polar' },
          { namePrefix: 'Amazfit' },
          { namePrefix: 'Zepp' }
        ],
        optionalServices: [
          'heart_rate',
          'running_speed_and_cadence',
          'cycling_speed_and_cadence',
          'battery_service'
        ]
      });

      console.log('Dispositivo conectado:', device.name);
      
      const server = await device.gatt?.connect();
      if (server) {
        await this.setupHeartRateMonitoring(server);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao conectar smartwatch:', error);
      return false;
    }
  }

  private async setupHeartRateMonitoring(server: BluetoothRemoteGATTServer): Promise<void> {
    try {
      const service = await server.getPrimaryService('heart_rate');
      const characteristic = await service.getCharacteristic('heart_rate_measurement');
      
      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', (event) => {
        const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
        if (value) {
          const heartRate = value.getUint16(1, true);
          this.onHeartRateUpdate(heartRate);
        }
      });
    } catch (error) {
      console.error('Erro ao configurar monitoramento de frequência cardíaca:', error);
    }
  }

  private onHeartRateUpdate(heartRate: number): void {
    // Callback para atualização de frequência cardíaca
    window.dispatchEvent(new CustomEvent('heartRateUpdate', { 
      detail: { heartRate } 
    }));
  }

  // Integração com Strava
  async connectStrava(): Promise<boolean> {
    try {
      // Configuração OAuth do Strava
      const clientId = 'YOUR_STRAVA_CLIENT_ID'; // Seria configurado via env
      const redirectUri = window.location.origin + '/strava-callback';
      const scope = 'read,activity:write';
      
      const authUrl = `https://www.strava.com/oauth/authorize?` +
        `client_id=${clientId}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `approval_prompt=force&` +
        `scope=${scope}`;

      // Abrir popup para autenticação
      const popup = window.open(authUrl, 'strava-auth', 'width=600,height=600');
      
      return new Promise((resolve) => {
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            // Verificar se a autenticação foi bem-sucedida
            const token = localStorage.getItem('strava_access_token');
            resolve(!!token);
          }
        }, 1000);
      });
    } catch (error) {
      console.error('Erro ao conectar com Strava:', error);
      return false;
    }
  }

  // Enviar treino para Strava
  async uploadToStrava(workoutData: WorkoutData): Promise<boolean> {
    const token = localStorage.getItem('strava_access_token');
    if (!token) {
      console.error('Token do Strava não encontrado');
      return false;
    }

    try {
      const response = await fetch('https://www.strava.com/api/v3/activities', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `Treino de Corrida - ${workoutData.type}`,
          type: 'Run',
          sport_type: 'Run',
          start_date_local: workoutData.startTime.toISOString(),
          elapsed_time: workoutData.duration,
          distance: workoutData.distance * 1000, // Strava espera em metros
          description: `Treino realizado pelo app Treinador de Corrida`
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Erro ao enviar treino para Strava:', error);
      return false;
    }
  }

  // Integração aprimorada com Zepp/Amazfit
  async connectAmazfit(): Promise<boolean> {
    try {
      if (!this.isWebBluetoothAvailable) {
        console.log('Web Bluetooth não disponível');
        return false;
      }

      // Lista expandida de dispositivos Amazfit/Zepp
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'Amazfit' },
          { namePrefix: 'Zepp' },
          { namePrefix: 'Mi Band' },
          { namePrefix: 'Mi Watch' },
          { namePrefix: 'GTR' },
          { namePrefix: 'GTS' },
          { namePrefix: 'T-Rex' },
          { namePrefix: 'Bip' },
          { namePrefix: 'Stratos' },
          { namePrefix: 'Verge' },
          { namePrefix: 'Neo' },
          { namePrefix: 'Pop' }
        ],
        optionalServices: [
          'heart_rate',
          'battery_service',
          'device_information',
          'running_speed_and_cadence'
        ]
      });

      console.log('Dispositivo Amazfit conectado:', device.name);
      
      const server = await device.gatt?.connect();
      if (server) {
        await this.setupAmazfitServices(server);
        localStorage.setItem('amazfit_device_name', device.name || 'Amazfit Device');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao conectar com Amazfit:', error);
      return false;
    }
  }

  private async setupAmazfitServices(server: BluetoothRemoteGATTServer): Promise<void> {
    try {
      // Configurar monitoramento de frequência cardíaca
      const heartRateService = await server.getPrimaryService('heart_rate');
      const heartRateCharacteristic = await heartRateService.getCharacteristic('heart_rate_measurement');
      
      await heartRateCharacteristic.startNotifications();
      heartRateCharacteristic.addEventListener('characteristicvaluechanged', (event) => {
        const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
        if (value) {
          const heartRate = value.getUint16(1, true);
          this.onHeartRateUpdate(heartRate);
        }
      });

      // Configurar outros serviços se disponíveis
      try {
        const batteryService = await server.getPrimaryService('battery_service');
        const batteryCharacteristic = await batteryService.getCharacteristic('battery_level');
        const batteryLevel = await batteryCharacteristic.readValue();
        const battery = batteryLevel.getUint8(0);
        
        window.dispatchEvent(new CustomEvent('batteryUpdate', { 
          detail: { battery } 
        }));
      } catch (error) {
        console.log('Serviço de bateria não disponível');
      }

    } catch (error) {
      console.error('Erro ao configurar serviços Amazfit:', error);
    }
  }

  // Sincronizar dados com Zepp App
  async syncWithZeppApp(): Promise<boolean> {
    try {
      // Simular sincronização com o app Zepp
      // Em produção, seria necessário usar a API oficial do Zepp
      const zeppData = await this.getZeppData();
      
      if (zeppData) {
        // Armazenar dados localmente
        localStorage.setItem('zepp_last_sync', new Date().toISOString());
        localStorage.setItem('zepp_data', JSON.stringify(zeppData));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao sincronizar com Zepp App:', error);
      return false;
    }
  }

  private async getZeppData(): Promise<HealthData | null> {
    // Simular dados do Zepp App
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          heartRate: Math.floor(Math.random() * 40) + 60,
          steps: Math.floor(Math.random() * 10000) + 5000,
          distance: Math.random() * 10 + 2,
          calories: Math.floor(Math.random() * 500) + 200,
          activeMinutes: Math.floor(Math.random() * 120) + 30
        });
      }, 1000);
    });
  }

  // Obter dados de saúde (simulado)
  async getHealthData(): Promise<HealthData> {
    // Em produção, isso viria dos apps de saúde reais
    return {
      heartRate: Math.floor(Math.random() * 40) + 60, // 60-100 bpm
      steps: Math.floor(Math.random() * 5000) + 2000,
      distance: Math.random() * 5 + 1, // 1-6 km
      calories: Math.floor(Math.random() * 300) + 100,
      activeMinutes: Math.floor(Math.random() * 60) + 30
    };
  }

  // Verificar status das conexões
  getConnectionStatus(): {
    appleHealth: boolean;
    smartwatch: boolean;
    strava: boolean;
    amazfit: boolean;
    instagram: boolean;
    facebook: boolean;
  } {
    return {
      appleHealth: !!localStorage.getItem('apple_health_connected'),
      smartwatch: !!localStorage.getItem('smartwatch_connected'),
      strava: !!localStorage.getItem('strava_access_token'),
      amazfit: !!localStorage.getItem('amazfit_device_name'),
      instagram: !!localStorage.getItem('running_trainer_instagram_connected'),
      facebook: !!localStorage.getItem('running_trainer_facebook_connected')
    };
  }

  // Obter informações do dispositivo Amazfit conectado
  getAmazfitInfo(): { name: string; lastSync: Date | null } | null {
    const deviceName = localStorage.getItem('amazfit_device_name');
    const lastSyncStr = localStorage.getItem('zepp_last_sync');
    
    if (!deviceName) return null;
    
    return {
      name: deviceName,
      lastSync: lastSyncStr ? new Date(lastSyncStr) : null
    };
  }
}

export const fitnessIntegration = new FitnessIntegration();
import { Position } from '../types';

export interface GPSOptions {
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
  distanceFilter: number; // Filtro de distância mínima em metros
}

export interface GPSState {
  isTracking: boolean;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  altitude: number | null;
  lastUpdate: Date | null;
  totalDistance: number;
  isGPSEnabled: boolean;
  signalStrength: 'poor' | 'fair' | 'good' | 'excellent';
}

export interface GPSStats {
  averageAccuracy: number;
  maxSpeed: number;
  totalElevationGain: number;
  validPositions: number;
  filteredPositions: number;
}

export class GPSTracker {
  private watchId: number | null = null;
  private positions: Position[] = [];
  private rawPositions: Position[] = [];
  private callbacks: {
    onPositionUpdate?: (position: Position, state: GPSState) => void;
    onError?: (error: GeolocationPositionError) => void;
    onStateChange?: (state: GPSState) => void;
    onDistanceUpdate?: (distance: number) => void;
  } = {};
  
  private state: GPSState = {
    isTracking: false,
    accuracy: 0,
    speed: null,
    heading: null,
    altitude: null,
    lastUpdate: null,
    totalDistance: 0,
    isGPSEnabled: false,
    signalStrength: 'poor'
  };

  private options: GPSOptions = {
    enableHighAccuracy: true,
    timeout: 15000, // 15 segundos
    maximumAge: 2000, // 2 segundos
    distanceFilter: 3 // Mínimo 3 metros de movimento
  };

  private lastValidPosition: Position | null = null;
  private kalmanFilter: KalmanFilter;
  private isInitialized = false;

  constructor(callbacks?: {
    onPositionUpdate?: (position: Position, state: GPSState) => void;
    onError?: (error: GeolocationPositionError) => void;
    onStateChange?: (state: GPSState) => void;
    onDistanceUpdate?: (distance: number) => void;
  }) {
    this.callbacks = callbacks || {};
    this.kalmanFilter = new KalmanFilter();
    this.checkGPSAvailability();
  }

  private async checkGPSAvailability(): Promise<void> {
    if (!navigator.geolocation) {
      console.error('Geolocalização não suportada neste dispositivo');
      this.state.isGPSEnabled = false;
      return;
    }

    try {
      // Verificar permissões
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      this.state.isGPSEnabled = permission.state !== 'denied';
      
      // Monitorar mudanças de permissão
      permission.addEventListener('change', () => {
        this.state.isGPSEnabled = permission.state !== 'denied';
        this.callbacks.onStateChange?.(this.state);
      });
    } catch (error) {
      console.warn('Não foi possível verificar permissões de GPS:', error);
      this.state.isGPSEnabled = true; // Assumir que está disponível
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!navigator.geolocation) {
      console.error('Geolocalização não suportada');
      return false;
    }

    try {
      // Solicitar posição atual para testar permissões
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve, 
          reject, 
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 5000
          }
        );
      });

      console.log('Permissão de GPS concedida. Precisão inicial:', position.coords.accuracy, 'm');
      this.state.isGPSEnabled = true;
      return true;
    } catch (error) {
      console.error('Erro ao solicitar permissão de GPS:', error);
      this.handlePermissionError(error as GeolocationPositionError);
      return false;
    }
  }

  private handlePermissionError(error: GeolocationPositionError): void {
    let message = '';
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = 'Permissão de localização negada. Ative o GPS nas configurações do navegador.';
        break;
      case error.POSITION_UNAVAILABLE:
        message = 'Localização indisponível. Verifique se o GPS está ativado no dispositivo.';
        break;
      case error.TIMEOUT:
        message = 'Tempo limite para obter localização. Tente novamente.';
        break;
      default:
        message = 'Erro desconhecido ao acessar GPS.';
    }
    
    // Mostrar notificação para o usuário
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Erro de GPS', { body: message });
    } else {
      alert(message);
    }
  }

  startTracking(): boolean {
    if (!navigator.geolocation) {
      console.error('Geolocalização não suportada');
      return false;
    }

    if (this.watchId !== null) {
      console.warn('Tracking já está ativo');
      return true;
    }

    if (!this.state.isGPSEnabled) {
      console.error('GPS não está habilitado');
      return false;
    }

    console.log('Iniciando rastreamento GPS com alta precisão...');
    
    this.state.isTracking = true;
    this.isInitialized = false;
    this.callbacks.onStateChange?.(this.state);

    // Configurações otimizadas para celular
    const watchOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: this.options.timeout,
      maximumAge: this.options.maximumAge
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.handlePositionUpdate(position),
      (error) => this.handleError(error),
      watchOptions
    );

    // Também solicitar posição atual imediatamente
    navigator.geolocation.getCurrentPosition(
      (position) => this.handlePositionUpdate(position),
      (error) => console.warn('Erro ao obter posição inicial:', error),
      { ...watchOptions, timeout: 5000 }
    );

    return true;
  }

  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      console.log('Rastreamento GPS interrompido');
    }
    
    this.state.isTracking = false;
    this.callbacks.onStateChange?.(this.state);
  }

  private handlePositionUpdate(position: GeolocationPosition): void {
    const timestamp = Date.now();
    const newPosition: Position = {
      coords: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        heading: position.coords.heading,
        speed: position.coords.speed
      },
      timestamp: timestamp
    };

    // Armazenar posição bruta para análise
    this.rawPositions.push(newPosition);
    if (this.rawPositions.length > 200) {
      this.rawPositions = this.rawPositions.slice(-200);
    }

    // Aplicar filtros de qualidade
    if (!this.isValidPosition(newPosition)) {
      console.warn('Posição rejeitada pelos filtros de qualidade');
      return;
    }

    // Aplicar filtro Kalman para suavizar dados
    const filteredPosition = this.kalmanFilter.filter(newPosition);

    // Verificar movimento mínimo
    if (this.lastValidPosition && !this.isInitialized) {
      const distance = this.haversineDistance(
        this.lastValidPosition.coords,
        filteredPosition.coords
      );
      
      if (distance < this.options.distanceFilter / 1000) {
        // Movimento muito pequeno, ignorar
        return;
      }
    }

    // Primeira posição válida
    if (!this.isInitialized) {
      this.isInitialized = true;
      console.log('GPS inicializado com sucesso. Precisão:', position.coords.accuracy, 'm');
    }

    // Adicionar à lista de posições válidas
    this.positions.push(filteredPosition);
    if (this.positions.length > 1000) {
      this.positions = this.positions.slice(-1000);
    }

    // Calcular distância total
    if (this.lastValidPosition) {
      const segmentDistance = this.haversineDistance(
        this.lastValidPosition.coords,
        filteredPosition.coords
      );
      this.state.totalDistance += segmentDistance;
      this.callbacks.onDistanceUpdate?.(this.state.totalDistance);
    }

    this.lastValidPosition = filteredPosition;

    // Atualizar estado
    this.updateState(filteredPosition);

    // Notificar callbacks
    this.callbacks.onPositionUpdate?.(filteredPosition, this.state);
  }

  private isValidPosition(position: Position): boolean {
    // Filtro de precisão - rejeitar posições com precisão muito baixa
    if (position.coords.accuracy > 50) {
      return false;
    }

    // Filtro de velocidade - rejeitar velocidades irreais para corrida
    if (position.coords.speed && position.coords.speed > 20) { // 72 km/h
      return false;
    }

    // Filtro de coordenadas válidas
    if (Math.abs(position.coords.latitude) > 90 || Math.abs(position.coords.longitude) > 180) {
      return false;
    }

    // Filtro de salto de posição (teleporte)
    if (this.lastValidPosition) {
      const distance = this.haversineDistance(
        this.lastValidPosition.coords,
        position.coords
      );
      const timeDiff = (position.timestamp - this.lastValidPosition.timestamp) / 1000; // segundos
      
      if (timeDiff > 0) {
        const impliedSpeed = (distance * 1000) / timeDiff; // m/s
        if (impliedSpeed > 25) { // 90 km/h - velocidade impossível para corrida
          console.warn(`Salto de posição detectado: ${impliedSpeed.toFixed(1)} m/s`);
          return false;
        }
      }
    }

    return true;
  }

  private updateState(position: Position): void {
    this.state.accuracy = position.coords.accuracy;
    this.state.speed = position.coords.speed;
    this.state.heading = position.coords.heading;
    this.state.altitude = position.coords.altitude;
    this.state.lastUpdate = new Date();
    
    // Determinar força do sinal baseado na precisão
    if (position.coords.accuracy <= 5) {
      this.state.signalStrength = 'excellent';
    } else if (position.coords.accuracy <= 10) {
      this.state.signalStrength = 'good';
    } else if (position.coords.accuracy <= 20) {
      this.state.signalStrength = 'fair';
    } else {
      this.state.signalStrength = 'poor';
    }

    this.callbacks.onStateChange?.(this.state);
  }

  private handleError(error: GeolocationPositionError): void {
    console.error('Erro de GPS:', error);
    
    // Tentar recuperar automaticamente
    if (error.code === error.TIMEOUT && this.state.isTracking) {
      console.log('Timeout de GPS, tentando reconectar...');
      setTimeout(() => {
        if (this.state.isTracking) {
          this.stopTracking();
          this.startTracking();
        }
      }, 2000);
    }

    this.callbacks.onError?.(error);
  }

  getDistance(): number {
    return this.state.totalDistance;
  }

  getCurrentSpeed(): number {
    return this.state.speed || 0;
  }

  getAverageSpeed(): number {
    const speeds = this.positions
      .map(p => p.coords.speed)
      .filter(speed => speed !== null && speed !== undefined && speed > 0) as number[];
    
    if (speeds.length === 0) return 0;
    return speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;
  }

  getMaxSpeed(): number {
    const speeds = this.positions
      .map(p => p.coords.speed)
      .filter(speed => speed !== null && speed !== undefined) as number[];
    
    return speeds.length > 0 ? Math.max(...speeds) : 0;
  }

  getElevationGain(): number {
    if (this.positions.length < 2) return 0;

    let totalGain = 0;
    for (let i = 1; i < this.positions.length; i++) {
      const prev = this.positions[i - 1].coords.altitude;
      const curr = this.positions[i].coords.altitude;
      
      if (prev !== null && curr !== null && curr > prev) {
        totalGain += curr - prev;
      }
    }

    return totalGain;
  }

  getGPSStats(): GPSStats {
    const accuracies = this.positions.map(p => p.coords.accuracy);
    
    return {
      averageAccuracy: accuracies.length > 0 ? 
        accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length : 0,
      maxSpeed: this.getMaxSpeed(),
      totalElevationGain: this.getElevationGain(),
      validPositions: this.positions.length,
      filteredPositions: this.rawPositions.length - this.positions.length
    };
  }

  private haversineDistance(
    pos1: { latitude: number; longitude: number },
    pos2: { latitude: number; longitude: number }
  ): number {
    const R = 6371e3; // Raio da Terra em metros
    const φ1 = (pos1.latitude * Math.PI) / 180;
    const φ2 = (pos2.latitude * Math.PI) / 180;
    const Δφ = ((pos2.latitude - pos1.latitude) * Math.PI) / 180;
    const Δλ = ((pos2.longitude - pos1.longitude) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return (R * c) / 1000; // Retorna em quilômetros
  }

  reset(): void {
    this.positions = [];
    this.rawPositions = [];
    this.lastValidPosition = null;
    this.isInitialized = false;
    this.kalmanFilter.reset();
    this.state = {
      isTracking: false,
      accuracy: 0,
      speed: null,
      heading: null,
      altitude: null,
      lastUpdate: null,
      totalDistance: 0,
      isGPSEnabled: this.state.isGPSEnabled,
      signalStrength: 'poor'
    };
  }

  getState(): GPSState {
    return { ...this.state };
  }

  getPositions(): Position[] {
    return [...this.positions];
  }

  getRawPositions(): Position[] {
    return [...this.rawPositions];
  }

  // Exportar dados para análise
  exportTrackingData(): any {
    return {
      positions: this.positions,
      rawPositions: this.rawPositions,
      stats: this.getGPSStats(),
      state: this.state,
      options: this.options
    };
  }
}

// Filtro Kalman simples para suavizar dados de GPS
class KalmanFilter {
  private Q = 1e-3; // Ruído do processo
  private R = 1e-2; // Ruído da medição
  private P = 1; // Covariância do erro
  private X = 0; // Estado estimado
  private K = 0; // Ganho de Kalman

  private latFilter = { Q: 1e-5, R: 1e-3, P: 1, X: 0, K: 0 };
  private lonFilter = { Q: 1e-5, R: 1e-3, P: 1, X: 0, K: 0 };
  private initialized = false;

  filter(position: Position): Position {
    if (!this.initialized) {
      this.latFilter.X = position.coords.latitude;
      this.lonFilter.X = position.coords.longitude;
      this.initialized = true;
      return position;
    }

    // Filtrar latitude
    const filteredLat = this.filterValue(
      position.coords.latitude,
      this.latFilter,
      position.coords.accuracy
    );

    // Filtrar longitude
    const filteredLon = this.filterValue(
      position.coords.longitude,
      this.lonFilter,
      position.coords.accuracy
    );

    return {
      ...position,
      coords: {
        ...position.coords,
        latitude: filteredLat,
        longitude: filteredLon
      }
    };
  }

  private filterValue(measurement: number, filter: any, accuracy: number): number {
    // Ajustar R baseado na precisão do GPS
    filter.R = Math.max(1e-5, accuracy / 100000);

    // Predição
    filter.P += filter.Q;

    // Atualização
    filter.K = filter.P / (filter.P + filter.R);
    filter.X += filter.K * (measurement - filter.X);
    filter.P *= (1 - filter.K);

    return filter.X;
  }

  reset(): void {
    this.initialized = false;
    this.latFilter = { Q: 1e-5, R: 1e-3, P: 1, X: 0, K: 0 };
    this.lonFilter = { Q: 1e-5, R: 1e-3, P: 1, X: 0, K: 0 };
  }
}
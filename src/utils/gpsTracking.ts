import { Position } from '../types';

export interface GPSOptions {
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
}

export interface GPSState {
  isTracking: boolean;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  altitude: number | null;
  lastUpdate: Date | null;
}

export class GPSTracker {
  private watchId: number | null = null;
  private positions: Position[] = [];
  private callbacks: {
    onPositionUpdate?: (position: Position, state: GPSState) => void;
    onError?: (error: GeolocationPositionError) => void;
    onStateChange?: (state: GPSState) => void;
  } = {};
  
  private state: GPSState = {
    isTracking: false,
    accuracy: 0,
    speed: null,
    heading: null,
    altitude: null,
    lastUpdate: null
  };

  private options: GPSOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 1000
  };

  constructor(callbacks?: {
    onPositionUpdate?: (position: Position, state: GPSState) => void;
    onError?: (error: GeolocationPositionError) => void;
    onStateChange?: (state: GPSState) => void;
  }) {
    this.callbacks = callbacks || {};
  }

  async requestPermission(): Promise<boolean> {
    if (!navigator.geolocation) {
      console.error('Geolocalização não suportada');
      return false;
    }

    try {
      // Testar se temos permissão fazendo uma requisição única
      await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 60000
        });
      });
      return true;
    } catch (error) {
      console.error('Erro ao solicitar permissão de localização:', error);
      return false;
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

    this.state.isTracking = true;
    this.callbacks.onStateChange?.(this.state);

    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.handlePositionUpdate(position),
      (error) => this.handleError(error),
      this.options
    );

    return true;
  }

  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    
    this.state.isTracking = false;
    this.callbacks.onStateChange?.(this.state);
  }

  private handlePositionUpdate(position: GeolocationPosition): void {
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
      timestamp: position.timestamp
    };

    // Filtrar posições com baixa precisão (acima de 50 metros)
    if (position.coords.accuracy > 50) {
      console.warn(`Posição ignorada - baixa precisão: ${position.coords.accuracy}m`);
      return;
    }

    // Filtrar velocidades irreais (acima de 50 km/h para corrida)
    if (position.coords.speed && position.coords.speed > 13.89) { // 50 km/h em m/s
      console.warn(`Velocidade irreal detectada: ${position.coords.speed * 3.6} km/h`);
      return;
    }

    this.positions.push(newPosition);
    
    // Manter apenas as últimas 100 posições para performance
    if (this.positions.length > 100) {
      this.positions = this.positions.slice(-100);
    }

    this.state = {
      ...this.state,
      accuracy: position.coords.accuracy,
      speed: position.coords.speed,
      heading: position.coords.heading,
      altitude: position.coords.altitude,
      lastUpdate: new Date()
    };

    this.callbacks.onPositionUpdate?.(newPosition, this.state);
  }

  private handleError(error: GeolocationPositionError): void {
    console.error('Erro de GPS:', error);
    this.callbacks.onError?.(error);
  }

  getDistance(): number {
    if (this.positions.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 1; i < this.positions.length; i++) {
      const dist = this.haversineDistance(
        this.positions[i - 1].coords,
        this.positions[i].coords
      );
      totalDistance += dist;
    }

    return totalDistance;
  }

  getCurrentSpeed(): number {
    return this.state.speed || 0;
  }

  getAverageSpeed(): number {
    const speeds = this.positions
      .map(p => p.coords.speed)
      .filter(speed => speed !== null && speed !== undefined) as number[];
    
    if (speeds.length === 0) return 0;
    return speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;
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
    this.state = {
      isTracking: false,
      accuracy: 0,
      speed: null,
      heading: null,
      altitude: null,
      lastUpdate: null
    };
  }

  getState(): GPSState {
    return { ...this.state };
  }

  getPositions(): Position[] {
    return [...this.positions];
  }
}
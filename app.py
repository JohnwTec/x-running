from flask import Flask, render_template, request, jsonify, session
from flask_socketio import SocketIO, emit
import json
import math
import time
from datetime import datetime, timedelta
import uuid
import sqlite3
import os
from typing import Dict, List, Optional, Tuple
import threading

app = Flask(__name__)
app.config['SECRET_KEY'] = 'running_trainer_secret_key'
socketio = SocketIO(app, cors_allowed_origins="*")

# Configuração do banco de dados SQLite
DATABASE = 'running_trainer.db'

class GPSTracker:
    def __init__(self):
        self.positions = []
        self.raw_positions = []
        self.is_tracking = False
        self.total_distance = 0.0
        self.last_position = None
        self.kalman_filter = KalmanFilter()
        self.start_time = None
        
    def add_position(self, lat: float, lon: float, accuracy: float, speed: Optional[float] = None, 
                    altitude: Optional[float] = None, heading: Optional[float] = None) -> Dict:
        """Adiciona uma nova posição e processa os dados"""
        timestamp = time.time()
        
        position = {
            'latitude': lat,
            'longitude': lon,
            'accuracy': accuracy,
            'speed': speed,
            'altitude': altitude,
            'heading': heading,
            'timestamp': timestamp
        }
        
        # Armazenar posição bruta
        self.raw_positions.append(position)
        
        # Aplicar filtros de qualidade
        if not self._is_valid_position(position):
            return {'status': 'filtered', 'reason': 'quality_filter'}
        
        # Aplicar filtro Kalman
        filtered_position = self.kalman_filter.filter(position)
        
        # Verificar movimento mínimo
        if self.last_position and self._calculate_distance(self.last_position, filtered_position) < 0.003:  # 3 metros
            return {'status': 'filtered', 'reason': 'minimum_movement'}
        
        # Adicionar à lista de posições válidas
        self.positions.append(filtered_position)
        
        # Calcular distância
        if self.last_position:
            segment_distance = self._calculate_distance(self.last_position, filtered_position)
            self.total_distance += segment_distance
        
        self.last_position = filtered_position
        
        return {
            'status': 'accepted',
            'position': filtered_position,
            'total_distance': self.total_distance,
            'signal_strength': self._get_signal_strength(accuracy)
        }
    
    def _is_valid_position(self, position: Dict) -> bool:
        """Aplica filtros de qualidade na posição"""
        # Filtro de precisão
        if position['accuracy'] > 50:
            return False
        
        # Filtro de velocidade (máximo 72 km/h)
        if position['speed'] and position['speed'] > 20:
            return False
        
        # Filtro de coordenadas válidas
        if abs(position['latitude']) > 90 or abs(position['longitude']) > 180:
            return False
        
        # Filtro de salto de posição
        if self.last_position:
            distance = self._calculate_distance(self.last_position, position)
            time_diff = position['timestamp'] - self.last_position['timestamp']
            
            if time_diff > 0:
                implied_speed = (distance * 1000) / time_diff  # m/s
                if implied_speed > 25:  # 90 km/h
                    return False
        
        return True
    
    def _calculate_distance(self, pos1: Dict, pos2: Dict) -> float:
        """Calcula distância entre duas posições usando fórmula de Haversine"""
        R = 6371  # Raio da Terra em km
        
        lat1_rad = math.radians(pos1['latitude'])
        lat2_rad = math.radians(pos2['latitude'])
        delta_lat = math.radians(pos2['latitude'] - pos1['latitude'])
        delta_lon = math.radians(pos2['longitude'] - pos1['longitude'])
        
        a = (math.sin(delta_lat / 2) ** 2 + 
             math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return R * c
    
    def _get_signal_strength(self, accuracy: float) -> str:
        """Determina a força do sinal baseado na precisão"""
        if accuracy <= 5:
            return 'excellent'
        elif accuracy <= 10:
            return 'good'
        elif accuracy <= 20:
            return 'fair'
        else:
            return 'poor'
    
    def get_stats(self) -> Dict:
        """Retorna estatísticas do rastreamento"""
        if not self.positions:
            return {
                'total_distance': 0,
                'average_accuracy': 0,
                'max_speed': 0,
                'valid_positions': 0,
                'filtered_positions': 0
            }
        
        accuracies = [p['accuracy'] for p in self.positions]
        speeds = [p['speed'] for p in self.positions if p['speed'] is not None]
        
        return {
            'total_distance': self.total_distance,
            'average_accuracy': sum(accuracies) / len(accuracies),
            'max_speed': max(speeds) if speeds else 0,
            'valid_positions': len(self.positions),
            'filtered_positions': len(self.raw_positions) - len(self.positions)
        }
    
    def reset(self):
        """Reseta todos os dados do rastreamento"""
        self.positions = []
        self.raw_positions = []
        self.total_distance = 0.0
        self.last_position = None
        self.kalman_filter.reset()
        self.start_time = None

class KalmanFilter:
    """Filtro Kalman simples para suavizar dados de GPS"""
    
    def __init__(self):
        self.Q = 1e-5  # Ruído do processo
        self.R = 1e-3  # Ruído da medição
        self.lat_filter = {'Q': 1e-5, 'R': 1e-3, 'P': 1, 'X': 0, 'K': 0}
        self.lon_filter = {'Q': 1e-5, 'R': 1e-3, 'P': 1, 'X': 0, 'K': 0}
        self.initialized = False
    
    def filter(self, position: Dict) -> Dict:
        """Aplica filtro Kalman na posição"""
        if not self.initialized:
            self.lat_filter['X'] = position['latitude']
            self.lon_filter['X'] = position['longitude']
            self.initialized = True
            return position
        
        # Filtrar latitude
        filtered_lat = self._filter_value(
            position['latitude'], 
            self.lat_filter, 
            position['accuracy']
        )
        
        # Filtrar longitude
        filtered_lon = self._filter_value(
            position['longitude'], 
            self.lon_filter, 
            position['accuracy']
        )
        
        filtered_position = position.copy()
        filtered_position['latitude'] = filtered_lat
        filtered_position['longitude'] = filtered_lon
        
        return filtered_position
    
    def _filter_value(self, measurement: float, filter_state: Dict, accuracy: float) -> float:
        """Aplica filtro Kalman em um valor"""
        # Ajustar R baseado na precisão do GPS
        filter_state['R'] = max(1e-5, accuracy / 100000)
        
        # Predição
        filter_state['P'] += filter_state['Q']
        
        # Atualização
        filter_state['K'] = filter_state['P'] / (filter_state['P'] + filter_state['R'])
        filter_state['X'] += filter_state['K'] * (measurement - filter_state['X'])
        filter_state['P'] *= (1 - filter_state['K'])
        
        return filter_state['X']
    
    def reset(self):
        """Reseta o filtro"""
        self.initialized = False
        self.lat_filter = {'Q': 1e-5, 'R': 1e-3, 'P': 1, 'X': 0, 'K': 0}
        self.lon_filter = {'Q': 1e-5, 'R': 1e-3, 'P': 1, 'X': 0, 'K': 0}

class TrainingManager:
    def __init__(self):
        self.active_sessions = {}
        self.init_database()
    
    def init_database(self):
        """Inicializa o banco de dados SQLite"""
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Tabela de usuários
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                age INTEGER NOT NULL,
                weight REAL NOT NULL,
                height REAL NOT NULL,
                level TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Tabela de metas
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS goals (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                distance REAL NOT NULL,
                months INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # Tabela de treinos
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS trainings (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                type TEXT NOT NULL,
                distance REAL NOT NULL,
                duration INTEGER NOT NULL,
                pace REAL NOT NULL,
                gps_data TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # Tabela de conquistas
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS achievements (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                icon TEXT NOT NULL,
                unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def create_user(self, name: str, age: int, weight: float, height: float, level: str) -> str:
        """Cria um novo usuário"""
        user_id = str(uuid.uuid4())
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO users (id, name, age, weight, height, level)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (user_id, name, age, weight, height, level))
        
        conn.commit()
        conn.close()
        
        return user_id
    
    def save_training(self, user_id: str, training_type: str, distance: float, 
                     duration: int, pace: float, gps_data: List[Dict]) -> str:
        """Salva um treino no banco de dados"""
        training_id = str(uuid.uuid4())
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO trainings (id, user_id, type, distance, duration, pace, gps_data)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (training_id, user_id, training_type, distance, duration, pace, json.dumps(gps_data)))
        
        conn.commit()
        conn.close()
        
        # Verificar conquistas
        self._check_achievements(user_id)
        
        return training_id
    
    def _check_achievements(self, user_id: str):
        """Verifica e desbloqueia conquistas"""
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Calcular estatísticas totais
        cursor.execute('''
            SELECT SUM(distance), COUNT(*), MIN(pace)
            FROM trainings WHERE user_id = ?
        ''', (user_id,))
        
        result = cursor.fetchone()
        total_distance = result[0] or 0
        total_trainings = result[1] or 0
        best_pace = result[2] or 999
        
        # Conquistas de distância
        achievements_to_unlock = []
        
        if total_distance >= 10:
            achievements_to_unlock.append(('total_10km', 'Primeiros 10km', 'Completou 10km totais', '🏃'))
        if total_distance >= 50:
            achievements_to_unlock.append(('total_50km', 'Meio Centenário', 'Completou 50km totais', '🎯'))
        if total_distance >= 100:
            achievements_to_unlock.append(('total_100km', 'Centenário', 'Completou 100km totais', '💯'))
        
        # Conquistas de pace
        if best_pace <= 6:
            achievements_to_unlock.append(('pace_6min', 'Corredor Rápido', 'Pace abaixo de 6 min/km', '💨'))
        
        # Inserir conquistas que ainda não foram desbloqueadas
        for achievement_id, name, description, icon in achievements_to_unlock:
            cursor.execute('''
                SELECT COUNT(*) FROM achievements 
                WHERE user_id = ? AND name = ?
            ''', (user_id, name))
            
            if cursor.fetchone()[0] == 0:
                cursor.execute('''
                    INSERT INTO achievements (id, user_id, name, description, icon)
                    VALUES (?, ?, ?, ?, ?)
                ''', (str(uuid.uuid4()), user_id, name, description, icon))
        
        conn.commit()
        conn.close()

# Instância global do gerenciador de treinos
training_manager = TrainingManager()

@app.route('/')
def index():
    """Página principal"""
    return render_template('index.html')

@app.route('/api/user', methods=['POST'])
def create_user():
    """Cria um novo usuário"""
    data = request.json
    
    user_id = training_manager.create_user(
        name=data['name'],
        age=data['age'],
        weight=data['weight'],
        height=data['height'],
        level=data['level']
    )
    
    session['user_id'] = user_id
    
    return jsonify({'user_id': user_id, 'status': 'success'})

@app.route('/api/training/start', methods=['POST'])
def start_training():
    """Inicia uma sessão de treino"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'User not authenticated'}), 401
    
    data = request.json
    training_type = data.get('type', 'longa')
    
    # Criar nova sessão de treino
    session_id = str(uuid.uuid4())
    training_manager.active_sessions[session_id] = {
        'user_id': user_id,
        'type': training_type,
        'gps_tracker': GPSTracker(),
        'start_time': time.time(),
        'is_active': True
    }
    
    session['training_session_id'] = session_id
    
    return jsonify({
        'session_id': session_id,
        'status': 'started',
        'type': training_type
    })

@app.route('/api/training/stop', methods=['POST'])
def stop_training():
    """Para uma sessão de treino"""
    session_id = session.get('training_session_id')
    if not session_id or session_id not in training_manager.active_sessions:
        return jsonify({'error': 'No active training session'}), 400
    
    training_session = training_manager.active_sessions[session_id]
    gps_tracker = training_session['gps_tracker']
    
    # Calcular estatísticas finais
    duration = int(time.time() - training_session['start_time'])
    distance = gps_tracker.total_distance
    pace = (duration / 60) / distance if distance > 0 else 0
    
    # Salvar treino
    training_id = training_manager.save_training(
        user_id=training_session['user_id'],
        training_type=training_session['type'],
        distance=distance,
        duration=duration,
        pace=pace,
        gps_data=gps_tracker.positions
    )
    
    # Limpar sessão
    del training_manager.active_sessions[session_id]
    session.pop('training_session_id', None)
    
    return jsonify({
        'training_id': training_id,
        'distance': distance,
        'duration': duration,
        'pace': pace,
        'status': 'completed'
    })

@socketio.on('gps_position')
def handle_gps_position(data):
    """Recebe dados de GPS em tempo real"""
    session_id = session.get('training_session_id')
    if not session_id or session_id not in training_manager.active_sessions:
        emit('error', {'message': 'No active training session'})
        return
    
    training_session = training_manager.active_sessions[session_id]
    gps_tracker = training_session['gps_tracker']
    
    # Processar posição GPS
    result = gps_tracker.add_position(
        lat=data['latitude'],
        lon=data['longitude'],
        accuracy=data['accuracy'],
        speed=data.get('speed'),
        altitude=data.get('altitude'),
        heading=data.get('heading')
    )
    
    if result['status'] == 'accepted':
        # Calcular estatísticas em tempo real
        duration = int(time.time() - training_session['start_time'])
        distance = result['total_distance']
        pace = (duration / 60) / distance if distance > 0 else 0
        current_speed = data.get('speed', 0) * 3.6 if data.get('speed') else 0  # km/h
        
        # Enviar atualização para o cliente
        emit('training_update', {
            'distance': distance,
            'duration': duration,
            'pace': pace,
            'current_speed': current_speed,
            'signal_strength': result['signal_strength'],
            'accuracy': data['accuracy'],
            'total_positions': len(gps_tracker.positions)
        })

@socketio.on('calibrate_gps')
def handle_gps_calibration(data):
    """Processa calibração de GPS"""
    emit('calibration_update', {
        'accuracy': data['accuracy'],
        'signal_strength': 'excellent' if data['accuracy'] <= 5 else 
                          'good' if data['accuracy'] <= 10 else
                          'fair' if data['accuracy'] <= 20 else 'poor',
        'status': 'calibrating'
    })

@app.route('/api/stats/<user_id>')
def get_user_stats(user_id):
    """Retorna estatísticas do usuário"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Estatísticas gerais
    cursor.execute('''
        SELECT 
            COUNT(*) as total_trainings,
            SUM(distance) as total_distance,
            SUM(duration) as total_duration,
            AVG(pace) as avg_pace,
            MIN(pace) as best_pace
        FROM trainings WHERE user_id = ?
    ''', (user_id,))
    
    stats = cursor.fetchone()
    
    # Conquistas
    cursor.execute('''
        SELECT name, description, icon, unlocked_at
        FROM achievements WHERE user_id = ?
        ORDER BY unlocked_at DESC
    ''', (user_id,))
    
    achievements = cursor.fetchall()
    
    conn.close()
    
    return jsonify({
        'total_trainings': stats[0] or 0,
        'total_distance': stats[1] or 0,
        'total_duration': stats[2] or 0,
        'avg_pace': stats[3] or 0,
        'best_pace': stats[4] or 0,
        'achievements': [
            {
                'name': a[0],
                'description': a[1],
                'icon': a[2],
                'unlocked_at': a[3]
            } for a in achievements
        ]
    })

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
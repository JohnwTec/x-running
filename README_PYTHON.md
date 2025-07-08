# 🏃‍♂️ Treinador de Corrida - Versão Python

Sistema completo de treinamento de corrida com GPS de alta precisão, desenvolvido em Python com Flask e WebSockets.

## 🚀 Características Principais

### 📍 **Sistema GPS Avançado**
- **Filtro Kalman** para suavização de dados GPS
- **Filtros de qualidade** que rejeitam posições imprecisas
- **Detecção de saltos** para evitar "teleportes"
- **Calibração automática** para melhor precisão
- **Comunicação em tempo real** via WebSockets

### 🎯 **Funcionalidades**
- ✅ Rastreamento GPS em tempo real
- ✅ Cálculo preciso de distância (Haversine)
- ✅ Monitoramento de velocidade e pace
- ✅ Sistema de conquistas
- ✅ Banco de dados SQLite
- ✅ Interface web responsiva
- ✅ Calibração de GPS
- ✅ Filtros anti-ruído

## 🛠️ Instalação e Execução

### **1. Instalar Dependências**
```bash
pip install -r requirements.txt
```

### **2. Executar o Servidor**
```bash
python run.py
```

### **3. Acessar o App**
- **Computador**: http://localhost:5000
- **Celular**: http://[SEU_IP]:5000

## 📱 Como Usar

### **1. Criar Perfil**
- Preencha nome, idade, peso, altura e nível
- Clique em "Criar Perfil"

### **2. Calibrar GPS**
- Clique em "Calibrar GPS"
- Vá para área aberta (sem prédios)
- Aguarde calibração automática

### **3. Iniciar Treino**
- Escolha tipo de treino
- Clique em "Iniciar Treino"
- GPS será ativado automaticamente

### **4. Durante o Treino**
- Acompanhe estatísticas em tempo real
- Monitor de qualidade GPS
- Dados salvos automaticamente

## 🧠 Algoritmos Implementados

### **Filtro Kalman**
```python
def filter(self, position):
    # Predição
    filter_state['P'] += filter_state['Q']
    
    # Atualização
    filter_state['K'] = filter_state['P'] / (filter_state['P'] + filter_state['R'])
    filter_state['X'] += filter_state['K'] * (measurement - filter_state['X'])
    filter_state['P'] *= (1 - filter_state['K'])
```

### **Cálculo de Distância (Haversine)**
```python
def _calculate_distance(self, pos1, pos2):
    R = 6371  # Raio da Terra em km
    
    lat1_rad = math.radians(pos1['latitude'])
    lat2_rad = math.radians(pos2['latitude'])
    delta_lat = math.radians(pos2['latitude'] - pos1['latitude'])
    delta_lon = math.radians(pos2['longitude'] - pos1['longitude'])
    
    a = (math.sin(delta_lat / 2) ** 2 + 
         math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c
```

### **Filtros de Qualidade**
- **Precisão**: Rejeita posições com erro > 50m
- **Velocidade**: Filtra velocidades > 72 km/h
- **Saltos**: Detecta teleportes impossíveis
- **Movimento mínimo**: Ignora movimentos < 3m

## 🗄️ Estrutura do Banco de Dados

### **Tabelas SQLite**
```sql
-- Usuários
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    weight REAL NOT NULL,
    height REAL NOT NULL,
    level TEXT NOT NULL
);

-- Treinos
CREATE TABLE trainings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    distance REAL NOT NULL,
    duration INTEGER NOT NULL,
    pace REAL NOT NULL,
    gps_data TEXT
);

-- Conquistas
CREATE TABLE achievements (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL
);
```

## 🌐 API Endpoints

### **REST API**
- `POST /api/user` - Criar usuário
- `POST /api/training/start` - Iniciar treino
- `POST /api/training/stop` - Finalizar treino
- `GET /api/stats/<user_id>` - Estatísticas

### **WebSocket Events**
- `gps_position` - Enviar posição GPS
- `training_update` - Receber atualizações
- `calibrate_gps` - Calibração GPS
- `calibration_update` - Status calibração

## 📊 Métricas de Precisão

### **Qualidade do Sinal GPS**
- 🟢 **Excelente**: ±0-5m
- 🟡 **Bom**: ±5-10m  
- 🟠 **Regular**: ±10-20m
- 🔴 **Fraco**: >±20m

### **Filtros Aplicados**
- ✅ Filtro de precisão (< 50m)
- ✅ Filtro de velocidade (< 72 km/h)
- ✅ Filtro de coordenadas válidas
- ✅ Filtro anti-salto (< 90 km/h implícita)
- ✅ Filtro movimento mínimo (> 3m)

## 🔧 Configurações Avançadas

### **Parâmetros do Filtro Kalman**
```python
self.Q = 1e-5  # Ruído do processo
self.R = 1e-3  # Ruído da medição
```

### **Configurações GPS**
```python
options = {
    'enableHighAccuracy': True,
    'timeout': 15000,
    'maximumAge': 2000
}
```

## 🎯 Vantagens da Versão Python

### **Performance**
- ⚡ Processamento server-side eficiente
- 🔄 WebSockets para tempo real
- 💾 SQLite para persistência rápida
- 🧮 Algoritmos otimizados

### **Precisão**
- 🎯 Filtro Kalman implementado
- 📍 Múltiplos filtros de qualidade
- 🛰️ Calibração automática
- 📊 Estatísticas detalhadas

### **Escalabilidade**
- 🌐 Servidor centralizado
- 👥 Múltiplos usuários simultâneos
- 📈 Banco de dados robusto
- 🔒 Sessões seguras

## 🚀 Próximos Passos

- [ ] Integração com PostgreSQL
- [ ] API REST completa
- [ ] Dashboard administrativo
- [ ] Análise de dados avançada
- [ ] Machine Learning para predições
- [ ] App mobile nativo

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique se o GPS está ativado
2. Use em área aberta para melhor sinal
3. Calibre o GPS antes dos treinos
4. Mantenha o celular desbloqueado

---

**🏃‍♂️ Desenvolvido com Python + Flask + SocketIO para máxima precisão GPS!**
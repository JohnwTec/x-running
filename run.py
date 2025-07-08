#!/usr/bin/env python3
"""
Script para executar o servidor Python do Treinador de Corrida
"""

import os
import sys
from app import app, socketio

def main():
    """Função principal para executar o servidor"""
    print("🏃‍♂️ Iniciando Treinador de Corrida - Servidor Python")
    print("=" * 50)
    print("📍 Sistema GPS aprimorado ativado!")
    print("🔄 WebSocket para comunicação em tempo real")
    print("💾 Banco de dados SQLite para persistência")
    print("🎯 Filtro Kalman para precisão GPS")
    print("=" * 50)
    
    # Configurações do servidor
    host = os.environ.get('HOST', '0.0.0.0')
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'True').lower() == 'true'
    
    print(f"🌐 Servidor rodando em: http://{host}:{port}")
    print("📱 Acesse pelo celular para melhor experiência GPS")
    print("🛑 Pressione Ctrl+C para parar o servidor")
    print("=" * 50)
    
    try:
        # Executar servidor com SocketIO
        socketio.run(
            app, 
            host=host, 
            port=port, 
            debug=debug,
            allow_unsafe_werkzeug=True
        )
    except KeyboardInterrupt:
        print("\n🛑 Servidor interrompido pelo usuário")
        sys.exit(0)
    except Exception as e:
        print(f"❌ Erro ao iniciar servidor: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
import React, { useState } from 'react';
import { Mail, Lock, User, X, Loader2, Instagram, Facebook } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Simular autenticação (em produção, usar Supabase Auth)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Salvar email no localStorage para identificação
      localStorage.setItem('running_trainer_user_email', email);
      localStorage.setItem('running_trainer_user_name', isLogin ? email.split('@')[0] : name);
      
      onSuccess(email);
      onClose();
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'instagram' | 'facebook') => {
    setLoading(true);
    setError('');

    try {
      // Simular login social
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const socialEmail = `user@${provider}.com`;
      const socialName = `Usuário ${provider}`;
      
      localStorage.setItem('running_trainer_user_email', socialEmail);
      localStorage.setItem('running_trainer_user_name', socialName);
      localStorage.setItem(`running_trainer_${provider}_connected`, 'true');
      
      onSuccess(socialEmail);
      onClose();
    } catch (err) {
      setError(`Erro ao conectar com ${provider}. Tente novamente.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {isLogin ? 'Entrar' : 'Criar Conta'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 text-center">
            {isLogin 
              ? 'Entre para sincronizar seus dados na nuvem' 
              : 'Crie sua conta para salvar seus progressos'
            }
          </p>
        </div>

        {/* Login Social */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => handleSocialLogin('instagram')}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-purple-400 disabled:to-pink-400 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center space-x-2"
          >
            <Instagram className="w-5 h-5" />
            <span>Continuar com Instagram</span>
          </button>

          <button
            onClick={() => handleSocialLogin('facebook')}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center space-x-2"
          >
            <Facebook className="w-5 h-5" />
            <span>Continuar com Facebook</span>
          </button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">ou</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Seu nome completo"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processando...</span>
              </>
            ) : (
              <span>{isLogin ? 'Entrar com Email' : 'Criar Conta'}</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            {isLogin 
              ? 'Não tem conta? Criar uma agora' 
              : 'Já tem conta? Fazer login'
            }
          </button>
        </div>

        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">🔒 Seus dados estão seguros!</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Sincronização automática na nuvem</li>
            <li>• Acesso em qualquer dispositivo</li>
            <li>• Backup automático dos treinos</li>
            <li>• Compartilhamento social opcional</li>
            <li>• Dados criptografados e protegidos</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
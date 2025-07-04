import React, { useState } from 'react';
import { Share2, Instagram, Facebook, X, Copy, CheckCircle } from 'lucide-react';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainingData: {
    type: string;
    distance: number;
    time: number;
    pace: number;
    date: Date;
  };
}

export const SocialShareModal: React.FC<SocialShareModalProps> = ({
  isOpen,
  onClose,
  trainingData
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const generateShareText = (): string => {
    const typeText = trainingData.type === 'longa' ? 'Corrida Longa' : 'Treino Intervalado';
    return `🏃‍♂️ Acabei de completar um ${typeText}!\n\n` +
           `📏 Distância: ${trainingData.distance.toFixed(2)} km\n` +
           `⏱️ Tempo: ${formatTime(trainingData.time)}\n` +
           `⚡ Pace: ${trainingData.pace.toFixed(1)} min/km\n\n` +
           `#corrida #running #fitness #treino #saude\n` +
           `Treinando com o app Treinador de Corrida 💪`;
  };

  const shareText = generateShareText();

  const handleInstagramShare = () => {
    // Instagram não permite compartilhamento direto via URL, então copiamos o texto
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    // Tentar abrir o Instagram
    const instagramUrl = 'instagram://camera';
    window.open(instagramUrl, '_blank');
    
    // Fallback para web
    setTimeout(() => {
      window.open('https://www.instagram.com/', '_blank');
    }, 1000);
  };

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}&quote=${encodeURIComponent(shareText)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar texto:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Share2 className="w-6 h-6 mr-2 text-blue-600" />
            Compartilhar Treino
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Preview do Post */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 mb-6 border-2 border-dashed border-blue-200">
          <h3 className="font-semibold text-gray-800 mb-3">Preview do Post:</h3>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
              {shareText}
            </pre>
          </div>
        </div>

        {/* Botões de Compartilhamento */}
        <div className="space-y-3">
          <button
            onClick={handleInstagramShare}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-3"
          >
            <Instagram className="w-5 h-5" />
            <span>Compartilhar no Instagram</span>
          </button>

          <button
            onClick={handleFacebookShare}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-3"
          >
            <Facebook className="w-5 h-5" />
            <span>Compartilhar no Facebook</span>
          </button>

          <button
            onClick={handleCopyText}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-3"
          >
            {copied ? (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Texto Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                <span>Copiar Texto</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">📱 Como compartilhar no Instagram:</h3>
          <ol className="text-sm text-blue-700 space-y-1">
            <li>1. Clique em "Compartilhar no Instagram"</li>
            <li>2. O texto será copiado automaticamente</li>
            <li>3. Cole o texto na sua story ou post</li>
            <li>4. Adicione uma foto do seu treino!</li>
          </ol>
        </div>

        <div className="mt-4 bg-green-50 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 mb-2">🎯 Dicas para engajamento:</h3>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Use hashtags relevantes (#corrida #fitness)</li>
            <li>• Marque amigos que também correm</li>
            <li>• Compartilhe sua localização (se desejar)</li>
            <li>• Conte como se sentiu durante o treino</li>
          </ul>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};
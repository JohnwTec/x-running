import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, CheckCircle, Clock, RotateCcw, ArrowLeft } from 'lucide-react';

interface Exercise {
  name: string;
  duration: number; // em segundos
  description: string;
  instructions: string[];
  tips: string[];
  image?: string;
}

interface WarmupSessionProps {
  onComplete: () => void;
  onBack?: () => void;
}

export const WarmupSession: React.FC<WarmupSessionProps> = ({ onComplete, onBack }) => {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const exercises: Exercise[] = [
    {
      name: "Trote Leve",
      duration: 300, // 5 minutos
      description: "Corrida em ritmo muito leve para ativar a circulação",
      instructions: [
        "Mantenha um ritmo bem confortável",
        "Respire naturalmente pelo nariz",
        "Passos curtos e cadência alta",
        "Mantenha os ombros relaxados"
      ],
      tips: [
        "Você deve conseguir conversar facilmente",
        "Se sentir falta de ar, diminua o ritmo",
        "Foque na postura ereta"
      ]
    },
    {
      name: "Elevação de Joelhos",
      duration: 30,
      description: "Ativa os flexores do quadril e melhora a coordenação",
      instructions: [
        "Fique em pé com os pés na largura dos ombros",
        "Eleve alternadamente os joelhos até a altura do quadril",
        "Mantenha o tronco ereto",
        "Use os braços em movimento de corrida"
      ],
      tips: [
        "Não se incline para trás",
        "Mantenha o core ativado",
        "Movimento controlado, não muito rápido"
      ]
    },
    {
      name: "Chutes para Trás (Calcanhar ao Glúteo)",
      duration: 30,
      description: "Aquece os músculos posteriores da coxa",
      instructions: [
        "Fique em pé e chute alternadamente os calcanhares em direção aos glúteos",
        "Mantenha os joelhos próximos",
        "Incline ligeiramente o tronco para frente",
        "Braços em movimento de corrida"
      ],
      tips: [
        "Não force se não conseguir tocar o glúteo",
        "Mantenha o equilíbrio",
        "Movimento fluido e controlado"
      ]
    },
    {
      name: "Agachamentos Dinâmicos",
      duration: 30,
      description: "Ativa glúteos, quadríceps e melhora a mobilidade do quadril",
      instructions: [
        "Pés na largura dos ombros",
        "Desça como se fosse sentar em uma cadeira",
        "Mantenha o peso nos calcanhares",
        "Suba explosivamente",
        "Braços para frente na descida, para trás na subida"
      ],
      tips: [
        "Joelhos não devem passar da linha dos pés",
        "Mantenha o peito erguido",
        "Desça até onde for confortável"
      ]
    },
    {
      name: "Passadas Laterais",
      duration: 30,
      description: "Ativa os músculos abdutores e melhora a estabilidade lateral",
      instructions: [
        "Dê um passo largo para o lado direito",
        "Flexione o joelho direito, mantendo o esquerdo estendido",
        "Retorne ao centro e repita para o lado esquerdo",
        "Mantenha o tronco ereto"
      ],
      tips: [
        "Não deixe o joelho cair para dentro",
        "Mantenha os pés paralelos",
        "Movimento lento e controlado"
      ]
    },
    {
      name: "Círculos com os Braços",
      duration: 20,
      description: "Aquece os ombros e melhora a mobilidade articular",
      instructions: [
        "Estenda os braços lateralmente",
        "Faça círculos pequenos para frente (10 segundos)",
        "Depois círculos pequenos para trás (10 segundos)",
        "Mantenha os movimentos controlados"
      ],
      tips: [
        "Comece com círculos pequenos",
        "Mantenha os ombros relaxados",
        "Não force o movimento"
      ]
    },
    {
      name: "Alongamento Dinâmico das Pernas",
      duration: 40,
      description: "Prepara os músculos das pernas para o esforço",
      instructions: [
        "Balanço frontal: segure em algo para apoio, balance a perna para frente e trás (10x cada perna)",
        "Balanço lateral: balance a perna de um lado para outro (10x cada perna)",
        "Movimento controlado e progressivo"
      ],
      tips: [
        "Não force o alongamento",
        "Aumente a amplitude gradualmente",
        "Mantenha o equilíbrio"
      ]
    }
  ];

  const currentExercise = exercises[currentExerciseIndex];
  const totalDuration = exercises.reduce((sum, ex) => sum + ex.duration, 0);
  const elapsedTotal = exercises.slice(0, currentExerciseIndex).reduce((sum, ex) => sum + ex.duration, 0) + timer;
  const progressPercentage = (elapsedTotal / totalDuration) * 100;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && !isCompleted) {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev + 1 >= currentExercise.duration) {
            // Exercício concluído
            if (currentExerciseIndex < exercises.length - 1) {
              setCurrentExerciseIndex(prev => prev + 1);
              return 0;
            } else {
              // Aquecimento completo
              setIsCompleted(true);
              setIsRunning(false);
              return prev;
            }
          }
          return prev + 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, currentExercise.duration, currentExerciseIndex, isCompleted]);

  const handleStart = () => {
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleSkip = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setTimer(0);
    } else {
      setIsCompleted(true);
      setIsRunning(false);
    }
  };

  const handleRestart = () => {
    setCurrentExerciseIndex(0);
    setTimer(0);
    setIsRunning(false);
    setIsCompleted(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          {onBack && (
            <div className="flex justify-start mb-4">
              <button
                onClick={onBack}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          )}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Aquecimento Completo!</h2>
          <p className="text-gray-600 mb-6">
            Excelente! Seu corpo está preparado para o treino principal.
          </p>
          <div className="space-y-3">
            <button
              onClick={onComplete}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg transition-all transform hover:scale-105"
            >
              Continuar para o Treino
            </button>
            <button
              onClick={handleRestart}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center space-x-2"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Repetir Aquecimento</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-between mb-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            )}
            <div className="flex-1 text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <RotateCcw className="w-8 h-8 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Aquecimento</h2>
              <p className="text-gray-600">Prepare seu corpo para o treino</p>
            </div>
            <div className="w-10"></div> {/* Spacer for alignment */}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progresso Geral</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Current Exercise */}
        <div className="bg-yellow-50 rounded-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">{currentExercise.name}</h3>
            <div className="flex items-center text-yellow-600">
              <Clock className="w-5 h-5 mr-1" />
              <span className="text-2xl font-bold">
                {formatTime(currentExercise.duration - timer)}
              </span>
            </div>
          </div>
          
          <p className="text-gray-700 mb-4">{currentExercise.description}</p>
          
          {/* Instructions */}
          <div className="mb-4">
            <h4 className="font-semibold text-gray-800 mb-2">Como fazer:</h4>
            <ul className="space-y-1">
              {currentExercise.instructions.map((instruction, index) => (
                <li key={index} className="flex items-start text-sm text-gray-700">
                  <span className="w-5 h-5 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs mr-2 mt-0.5 flex-shrink-0">
                    {index + 1}
                  </span>
                  {instruction}
                </li>
              ))}
            </ul>
          </div>

          {/* Tips */}
          <div className="bg-white rounded-lg p-3">
            <h4 className="font-semibold text-gray-800 mb-2">💡 Dicas importantes:</h4>
            <ul className="space-y-1">
              {currentExercise.tips.map((tip, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Exercise Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Exercício {currentExerciseIndex + 1} de {exercises.length}</span>
            <span>{formatTime(timer)} / {formatTime(currentExercise.duration)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(timer / currentExercise.duration) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex space-x-3">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
            >
              <Play className="w-5 h-5" />
              <span>Iniciar</span>
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
            >
              <Pause className="w-5 h-5" />
              <span>Pausar</span>
            </button>
          )}
          
          <button
            onClick={handleSkip}
            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Exercise List Preview */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-3">Sequência do Aquecimento:</h4>
          <div className="space-y-2">
            {exercises.map((exercise, index) => (
              <div 
                key={index} 
                className={`flex justify-between items-center text-sm p-2 rounded ${
                  index === currentExerciseIndex 
                    ? 'bg-yellow-200 text-yellow-800' 
                    : index < currentExerciseIndex 
                      ? 'bg-green-100 text-green-700' 
                      : 'text-gray-600'
                }`}
              >
                <span className="flex items-center">
                  {index < currentExerciseIndex && <CheckCircle className="w-4 h-4 mr-2" />}
                  {index === currentExerciseIndex && <Clock className="w-4 h-4 mr-2" />}
                  {exercise.name}
                </span>
                <span>{formatTime(exercise.duration)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Circle, RotateCcw, Trophy, User, Hash, Bot, Users } from 'lucide-react';

type Player = 'X' | 'O' | null;
type GameMode = 'PvP' | 'PvE';

export default function App() {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState<Player | 'Draw'>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [scores, setScores] = useState({ X: 0, O: 0, Draws: 0 });
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);

  const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ];

  const checkWinner = useCallback((currentBoard: Player[]) => {
    for (const combo of winningCombinations) {
      const [a, b, c] = combo;
      if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
        return { winner: currentBoard[a], line: combo };
      }
    }
    if (currentBoard.every(cell => cell !== null)) {
      return { winner: 'Draw' as const, line: null };
    }
    return null;
  }, []);

  // Minimax Algorithm for AI
  const minimax = (currentBoard: Player[], depth: number, isMaximizing: boolean): number => {
    const result = checkWinner(currentBoard);
    if (result?.winner === 'O') return 10 - depth;
    if (result?.winner === 'X') return depth - 10;
    if (result?.winner === 'Draw') return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (!currentBoard[i]) {
          currentBoard[i] = 'O';
          const score = minimax(currentBoard, depth + 1, false);
          currentBoard[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (!currentBoard[i]) {
          currentBoard[i] = 'X';
          const score = minimax(currentBoard, depth + 1, true);
          currentBoard[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  };

  const getBestMove = (currentBoard: Player[]) => {
    let bestScore = -Infinity;
    let move = -1;
    for (let i = 0; i < 9; i++) {
      if (!currentBoard[i]) {
        currentBoard[i] = 'O';
        const score = minimax(currentBoard, 0, false);
        currentBoard[i] = null;
        if (score > bestScore) {
          bestScore = score;
          move = i;
        }
      }
    }
    return move;
  };

  const makeMove = useCallback((index: number) => {
    if (board[index] || winner || isAiThinking) return;

    const newBoard = [...board];
    const currentPlayer = isXNext ? 'X' : 'O';
    newBoard[index] = currentPlayer;
    setBoard(newBoard);
    
    const result = checkWinner(newBoard);
    if (result) {
      setWinner(result.winner);
      setWinningLine(result.line);
      if (result.winner === 'X') setScores(s => ({ ...s, X: s.X + 1 }));
      else if (result.winner === 'O') setScores(s => ({ ...s, O: s.O + 1 }));
      else if (result.winner === 'Draw') setScores(s => ({ ...s, Draws: s.Draws + 1 }));
    } else {
      setIsXNext(!isXNext);
    }
  }, [board, winner, isXNext, isAiThinking, checkWinner]);

  // AI Turn Logic
  useEffect(() => {
    if (gameMode === 'PvE' && !isXNext && !winner) {
      setIsAiThinking(true);
      const timer = setTimeout(() => {
        const currentBoard = [...board];
        const bestMove = getBestMove(currentBoard);
        
        // We must set thinking to false BEFORE calling makeMove 
        // because makeMove checks this state to prevent illegal moves.
        setIsAiThinking(false);
        
        if (bestMove !== -1) {
          makeMove(bestMove);
        }
      }, 600); // Slight delay for "thinking" feel
      return () => clearTimeout(timer);
    }
  }, [isXNext, gameMode, winner, board, makeMove]);

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    setWinningLine(null);
    setIsAiThinking(false);
  };

  const changeMode = (mode: GameMode) => {
    setGameMode(mode);
    setScores({ X: 0, O: 0, Draws: 0 });
    resetGame();
  };

  if (!gameMode) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <div className="mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-3xl mb-6 text-indigo-600">
              <Hash size={48} />
            </div>
            <h1 className="text-5xl font-black tracking-tight mb-3">Tic Tac Toe</h1>
            <p className="text-zinc-500 text-lg">Escolha seu modo de jogo para começar</p>
          </div>

          <div className="grid gap-4">
            <ModeButton 
              onClick={() => changeMode('PvP')}
              icon={<Users size={24} />}
              title="Dois Jogadores"
              description="Desafie um amigo localmente"
              color="indigo"
            />
            <ModeButton 
              onClick={() => changeMode('PvE')}
              icon={<Bot size={24} />}
              title="Contra IA"
              description="Teste suas habilidades contra o computador"
              color="rose"
            />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => setGameMode(null)}
            className="p-2 hover:bg-zinc-100 rounded-xl transition-colors text-zinc-400 hover:text-zinc-900"
          >
            <RotateCcw size={20} className="rotate-[-45deg]" />
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight flex items-center justify-center gap-2">
              {gameMode === 'PvE' ? <Bot size={24} className="text-rose-500" /> : <Users size={24} className="text-indigo-600" />}
              {gameMode === 'PvE' ? 'Contra IA' : 'Dois Jogadores'}
            </h1>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Score Board */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <ScoreCard 
            label="Você (X)" 
            value={scores.X} 
            active={isXNext && !winner} 
            color="indigo" 
            icon={<X size={18} />} 
          />
          <ScoreCard 
            label="Empates" 
            value={scores.Draws} 
            active={false} 
            color="zinc" 
            icon={<User size={18} />} 
          />
          <ScoreCard 
            label={gameMode === 'PvE' ? 'IA (O)' : 'Amigo (O)'} 
            value={scores.O} 
            active={!isXNext && !winner} 
            color="rose" 
            icon={<Circle size={16} />} 
          />
        </div>

        {/* Game Board */}
        <div className="relative bg-white rounded-3xl shadow-xl shadow-indigo-100/50 p-6 border border-zinc-100">
          <div className="grid grid-cols-3 gap-3">
            {board.map((cell, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: cell || winner || isAiThinking ? 1 : 1.02 }}
                whileTap={{ scale: cell || winner || isAiThinking ? 1 : 0.95 }}
                onClick={() => makeMove(i)}
                className={`
                  h-24 sm:h-28 rounded-2xl flex items-center justify-center text-4xl transition-colors
                  ${!cell && !winner && !isAiThinking ? 'hover:bg-zinc-50 bg-zinc-50/50' : 'bg-zinc-50/20'}
                  ${winningLine?.includes(i) ? 'bg-indigo-50 border-2 border-indigo-200' : 'border border-transparent'}
                  ${isAiThinking && !isXNext ? 'cursor-wait' : ''}
                `}
                disabled={!!cell || !!winner || isAiThinking}
              >
                <AnimatePresence mode="wait">
                  {cell === 'X' && (
                    <motion.div
                      key="X"
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="text-indigo-600"
                    >
                      <X size={48} strokeWidth={2.5} />
                    </motion.div>
                  )}
                  {cell === 'O' && (
                    <motion.div
                      key="O"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-rose-500"
                    >
                      <Circle size={42} strokeWidth={2.5} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </div>

          {/* Winner Overlay */}
          <AnimatePresence>
            {winner && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm rounded-3xl p-6 text-center"
              >
                <motion.div
                  initial={{ y: 10 }}
                  animate={{ y: 0 }}
                  className="mb-4"
                >
                  {winner === 'Draw' ? (
                    <div className="bg-zinc-100 p-4 rounded-full mb-4 inline-block">
                      <User size={48} className="text-zinc-500" />
                    </div>
                  ) : (
                    <div className={`p-4 rounded-full mb-4 inline-block ${winner === 'X' ? 'bg-indigo-100' : 'bg-rose-100'}`}>
                      <Trophy size={48} className={winner === 'X' ? 'text-indigo-600' : 'text-rose-500'} />
                    </div>
                  )}
                  <h2 className="text-3xl font-bold mb-1">
                    {winner === 'Draw' ? 'Empate!' : `Vitória do ${winner}!`}
                  </h2>
                  <p className="text-zinc-500">
                    {winner === 'Draw' ? 'Ninguém venceu desta vez.' : 'Parabéns pela excelente partida!'}
                  </p>
                </motion.div>
                
                <button
                  onClick={resetGame}
                  className="mt-4 flex items-center gap-2 bg-zinc-900 text-white px-8 py-3 rounded-2xl font-semibold hover:bg-zinc-800 transition-colors shadow-lg shadow-zinc-200"
                >
                  <RotateCcw size={20} />
                  Jogar Novamente
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI Thinking Indicator */}
          <AnimatePresence>
            {isAiThinking && !winner && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-rose-500 font-medium bg-rose-50 px-4 py-2 rounded-full border border-rose-100"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                  <RotateCcw size={16} />
                </motion.div>
                IA está pensando...
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Controls */}
        <div className="mt-8 flex justify-center">
          {!winner && (
            <button
              onClick={resetGame}
              className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 font-medium transition-colors"
            >
              <RotateCcw size={18} />
              Reiniciar Partida
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function ModeButton({ onClick, icon, title, description, color }: { onClick: () => void, icon: React.ReactNode, title: string, description: string, color: 'indigo' | 'rose' }) {
  const colorClasses = {
    indigo: 'hover:border-indigo-200 hover:bg-indigo-50/50 text-indigo-600 bg-white shadow-sm',
    rose: 'hover:border-rose-200 hover:bg-rose-50/50 text-rose-500 bg-white shadow-sm'
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-5 p-6 rounded-3xl border border-zinc-100 transition-all text-left ${colorClasses[color]}`}
    >
      <div className={`p-4 rounded-2xl ${color === 'indigo' ? 'bg-indigo-100' : 'bg-rose-100'}`}>
        {icon}
      </div>
      <div>
        <h3 className="text-xl font-bold text-zinc-900">{title}</h3>
        <p className="text-zinc-500 font-medium">{description}</p>
      </div>
    </button>
  );
}

function ScoreCard({ label, value, active, color, icon }: { label: string, value: number, active: boolean, color: 'indigo' | 'rose' | 'zinc', icon: React.ReactNode }) {
  const colors = {
    indigo: active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-zinc-600 border border-zinc-100',
    rose: active ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-white text-zinc-600 border border-zinc-100',
    zinc: 'bg-white text-zinc-600 border border-zinc-100'
  };

  return (
    <div className={`p-3 rounded-2xl text-center transition-all duration-300 ${colors[color]}`}>
      <div className="flex items-center justify-center gap-1.5 mb-1 opacity-80">
        {icon}
        <span className="text-[10px] uppercase tracking-wider font-bold">{label}</span>
      </div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      {active && (
        <motion.div 
          layoutId="active-indicator"
          className="h-1 w-4 bg-white/40 rounded-full mx-auto mt-1"
        />
      )}
    </div>
  );
}

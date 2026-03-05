import { useState, useEffect } from "react";
import { useSocket } from "@/context/SocketContext";
import { Button, Card } from "@/components/ui";
import { useLocation, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle, XCircle, Clock } from "lucide-react";

type GameState = 'lobby' | 'question' | 'result' | 'game_over';

export default function PlayerGame() {
  const { socket } = useSocket();
  const { pin } = useParams();
  const location = useLocation();
  const nickname = location.state?.nickname;
  
  const [gameState, setGameState] = useState<GameState>('lobby');
  const [question, setQuestion] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [lastPoints, setLastPoints] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on("game_started", () => {
      setGameState('question');
    });

    socket.on("new_question", (data) => {
      setGameState('question');
      setQuestion(data);
      setTimeLeft(data.timeLimit);
      setSelectedOption(null);
      setHasAnswered(false);
      setLastPoints(null);
      setCorrectIndex(null);
    });

    socket.on("question_results", (data) => {
      setGameState('result');
      setCorrectIndex(data.correctIndex);
      setLeaderboard(data.leaderboard);
    });

    socket.on("answer_received", (data) => {
      setLastPoints(data.points);
    });

    socket.on("game_over", (data) => {
      setGameState('game_over');
      setLeaderboard(data.leaderboard);
    });

    socket.on("host_disconnected", () => {
      alert("Host disconnected");
      window.location.href = "/";
    });

    return () => {
      socket.off("game_started");
      socket.off("new_question");
      socket.off("question_results");
      socket.off("answer_received");
      socket.off("game_over");
      socket.off("host_disconnected");
    };
  }, [socket]);

  // Timer effect
  useEffect(() => {
    if (gameState === 'question' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [gameState, timeLeft]);

  const handleAnswer = (index: number) => {
    if (hasAnswered) return;
    setSelectedOption(index);
    setHasAnswered(true);
    socket?.emit("player_submit_answer", { pin, answerIndex: index });
  };

  if (!nickname) return <div className="p-8 text-center">Error: No nickname provided. Please join again.</div>;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm flex justify-between items-center">
        <div className="font-bold text-slate-700">{nickname}</div>
        <div className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-mono">
          PIN: {pin}
        </div>
      </div>

      <div className="flex-1 p-4 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">
          {gameState === 'lobby' && (
            <motion.div 
              key="lobby"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-6"
            >
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm animate-pulse">
                <span className="text-4xl">🎮</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-800">You're in!</h2>
              <p className="text-slate-500">See your name on screen?<br/>Waiting for host to start...</p>
            </motion.div>
          )}

          {gameState === 'question' && question && (
            <motion.div 
              key="question"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="w-full space-y-6"
            >
              <div className="flex justify-between items-center text-sm font-medium text-slate-500">
                <span>Q {question.questionIndex + 1} / {question.totalQuestions}</span>
                <span className={`flex items-center gap-1 ${timeLeft < 5 ? 'text-red-500' : ''}`}>
                  <Clock size={16} /> {timeLeft}s
                </span>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm text-center">
                <h3 className="text-xl font-bold text-slate-900">{question.text}</h3>
              </div>

              <div className="grid gap-3">
                {question.options.map((opt: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    disabled={hasAnswered}
                    className={`
                      p-4 rounded-xl text-left font-medium transition-all transform active:scale-95
                      ${hasAnswered 
                        ? selectedOption === idx 
                          ? 'bg-indigo-600 text-white ring-2 ring-indigo-600 ring-offset-2' 
                          : 'bg-slate-200 text-slate-400'
                        : 'bg-white hover:bg-indigo-50 text-slate-700 shadow-sm border border-slate-200'
                      }
                    `}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              
              {hasAnswered && (
                <div className="text-center text-slate-500 animate-pulse">
                  Answer submitted! Waiting for others...
                </div>
              )}
            </motion.div>
          )}

          {gameState === 'result' && (
            <motion.div 
              key="result"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center space-y-6 w-full"
            >
              <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto ${
                selectedOption === correctIndex ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}>
                {selectedOption === correctIndex ? <CheckCircle size={64} /> : <XCircle size={64} />}
              </div>
              
              <div>
                <h2 className="text-3xl font-black text-slate-900">
                  {selectedOption === correctIndex ? 'Correct!' : 'Incorrect'}
                </h2>
                <p className="text-slate-500 mt-2">
                  {selectedOption === correctIndex ? `+${lastPoints} points` : 'Better luck next time!'}
                </p>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm text-left">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Leaderboard</h4>
                {leaderboard.map((p, i) => (
                  <div key={i} className={`flex justify-between py-2 border-b border-slate-50 last:border-0 ${p.nickname === nickname ? 'font-bold text-indigo-600' : 'text-slate-600'}`}>
                    <span>{i + 1}. {p.nickname}</span>
                    <span>{p.score}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {gameState === 'game_over' && (
            <motion.div 
              key="gameover"
              className="text-center space-y-8 w-full"
            >
              <h1 className="text-4xl font-black text-slate-900">Game Over!</h1>
              
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-indigo-600 p-4 text-white">
                  <h3 className="font-bold text-lg">Final Standings</h3>
                </div>
                <div className="p-4">
                  {leaderboard.map((p, i) => (
                    <div key={i} className={`flex items-center justify-between p-3 rounded-lg mb-2 ${i === 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-slate-50'}`}>
                      <div className="flex items-center gap-3">
                        <span className={`
                          w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm
                          ${i === 0 ? 'bg-yellow-400 text-yellow-900' : 'bg-slate-200 text-slate-600'}
                        `}>
                          {i + 1}
                        </span>
                        <span className="font-medium text-slate-800">{p.nickname}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-600">{p.score}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={() => window.location.href = '/'} variant="outline">
                Back to Home
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

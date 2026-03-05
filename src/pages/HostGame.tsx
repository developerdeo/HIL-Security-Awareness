import { useState, useEffect } from "react";
import { useSocket } from "@/context/SocketContext";
import { useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Button, Card } from "@/components/ui";
import { Users, Play, ArrowRight, BarChart2 } from "lucide-react";
import { motion } from "motion/react";

export default function HostGame() {
  const { socket } = useSocket();
  const { quizId } = useParams();
  const [pin, setPin] = useState("");
  const [players, setPlayers] = useState<string[]>([]);
  const [status, setStatus] = useState<'lobby' | 'active' | 'finished'>('lobby');
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [answersCount, setAnswersCount] = useState(0);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (!socket || !quizId) return;

    // Initialize game
    socket.emit("host_create_game", { quizId });

    socket.on("game_created", (data) => {
      setPin(data.pin);
    });

    socket.on("player_joined", (data) => {
      setPlayers(prev => [...prev, data.nickname]);
    });

    socket.on("player_left", (data) => {
        setPlayers(prev => prev.filter(p => p !== data.nickname));
    });

    socket.on("update_answers_count", (data) => {
      setAnswersCount(data.count);
    });

    socket.on("game_over", (data) => {
        setStatus('finished');
        setLeaderboard(data.leaderboard);
    });

    return () => {
      socket.off("game_created");
      socket.off("player_joined");
      socket.off("player_left");
      socket.off("update_answers_count");
      socket.off("game_over");
    };
  }, [socket, quizId]);

  const startGame = () => {
    socket?.emit("host_start_game", { pin });
    setStatus('active');
    // We need to listen for the first question
    socket?.on("new_question", (data) => {
        setCurrentQuestion(data);
        setAnswersCount(0);
        setShowResults(false);
    });
  };

  const nextQuestion = () => {
    socket?.emit("host_next_question", { pin });
  };

  const showQuestionResults = () => {
    socket?.emit("host_show_results", { pin });
    setShowResults(true);
    socket?.on("question_results", (data) => {
        setLeaderboard(data.leaderboard);
    });
  };

  if (!pin) return <div className="flex items-center justify-center min-h-screen">Creating Game Room...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      {status === 'lobby' && (
        <div className="max-w-6xl mx-auto flex flex-col items-center justify-center min-h-[80vh] space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-2xl text-slate-400 font-medium tracking-wide uppercase">Join at {window.location.hostname}</h2>
            <div className="bg-white text-slate-900 text-8xl font-black tracking-widest py-6 px-12 rounded-3xl font-mono inline-block">
              {pin}
            </div>
          </div>

          <div className="flex gap-12 items-center">
            <div className="bg-white p-4 rounded-xl">
              <QRCodeSVG value={`${window.location.origin}/join?pin=${pin}`} size={200} />
            </div>
            <div className="w-px h-32 bg-slate-700" />
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-3xl font-bold">
                <Users className="text-indigo-400" size={32} />
                <span>{players.length} Players</span>
              </div>
              <p className="text-slate-500">Waiting for players...</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-center max-w-4xl">
            {players.map((p, i) => (
              <motion.div 
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                key={i} 
                className="bg-slate-800 px-4 py-2 rounded-lg font-medium border border-slate-700"
              >
                {p}
              </motion.div>
            ))}
          </div>

          <Button 
            onClick={startGame} 
            size="lg" 
            className="text-2xl px-12 py-8 bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20"
            disabled={players.length === 0}
          >
            Start Game
          </Button>
        </div>
      )}

      {status === 'active' && currentQuestion && (
        <div className="max-w-5xl mx-auto min-h-[80vh] flex flex-col">
          <div className="flex justify-between items-center mb-12">
             <div className="text-slate-400 font-mono">Q {currentQuestion.questionIndex + 1} / {currentQuestion.totalQuestions}</div>
             <div className="bg-slate-800 px-4 py-2 rounded-full font-mono text-indigo-400">{pin}</div>
          </div>

          {!showResults ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-12">
              <h2 className="text-4xl font-bold text-center leading-tight max-w-4xl">
                {currentQuestion.text}
              </h2>

              <div className="grid grid-cols-2 gap-6 w-full max-w-4xl">
                {currentQuestion.options.map((opt: string, i: number) => (
                  <div key={i} className="bg-slate-800 p-6 rounded-xl border border-slate-700 text-xl font-medium">
                    {opt}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="text-6xl font-black text-indigo-500">{answersCount}</div>
                  <div className="text-slate-500 uppercase text-sm font-bold tracking-wider">Answers</div>
                </div>
                <div className="w-px h-16 bg-slate-800" />
                <div className="text-center">
                   <div className="text-6xl font-black text-slate-200">{currentQuestion.timeLimit}</div>
                   <div className="text-slate-500 uppercase text-sm font-bold tracking-wider">Seconds</div>
                </div>
              </div>

              <Button onClick={showQuestionResults} size="lg" className="mt-8">
                Show Results
              </Button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center space-y-8">
               <h2 className="text-3xl font-bold mb-8">Leaderboard</h2>
               <div className="w-full max-w-2xl space-y-2">
                 {leaderboard.map((p, i) => (
                   <motion.div 
                     layout
                     key={p.nickname}
                     className="bg-slate-800 p-4 rounded-xl flex justify-between items-center border border-slate-700"
                   >
                     <div className="flex items-center gap-4">
                       <span className="font-mono text-slate-500 w-6">#{i + 1}</span>
                       <span className="font-bold text-lg">{p.nickname}</span>
                     </div>
                     <span className="font-mono text-indigo-400">{p.score} pts</span>
                   </motion.div>
                 ))}
               </div>
               
               <Button onClick={nextQuestion} size="lg" className="mt-8 gap-2">
                 Next Question <ArrowRight size={20} />
               </Button>
            </div>
          )}
        </div>
      )}

      {status === 'finished' && (
        <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-12">
          <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
            Final Podium
          </h1>
          
          <div className="flex items-end gap-4">
            {/* 2nd Place */}
            {leaderboard[1] && (
              <div className="flex flex-col items-center">
                <div className="text-xl font-bold mb-2">{leaderboard[1].nickname}</div>
                <div className="w-32 h-48 bg-slate-700 rounded-t-lg flex items-center justify-center text-4xl font-black text-slate-500">
                  2
                </div>
                <div className="mt-2 font-mono text-slate-400">{leaderboard[1].score}</div>
              </div>
            )}

            {/* 1st Place */}
            {leaderboard[0] && (
              <div className="flex flex-col items-center">
                <div className="text-2xl font-bold mb-2 text-yellow-400">👑 {leaderboard[0].nickname}</div>
                <div className="w-40 h-64 bg-slate-800 border-t-4 border-yellow-400 rounded-t-lg flex items-center justify-center text-6xl font-black text-white shadow-2xl shadow-yellow-500/20">
                  1
                </div>
                <div className="mt-2 font-mono text-yellow-400 font-bold text-xl">{leaderboard[0].score}</div>
              </div>
            )}

            {/* 3rd Place */}
            {leaderboard[2] && (
              <div className="flex flex-col items-center">
                <div className="text-xl font-bold mb-2">{leaderboard[2].nickname}</div>
                <div className="w-32 h-32 bg-slate-700 rounded-t-lg flex items-center justify-center text-4xl font-black text-slate-500">
                  3
                </div>
                <div className="mt-2 font-mono text-slate-400">{leaderboard[2].score}</div>
              </div>
            )}
          </div>

          <Button onClick={() => window.location.href = '/host'} variant="outline" className="mt-12 text-white border-slate-600 hover:bg-slate-800">
            Back to Dashboard
          </Button>
        </div>
      )}
    </div>
  );
}

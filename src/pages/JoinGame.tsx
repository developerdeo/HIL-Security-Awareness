import { useState, useEffect } from "react";
import { useSocket } from "@/context/SocketContext";
import { Button, Input, Card } from "@/components/ui";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";

export default function JoinGame() {
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!socket) return;

    socket.on("joined_success", (data) => {
      navigate(`/game/${data.pin}`, { state: { nickname: data.nickname } });
    });

    socket.on("error", (msg) => {
      setError(msg);
    });

    return () => {
      socket.off("joined_success");
      socket.off("error");
    };
  }, [socket, navigate]);

  const handleJoin = () => {
    if (!pin || !nickname) {
      setError("Please fill in all fields");
      return;
    }
    socket?.emit("player_join", { pin: pin.toUpperCase(), nickname });
  };

  return (
    <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md"
      >
        <Card className="space-y-6 p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900">Join Game</h2>
            <p className="text-slate-500">Enter the PIN on the host's screen</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Game PIN</label>
              <Input 
                value={pin} 
                onChange={(e) => setPin(e.target.value.toUpperCase())}
                placeholder="ABCD12"
                className="text-center text-2xl tracking-widest uppercase font-mono"
                maxLength={6}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nickname</label>
              <Input 
                value={nickname} 
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter your name"
                className="text-center text-lg"
                maxLength={12}
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center font-medium bg-red-50 p-2 rounded-lg">
                {error}
              </p>
            )}

            <Button onClick={handleJoin} className="w-full h-14 text-lg">
              Enter Lobby
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

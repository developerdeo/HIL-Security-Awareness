import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SocketProvider } from "@/context/SocketContext";
import Home from "@/pages/Home";
import JoinGame from "@/pages/JoinGame";
import PlayerGame from "@/pages/PlayerGame";
import HostDashboard from "@/pages/HostDashboard";
import HostCreate from "@/pages/HostCreate";
import HostGame from "@/pages/HostGame";

export default function App() {
  return (
    <SocketProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/join" element={<JoinGame />} />
          <Route path="/game/:pin" element={<PlayerGame />} />
          
          <Route path="/host" element={<HostDashboard />} />
          <Route path="/host/create" element={<HostCreate />} />
          <Route path="/host/lobby/:quizId" element={<HostGame />} />
        </Routes>
      </BrowserRouter>
    </SocketProvider>
  );
}

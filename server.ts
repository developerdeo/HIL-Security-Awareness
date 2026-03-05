import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { setupSocketHandlers } from "./src/server/socket";
import { initDb } from "./src/server/db";

import { getAllQuizzes, createQuiz, addQuestion, getQuiz } from "./src/server/db";
import { nanoid } from "nanoid";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer);
  const PORT = 3000;

  app.use(express.json());

  // Initialize Database
  initDb();

  // Setup Socket.io logic
  setupSocketHandlers(io);

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/quizzes", (req, res) => {
    res.json(getAllQuizzes());
  });

  app.post("/api/quizzes", (req, res) => {
    const { title, questions } = req.body;
    const quizId = nanoid();
    
    createQuiz(quizId, title);
    
    questions.forEach((q: any) => {
      addQuestion(nanoid(), quizId, q.text, q.options, q.correctIndex, q.timeLimit);
    });
    
    res.json({ success: true, quizId });
  });

  app.get("/api/quizzes/:id", (req, res) => {
    const quiz = getQuiz(req.params.id);
    if (!quiz) return res.status(404).json({ error: "Not found" });
    res.json(quiz);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

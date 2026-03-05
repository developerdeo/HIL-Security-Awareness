import { Server, Socket } from "socket.io";
import { nanoid } from "nanoid";
import { getQuiz } from "./db";

// In-memory game state
interface Player {
  id: string;
  nickname: string;
  score: number;
  answers: Record<string, number>; // questionId -> timeTaken
}

interface GameSession {
  pin: string;
  hostId: string;
  quizId: string;
  quiz: any; // Cached quiz data
  status: 'lobby' | 'active' | 'finished';
  currentQuestionIndex: number;
  players: Record<string, Player>;
  questionStartTime: number | null;
  answersReceived: number;
}

const games: Record<string, GameSession> = {};

export function setupSocketHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log("User connected:", socket.id);

    // --- HOST EVENTS ---

    socket.on("host_create_game", ({ quizId }) => {
      const quiz = getQuiz(quizId);
      if (!quiz) {
        socket.emit("error", "Quiz not found");
        return;
      }

      const pin = nanoid(6).toUpperCase();
      games[pin] = {
        pin,
        hostId: socket.id,
        quizId,
        quiz,
        status: 'lobby',
        currentQuestionIndex: -1,
        players: {},
        questionStartTime: null,
        answersReceived: 0
      };

      socket.join(pin);
      socket.emit("game_created", { pin, quizTitle: quiz.title });
      console.log(`Game created: ${pin} for quiz ${quizId}`);
    });

    socket.on("host_start_game", ({ pin }) => {
      const game = games[pin];
      if (!game || game.hostId !== socket.id) return;

      game.status = 'active';
      game.currentQuestionIndex = 0;
      game.questionStartTime = Date.now();
      game.answersReceived = 0;

      io.to(pin).emit("game_started");
      
      // Send first question
      const question = game.quiz.questions[0];
      io.to(pin).emit("new_question", {
        questionIndex: 0,
        text: question.text,
        options: question.options,
        timeLimit: question.time_limit,
        totalQuestions: game.quiz.questions.length
      });
    });

    socket.on("host_next_question", ({ pin }) => {
      const game = games[pin];
      if (!game || game.hostId !== socket.id) return;

      game.currentQuestionIndex++;
      
      if (game.currentQuestionIndex >= game.quiz.questions.length) {
        game.status = 'finished';
        io.to(pin).emit("game_over", { leaderboard: getLeaderboard(game) });
        return;
      }

      game.questionStartTime = Date.now();
      game.answersReceived = 0;
      
      const question = game.quiz.questions[game.currentQuestionIndex];
      io.to(pin).emit("new_question", {
        questionIndex: game.currentQuestionIndex,
        text: question.text,
        options: question.options,
        timeLimit: question.time_limit,
        totalQuestions: game.quiz.questions.length
      });
    });

    socket.on("host_show_results", ({ pin }) => {
       const game = games[pin];
       if (!game || game.hostId !== socket.id) return;
       
       // Send correct answer and interim leaderboard
       const question = game.quiz.questions[game.currentQuestionIndex];
       io.to(pin).emit("question_results", {
         correctIndex: question.correct_index,
         leaderboard: getLeaderboard(game).slice(0, 5) // Top 5
       });
    });

    // --- PLAYER EVENTS ---

    socket.on("player_join", ({ pin, nickname }) => {
      const game = games[pin];
      if (!game) {
        socket.emit("error", "Game not found");
        return;
      }
      if (game.status !== 'lobby') {
        socket.emit("error", "Game already started");
        return;
      }

      // Prevent duplicate nicknames
      const isDuplicate = Object.values(game.players).some(p => p.nickname === nickname);
      if (isDuplicate) {
        socket.emit("error", "Nickname taken");
        return;
      }

      game.players[socket.id] = {
        id: socket.id,
        nickname,
        score: 0,
        answers: {}
      };

      socket.join(pin);
      socket.emit("joined_success", { pin, nickname });
      io.to(game.hostId).emit("player_joined", { nickname, total: Object.keys(game.players).length });
    });

    socket.on("player_submit_answer", ({ pin, answerIndex }) => {
      const game = games[pin];
      if (!game || !game.players[socket.id]) return;
      
      // Prevent multiple answers for same question
      const currentQIndex = game.currentQuestionIndex;
      if (game.players[socket.id].answers[currentQIndex] !== undefined) return;

      const question = game.quiz.questions[currentQIndex];
      const now = Date.now();
      const timeTaken = (now - (game.questionStartTime || now)) / 1000;
      
      // Calculate Score
      let points = 0;
      if (answerIndex === question.correct_index) {
        // Base score 1000, decays linearly to 500 over time limit
        const ratio = 1 - (timeTaken / question.time_limit);
        points = Math.round(500 + (500 * Math.max(0, ratio)));
      }

      game.players[socket.id].score += points;
      game.players[socket.id].answers[currentQIndex] = points;
      game.answersReceived++;

      io.to(game.hostId).emit("update_answers_count", { count: game.answersReceived, total: Object.keys(game.players).length });
      socket.emit("answer_received", { points }); // Don't tell them if it's right yet
    });

    socket.on("disconnect", () => {
      // Handle player disconnect
      for (const pin in games) {
        const game = games[pin];
        if (game.players[socket.id]) {
          const nickname = game.players[socket.id].nickname;
          delete game.players[socket.id];
          io.to(game.hostId).emit("player_left", { nickname, total: Object.keys(game.players).length });
        }
        // Handle host disconnect? Maybe keep game alive for a bit?
        if (game.hostId === socket.id) {
            io.to(pin).emit("host_disconnected");
            delete games[pin];
        }
      }
    });
  });
}

function getLeaderboard(game: GameSession) {
  return Object.values(game.players)
    .sort((a, b) => b.score - a.score)
    .map(p => ({ nickname: p.nickname, score: p.score }));
}

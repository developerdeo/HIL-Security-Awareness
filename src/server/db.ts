import Database from 'better-sqlite3';

const db = new Database('quiz.db');

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_at INTEGER DEFAULT (unixepoch())
    );
    
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      quiz_id TEXT NOT NULL,
      text TEXT NOT NULL,
      options TEXT NOT NULL, -- JSON array of strings
      correct_index INTEGER NOT NULL,
      time_limit INTEGER DEFAULT 20,
      FOREIGN KEY(quiz_id) REFERENCES quizzes(id)
    );
  `);
}

export function createQuiz(id: string, title: string) {
  const stmt = db.prepare('INSERT INTO quizzes (id, title) VALUES (?, ?)');
  stmt.run(id, title);
}

export function addQuestion(id: string, quizId: string, text: string, options: string[], correctIndex: number, timeLimit: number) {
  const stmt = db.prepare('INSERT INTO questions (id, quiz_id, text, options, correct_index, time_limit) VALUES (?, ?, ?, ?, ?, ?)');
  stmt.run(id, quizId, text, JSON.stringify(options), correctIndex, timeLimit);
}

export function getQuiz(id: string) {
  const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(id) as any;
  if (!quiz) return null;
  
  const questions = db.prepare('SELECT * FROM questions WHERE quiz_id = ?').all(id) as any[];
  return {
    ...quiz,
    questions: questions.map(q => ({
      ...q,
      options: JSON.parse(q.options)
    }))
  };
}

export function getAllQuizzes() {
  return db.prepare('SELECT * FROM quizzes ORDER BY created_at DESC').all();
}

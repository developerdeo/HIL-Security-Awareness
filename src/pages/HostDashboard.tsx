import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Card } from "@/components/ui";
import { Plus, Play } from "lucide-react";

export default function HostDashboard() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/quizzes')
      .then(res => res.json())
      .then(data => setQuizzes(data));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-slate-900">My Quizzes</h1>
          <Link to="/host/create">
            <Button className="gap-2">
              <Plus size={18} /> Create Quiz
            </Button>
          </Link>
        </div>

        <div className="grid gap-4">
          {quizzes.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              No quizzes yet. Create one to get started!
            </div>
          ) : (
            quizzes.map((quiz) => (
              <Card key={quiz.id} className="flex justify-between items-center p-6 hover:shadow-md transition-shadow">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{quiz.title}</h3>
                  <p className="text-sm text-slate-500">Created {new Date(quiz.created_at * 1000).toLocaleDateString()}</p>
                </div>
                <Button onClick={() => navigate(`/host/lobby/${quiz.id}`)} variant="secondary" className="gap-2">
                  <Play size={16} /> Host
                </Button>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

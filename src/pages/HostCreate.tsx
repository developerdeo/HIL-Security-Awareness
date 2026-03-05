import { useState, useRef, ChangeEvent } from "react";
import { Button, Input, Card } from "@/components/ui";
import { useNavigate } from "react-router-dom";
import { Plus, Trash, Save, Upload, HelpCircle, X } from "lucide-react";

export default function HostCreate() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [questions, setQuestions] = useState([
    { text: "", options: ["", "", "", ""], correctIndex: 0, timeLimit: 20 }
  ]);

  const handleAddQuestion = () => {
    setQuestions([...questions, { text: "", options: ["", "", "", ""], correctIndex: 0, timeLimit: 20 }]);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const newQuestions = [...questions];
    (newQuestions[index] as any)[field] = value;
    setQuestions(newQuestions);
  };

  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        let addedCount = 0;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
             const validQuestions = parsed.map(q => ({
               text: q.text || "",
               options: Array.isArray(q.options) ? q.options.slice(0, 4) : ["", "", "", ""],
               correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
               timeLimit: typeof q.timeLimit === 'number' ? q.timeLimit : 20
             }));
             setQuestions(prev => [...prev, ...validQuestions]);
             addedCount = validQuestions.length;
          }
        } else if (file.name.endsWith('.csv')) {
          const lines = content.split('\n');
          const newQuestions = [];
          // Skip header if it looks like a header
          const startIndex = lines[0].toLowerCase().includes('question') ? 1 : 0;
          
          for (let i = startIndex; i < lines.length; i++) {
             const line = lines[i].trim();
             if (!line) continue;
             
             // Robust CSV parsing handling quotes
             const parts: string[] = [];
             let current = '';
             let inQuotes = false;
             
             for (let j = 0; j < line.length; j++) {
               const char = line[j];
               if (char === '"') {
                 if (inQuotes && line[j+1] === '"') {
                   current += '"';
                   j++; // Skip next quote
                 } else {
                   inQuotes = !inQuotes;
                 }
               } else if (char === ',' && !inQuotes) {
                 parts.push(current.trim());
                 current = '';
               } else {
                 current += char;
               }
             }
             parts.push(current.trim());

             if (parts.length >= 6) {
                // Remove surrounding quotes if present
                const cleanParts = parts.map(p => p.replace(/^"|"$/g, ''));
                
                newQuestions.push({
                  text: cleanParts[0] || "",
                  options: [cleanParts[1] || "", cleanParts[2] || "", cleanParts[3] || "", cleanParts[4] || ""],
                  correctIndex: parseInt(cleanParts[5]) || 0,
                  timeLimit: parseInt(cleanParts[6]) || 20
                });
             }
          }
          if (newQuestions.length > 0) {
             setQuestions(prev => [...prev, ...newQuestions]);
             addedCount = newQuestions.length;
          }
        }
        
        if (addedCount > 0) {
          alert(`Successfully imported ${addedCount} questions!`);
        } else {
          alert("No valid questions found in file.");
        }
      } catch (err) {
        console.error(err);
        alert("Failed to parse file. Please ensure it is valid JSON or CSV.");
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const handleSave = async () => {
    if (!title) return alert("Please enter a title");
    
    // Send to API
    const response = await fetch('/api/quizzes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, questions })
    });

    if (response.ok) {
      await response.json();
      navigate('/host');
    } else {
      alert("Failed to save quiz");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-slate-900">Create New Quiz</h1>
          <div className="flex gap-2">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json,.csv"
              className="hidden"
            />
            <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="gap-2">
              <Upload size={18} /> Import
            </Button>
            <Button onClick={() => setShowHelp(!showHelp)} variant="ghost" className="gap-2 text-slate-500">
              <HelpCircle size={18} />
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Save size={18} /> Save Quiz
            </Button>
          </div>
        </div>

        {showHelp && (
          <Card className="bg-slate-50 border-indigo-100 p-6 relative">
            <button 
              onClick={() => setShowHelp(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
            <h3 className="font-bold text-lg mb-4 text-indigo-900">Import Format Guide</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-slate-700 mb-2">JSON Format (.json)</h4>
                <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg text-xs overflow-x-auto">
{`[
  {
    "text": "Question text here?",
    "options": [
      "Option A",
      "Option B", 
      "Option C",
      "Option D"
    ],
    "correctIndex": 0, // 0-3
    "timeLimit": 20
  }
]`}
                </pre>
              </div>
              <div>
                <h4 className="font-semibold text-slate-700 mb-2">CSV Format (.csv)</h4>
                <p className="text-xs text-slate-500 mb-2">Columns: Question, Opt1, Opt2, Opt3, Opt4, CorrectIndex, Time</p>
                <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg text-xs overflow-x-auto">
{`Question Text,Opt 1,Opt 2,Opt 3,Opt 4,Correct,Time
What is 2+2?,3,4,5,6,1,15
"Capital of France?","London","Paris","Berlin","Rome",1,20`}
                </pre>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6">
          <label className="block text-sm font-medium text-slate-700 mb-1">Quiz Title</label>
          <Input 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="e.g. Science Trivia 2024"
            className="text-lg font-medium"
          />
        </Card>

        <div className="space-y-6">
          {questions.map((q, qIndex) => (
            <Card key={qIndex} className="relative p-6 space-y-4">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold text-slate-400">Question {qIndex + 1}</h3>
                {questions.length > 1 && (
                  <button onClick={() => handleRemoveQuestion(qIndex)} className="text-red-400 hover:text-red-600">
                    <Trash size={18} />
                  </button>
                )}
              </div>

              <div>
                <Input 
                  value={q.text} 
                  onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                  placeholder="Enter your question here..."
                  className="mb-4"
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {q.options.map((opt, oIndex) => (
                    <div key={oIndex} className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name={`correct-${qIndex}`}
                        checked={q.correctIndex === oIndex}
                        onChange={() => handleQuestionChange(qIndex, 'correctIndex', oIndex)}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <Input 
                        value={opt}
                        onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                        placeholder={`Option ${oIndex + 1}`}
                        className={q.correctIndex === oIndex ? "border-green-500 ring-1 ring-green-500" : ""}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                 <label className="text-sm text-slate-600">Time Limit (seconds):</label>
                 <Input 
                   type="number" 
                   value={q.timeLimit}
                   onChange={(e) => handleQuestionChange(qIndex, 'timeLimit', parseInt(e.target.value))}
                   className="w-24"
                 />
              </div>
            </Card>
          ))}
        </div>

        <Button onClick={handleAddQuestion} variant="outline" className="w-full py-8 border-dashed border-2">
          <Plus size={20} className="mr-2" /> Add Question
        </Button>
      </div>
    </div>
  );
}

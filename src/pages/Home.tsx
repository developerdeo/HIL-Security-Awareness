import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card } from "@/components/ui";
import { motion } from "motion/react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center space-y-8"
      >
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tight text-slate-900">
            Quiz<span className="text-indigo-600">Master</span>
          </h1>
          <p className="text-slate-500 text-lg">
            Real-time multiplayer trivia battles.
          </p>
        </div>

        <div className="grid gap-4">
          <Link to="/join">
            <Button size="lg" className="w-full bg-indigo-600 hover:bg-indigo-700 h-16 text-xl">
              Join Game
            </Button>
          </Link>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-50 px-2 text-slate-500">Or</span>
            </div>
          </div>

          <Link to="/host">
            <Button variant="outline" size="lg" className="w-full h-14">
              Host a Quiz
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

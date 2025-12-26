import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { emotionsAPI, progressAPI } from "../services/api";

import WordOfTheDay from "../components/home/WordofTheDay";
import DailyProgress from "../components/home/DailyProgress";

export default function Home() {
  const [todayWord, setTodayWord] = useState(null);
  const [userProgress, setUserProgress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadTodayData();
  }, []);

  const loadTodayData = async () => {
    setIsLoading(true);
    try {
      // Get word of the day
      const word = await emotionsAPI.getWordOfTheDay();
      setTodayWord(word);

      // Get user progress
      const progress = await progressAPI.getProgress();
      setUserProgress(progress);
    } catch (error) {
      console.error("Error loading today's data:", error);
    }
    setIsLoading(false);
  };

  const handleStartQuiz = () => {
    navigate(createPageUrl("Quiz"));
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-96 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Welcome Message */}
      <div className="text-center py-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Ready to expand your emotional vocabulary? 
        </h2>
        <p className="text-gray-600">
          Discover a new emotion word every day and build your emotional intelligence
        </p>
      </div>

      {/* Progress Overview */}
      <DailyProgress userProgress={userProgress} />

      {/* Word of the Day */}
      <WordOfTheDay 
        word={todayWord} 
        onStartQuiz={handleStartQuiz}
      />

      {/* Quick Tips */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-200">
        <h3 className="font-semibold text-indigo-900 mb-3">💡 Daily Tip</h3>
        <p className="text-indigo-700 text-sm">
          Try using today's emotion word in a conversation or journal entry. 
          The more you use new vocabulary, the better you'll remember it!
        </p>
      </div>
    </div>
  );
}